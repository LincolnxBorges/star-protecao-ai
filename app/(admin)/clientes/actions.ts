"use server";

/**
 * Server Actions for Client Management
 * @module app/(admin)/clientes/actions
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  createClientInteraction,
  softDeleteClient,
  exportClientsCSV,
  getClientProfile,
  getClientQuotations,
} from "@/lib/clients";
import { createInteractionSchema } from "@/lib/validations/clients";
import type {
  ClientInteraction,
  CreateInteractionInput,
  ClientFilters,
  ClientProfile,
  ClientQuotationsSummary,
} from "@/lib/types/clients";

// ===========================================
// Helper: Get Current Seller Info
// ===========================================

async function getCurrentSellerInfo() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  // Get seller info
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, session.user.id));

  if (!seller) {
    throw new Error("SELLER_NOT_FOUND");
  }

  return {
    user: session.user,
    seller,
    isAdmin: seller.role === "ADMIN",
  };
}

async function requireAdmin() {
  const info = await getCurrentSellerInfo();

  if (!info.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  return info;
}

// ===========================================
// 1. createInteractionAction
// ===========================================

interface CreateInteractionActionResult {
  success: boolean;
  data?: ClientInteraction;
  error?: string;
}

export async function createInteractionAction(
  input: CreateInteractionInput
): Promise<CreateInteractionActionResult> {
  try {
    const { seller } = await getCurrentSellerInfo();

    // Validate input
    const validationResult = createInteractionSchema.safeParse(input);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return { success: false, error: firstIssue.message };
    }

    const data = validationResult.data;

    // Create interaction
    const interaction = await createClientInteraction(
      {
        customerId: data.customerId,
        type: data.type,
        result: data.result,
        description: data.description,
        scheduledFollowUp: data.scheduledFollowUp,
      },
      seller.id
    );

    return { success: true, data: interaction };
  } catch (error) {
    console.error("createInteractionAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "SELLER_NOT_FOUND") {
        return { success: false, error: "Vendedor nao encontrado" };
      }
    }

    return { success: false, error: "Erro ao registrar interacao" };
  }
}

// ===========================================
// 2. exportCSVAction
// ===========================================

interface ExportCSVActionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export async function exportCSVAction(
  filters: Omit<ClientFilters, "page" | "limit">
): Promise<ExportCSVActionResult> {
  try {
    const { seller, isAdmin } = await getCurrentSellerInfo();

    // Generate CSV
    const csv = await exportClientsCSV(seller.id, isAdmin, filters);

    return { success: true, data: csv };
  } catch (error) {
    console.error("exportCSVAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "SELLER_NOT_FOUND") {
        return { success: false, error: "Vendedor nao encontrado" };
      }
    }

    return { success: false, error: "Erro ao exportar clientes" };
  }
}

// ===========================================
// 3. deleteClientAction
// ===========================================

interface DeleteClientActionResult {
  success: boolean;
  error?: string;
}

export async function deleteClientAction(
  clientId: string
): Promise<DeleteClientActionResult> {
  try {
    const { seller } = await requireAdmin();

    // Soft delete client
    const result = await softDeleteClient(clientId, seller.id);

    if (!result.success) {
      return { success: false, error: "Cliente nao encontrado" };
    }

    return { success: true };
  } catch (error) {
    console.error("deleteClientAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado. Apenas administradores podem excluir clientes." };
      }
      if (error.message === "SELLER_NOT_FOUND") {
        return { success: false, error: "Vendedor nao encontrado" };
      }
    }

    return { success: false, error: "Erro ao excluir cliente" };
  }
}

// ===========================================
// 4. getClientProfileAction
// ===========================================

interface GetClientProfileActionResult {
  success: boolean;
  data?: ClientProfile;
  error?: string;
}

export async function getClientProfileAction(
  clientId: string
): Promise<GetClientProfileActionResult> {
  try {
    const { seller, isAdmin } = await getCurrentSellerInfo();

    // Get client profile
    const profile = await getClientProfile(clientId, seller.id, isAdmin);

    if (!profile) {
      return { success: false, error: "Cliente nao encontrado" };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error("getClientProfileAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "SELLER_NOT_FOUND") {
        return { success: false, error: "Vendedor nao encontrado" };
      }
    }

    return { success: false, error: "Erro ao carregar perfil do cliente" };
  }
}

// ===========================================
// 5. getClientQuotationsAction
// ===========================================

interface GetClientQuotationsActionResult {
  success: boolean;
  data?: ClientQuotationsSummary;
  error?: string;
}

export async function getClientQuotationsAction(
  clientId: string
): Promise<GetClientQuotationsActionResult> {
  try {
    const { seller, isAdmin } = await getCurrentSellerInfo();

    // Get client quotations
    const quotations = await getClientQuotations(clientId, seller.id, isAdmin);

    if (!quotations) {
      return { success: false, error: "Cliente nao encontrado ou sem permissao" };
    }

    return { success: true, data: quotations };
  } catch (error) {
    console.error("getClientQuotationsAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "SELLER_NOT_FOUND") {
        return { success: false, error: "Vendedor nao encontrado" };
      }
    }

    return { success: false, error: "Erro ao carregar cotacoes do cliente" };
  }
}
