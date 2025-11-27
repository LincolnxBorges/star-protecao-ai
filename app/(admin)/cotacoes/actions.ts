"use server";

/**
 * Server Actions for Quotation Management
 * @module app/(admin)/cotacoes/actions
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  listQuotationsWithFilters,
  getStatusCounts,
  getQuotationByIdWithAccessCheck,
  listQuotationActivities,
  createQuotationActivity,
  updateQuotationStatus,
} from "@/lib/quotations";
import {
  quotationFiltersSchema,
  updateStatusSchema,
  addNoteSchema,
  getQuotationSchema,
} from "@/lib/schemas/quotation-filters";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type {
  QuotationFilters,
  PaginatedResult,
  StatusCount,
  QuotationActivity,
  UpdateStatusResult,
  AddNoteResult,
} from "@/lib/types/quotations";
import type { QuotationWithRelations } from "@/lib/quotations";

// ===========================================
// Helper to get current user and seller info
// ===========================================

async function getCurrentUserAndSeller() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  // Get seller info if user is linked to a seller
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, session.user.id));

  return {
    user: session.user,
    seller,
    isAdmin: seller?.role === "ADMIN",
    sellerId: seller?.id,
  };
}

// ===========================================
// List Quotations Action
// ===========================================

interface ListQuotationsActionResult {
  success: boolean;
  data?: {
    items: QuotationWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    statusCounts: StatusCount[];
  };
  error?: string;
}

export async function listQuotationsAction(
  input: Partial<QuotationFilters>
): Promise<ListQuotationsActionResult> {
  try {
    const { isAdmin, sellerId } = await getCurrentUserAndSeller();

    // Parse and validate filters
    const filters = quotationFiltersSchema.parse(input);

    // Apply seller filter for non-admins
    const finalFilters: QuotationFilters = {
      ...filters,
      sellerId: isAdmin ? filters.sellerId : sellerId,
    };

    // Get quotations
    const { items, total } = await listQuotationsWithFilters(finalFilters);

    // Get status counts (filtered by seller if not admin)
    const statusCounts = await getStatusCounts(
      isAdmin ? undefined : sellerId
    );

    const totalPages = Math.ceil(total / finalFilters.limit!);

    return {
      success: true,
      data: {
        items,
        total,
        page: finalFilters.page!,
        limit: finalFilters.limit!,
        totalPages,
        statusCounts,
      },
    };
  } catch (error) {
    console.error("listQuotationsAction error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, error: "Nao autorizado" };
    }

    return { success: false, error: "Erro ao buscar cotacoes" };
  }
}

// ===========================================
// Get Status Counts Action
// ===========================================

interface GetStatusCountsResult {
  success: boolean;
  data?: {
    counts: StatusCount[];
    total: number;
  };
  error?: string;
}

export async function getStatusCountsAction(): Promise<GetStatusCountsResult> {
  try {
    const { isAdmin, sellerId } = await getCurrentUserAndSeller();

    const counts = await getStatusCounts(isAdmin ? undefined : sellerId);
    const total = counts.reduce((sum, item) => sum + item.count, 0);

    return {
      success: true,
      data: { counts, total },
    };
  } catch (error) {
    console.error("getStatusCountsAction error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, error: "Nao autorizado" };
    }

    return { success: false, error: "Erro ao buscar contadores" };
  }
}

// ===========================================
// Get Quotation Details Action
// ===========================================

interface GetQuotationDetailsResult {
  success: boolean;
  data?: {
    quotation: QuotationWithRelations;
    activities: QuotationActivity[];
    canEdit: boolean;
    canDelete: boolean;
    canReassign: boolean;
  };
  error?: string;
}

export async function getQuotationDetailsAction(
  input: { id: string }
): Promise<GetQuotationDetailsResult> {
  try {
    const { isAdmin, sellerId } = await getCurrentUserAndSeller();

    const { id } = getQuotationSchema.parse(input);

    const quotation = await getQuotationByIdWithAccessCheck(
      id,
      sellerId || null,
      isAdmin
    );

    if (!quotation) {
      return { success: false, error: "Cotacao nao encontrada" };
    }

    const activities = await listQuotationActivities(id);

    return {
      success: true,
      data: {
        quotation,
        activities,
        canEdit: !["EXPIRED", "REJECTED", "ACCEPTED", "CANCELLED"].includes(
          quotation.status
        ),
        canDelete: isAdmin,
        canReassign: isAdmin,
      },
    };
  } catch (error) {
    console.error("getQuotationDetailsAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso negado" };
      }
    }

    return { success: false, error: "Erro ao buscar detalhes" };
  }
}

// ===========================================
// Update Quotation Status Action
// ===========================================

export async function updateQuotationStatusAction(
  input: { id: string; status: string; notes?: string }
): Promise<UpdateStatusResult> {
  try {
    const { user, isAdmin, sellerId } = await getCurrentUserAndSeller();

    const { id, status, notes } = updateStatusSchema.parse(input);

    // Verify access
    const quotation = await getQuotationByIdWithAccessCheck(
      id,
      sellerId || null,
      isAdmin
    );

    if (!quotation) {
      return { success: false, error: "Cotacao nao encontrada" };
    }

    // Check if quotation is expired
    if (quotation.status === "EXPIRED") {
      return { success: false, error: "Cotacao expirada nao pode ser alterada" };
    }

    // Update status
    const updated = await updateQuotationStatus(
      id,
      status as "CONTACTED" | "ACCEPTED" | "CANCELLED",
      notes,
      isAdmin ? undefined : sellerId
    );

    if (!updated) {
      return { success: false, error: "Erro ao atualizar status" };
    }

    // Create activity record
    const activity = await createQuotationActivity({
      quotationId: id,
      type: "STATUS_CHANGE",
      description: `Status alterado para ${status}${notes ? `: ${notes}` : ""}`,
      authorId: user.id,
      authorName: user.name,
      metadata: {
        previousStatus: quotation.status,
        newStatus: status,
        notes,
      },
    });

    return {
      success: true,
      quotation: {
        id: updated.id,
        status: updated.status as "PENDING" | "CONTACTED" | "ACCEPTED" | "EXPIRED" | "CANCELLED" | "REJECTED",
      },
      activity,
    };
  } catch (error) {
    console.error("updateQuotationStatusAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso negado" };
      }
      if (error.message.includes("Invalid status transition")) {
        return { success: false, error: "Transicao de status invalida" };
      }
    }

    return { success: false, error: "Erro ao atualizar status" };
  }
}

// ===========================================
// Add Note Action
// ===========================================

export async function addQuotationNoteAction(
  input: { quotationId: string; type: string; description: string }
): Promise<AddNoteResult> {
  try {
    const { user, isAdmin, sellerId } = await getCurrentUserAndSeller();

    const { quotationId, type, description } = addNoteSchema.parse(input);

    // Verify access
    const quotation = await getQuotationByIdWithAccessCheck(
      quotationId,
      sellerId || null,
      isAdmin
    );

    if (!quotation) {
      return { success: false, error: "Cotacao nao encontrada" };
    }

    // Create activity record
    const activity = await createQuotationActivity({
      quotationId,
      type: type as "NOTE" | "CALL" | "EMAIL" | "WHATSAPP_SENT",
      description,
      authorId: user.id,
      authorName: user.name,
    });

    return {
      success: true,
      activity,
    };
  } catch (error) {
    console.error("addQuotationNoteAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso negado" };
      }
    }

    return { success: false, error: "Erro ao adicionar nota" };
  }
}
