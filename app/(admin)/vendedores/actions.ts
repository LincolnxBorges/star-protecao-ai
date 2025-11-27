"use server";

/**
 * Server Actions for Seller Management
 * @module app/(admin)/vendedores/actions
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  listSellersWithMetrics,
  getTeamMetrics,
  getRoundRobinConfig,
  updateRoundRobinConfig,
  reorderRoundRobinQueue,
  resetRoundRobinQueue,
  createSeller,
  updateSeller,
  isEmailInUse,
  changeSellerStatus,
  redistributeLeads,
  countPendingLeads,
  listActiveSellers,
  getSellerProfile,
  getSellerPendingLeads,
  reassignLeads,
  type PendingLead,
} from "@/lib/sellers";
import {
  createSellerSchema,
  updateSellerSchema,
  type SellerFilters,
  type SellerWithMetrics,
  type TeamMetrics,
  type StatusCounts,
  type RoundRobinConfig,
  type SellerQueueItem,
  type Seller,
  type SellerMetrics,
  type CreateSellerFormData,
  type UpdateSellerFormData,
} from "@/lib/types/sellers";
import { user, account } from "@/lib/schema";
import crypto from "crypto";

// Hash password using the same format as Better Auth
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

// Generate a random ID
function generateId(): string {
  return crypto.randomUUID();
}

// ===========================================
// Helper: Authorization Check
// ===========================================

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  // Get seller info to check role
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, session.user.id));

  if (!seller || seller.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return {
    user: session.user,
    seller,
  };
}

// ===========================================
// 1. listSellersAction
// ===========================================

interface ListSellersActionResult {
  success: boolean;
  data?: {
    items: SellerWithMetrics[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    statusCounts: StatusCounts;
    teamMetrics: TeamMetrics;
  };
  error?: string;
}

export async function listSellersAction(
  input: Partial<SellerFilters>
): Promise<ListSellersActionResult> {
  try {
    await requireAdmin();

    const filters: SellerFilters = {
      page: input.page || 1,
      limit: input.limit || 10,
      search: input.search,
      status: input.status,
      sortBy: input.sortBy || "name",
      sortOrder: input.sortOrder || "asc",
    };

    const { items, total, statusCounts } = await listSellersWithMetrics(filters);
    const teamMetrics = await getTeamMetrics();

    const totalPages = Math.ceil(total / filters.limit!);

    return {
      success: true,
      data: {
        items,
        total,
        page: filters.page!,
        limit: filters.limit!,
        totalPages,
        statusCounts,
        teamMetrics,
      },
    };
  } catch (error) {
    console.error("listSellersAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao buscar vendedores" };
  }
}

// ===========================================
// 3. createSellerAction
// ===========================================

interface CreateSellerActionResult {
  success: boolean;
  data?: Seller;
  error?: string;
}

export async function createSellerAction(
  input: CreateSellerFormData
): Promise<CreateSellerActionResult> {
  try {
    await requireAdmin();

    // Validate input
    const validationResult = createSellerSchema.safeParse(input);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return { success: false, error: firstIssue.message };
    }

    const data = validationResult.data;

    // Check if email is already in use
    const emailExists = await isEmailInUse(data.email);
    if (emailExists) {
      return { success: false, error: "Este email ja esta em uso" };
    }

    // Create user account in Better Auth
    const userId = generateId();
    const hashedPassword = await hashPassword(data.password);

    // Insert user
    await db.insert(user).values({
      id: userId,
      name: data.name,
      email: data.email,
      emailVerified: true,
    });

    // Insert account (credential provider)
    await db.insert(account).values({
      id: generateId(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    // Create seller record
    const seller = await createSeller({
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cargo: data.cargo,
      role: data.role,
      status: data.status,
      participateRoundRobin: data.participateRoundRobin,
      notifyEmail: data.notifyEmail,
      notifyWhatsapp: data.notifyWhatsapp,
    });

    return { success: true, data: seller };
  } catch (error) {
    console.error("createSellerAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao criar vendedor" };
  }
}

// ===========================================
// 4. updateSellerAction
// ===========================================

interface UpdateSellerActionResult {
  success: boolean;
  data?: Seller;
  error?: string;
}

export async function updateSellerAction(
  sellerId: string,
  input: UpdateSellerFormData
): Promise<UpdateSellerActionResult> {
  try {
    await requireAdmin();

    // Validate input
    const validationResult = updateSellerSchema.safeParse(input);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return { success: false, error: firstIssue.message };
    }

    const data = validationResult.data;

    // Check if email is already in use by another seller
    const emailExists = await isEmailInUse(data.email, sellerId);
    if (emailExists) {
      return { success: false, error: "Este email ja esta em uso por outro vendedor" };
    }

    // Update seller record
    const updatedSeller = await updateSeller(sellerId, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      cargo: data.cargo,
      role: data.role,
      notifyEmail: data.notifyEmail,
      notifyWhatsapp: data.notifyWhatsapp,
    });

    if (!updatedSeller) {
      return { success: false, error: "Vendedor nao encontrado" };
    }

    // Update user email if changed
    if (updatedSeller.userId) {
      await db
        .update(user)
        .set({ name: data.name, email: data.email })
        .where(eq(user.id, updatedSeller.userId));
    }

    return { success: true, data: updatedSeller };
  } catch (error) {
    console.error("updateSellerAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao atualizar vendedor" };
  }
}

// ===========================================
// 5. changeSellerStatusAction
// ===========================================

interface ChangeSellerStatusInput {
  newStatus: "ACTIVE" | "INACTIVE" | "VACATION";
  reason?: string;
  pendingLeadsAction?: "keep" | "redistribute" | "assign";
  assignToSellerId?: string;
}

interface ChangeSellerStatusActionResult {
  success: boolean;
  data?: {
    seller: Seller;
    redistributedLeads?: number;
  };
  error?: string;
}

export async function changeSellerStatusAction(
  sellerId: string,
  input: ChangeSellerStatusInput
): Promise<ChangeSellerStatusActionResult> {
  try {
    await requireAdmin();

    const { newStatus, reason, pendingLeadsAction, assignToSellerId } = input;

    // Primeiro, lidar com leads pendentes se necessario
    if (pendingLeadsAction && pendingLeadsAction !== "keep") {
      const { redistributed } = await redistributeLeads(
        sellerId,
        pendingLeadsAction === "assign" ? "assign" : "redistribute",
        assignToSellerId
      );

      // Alterar status do vendedor
      const updatedSeller = await changeSellerStatus(sellerId, newStatus, reason);
      if (!updatedSeller) {
        return { success: false, error: "Vendedor nao encontrado" };
      }

      return {
        success: true,
        data: {
          seller: updatedSeller,
          redistributedLeads: redistributed,
        },
      };
    }

    // Apenas alterar status (manter leads)
    const updatedSeller = await changeSellerStatus(sellerId, newStatus, reason);
    if (!updatedSeller) {
      return { success: false, error: "Vendedor nao encontrado" };
    }

    return {
      success: true,
      data: { seller: updatedSeller },
    };
  } catch (error) {
    console.error("changeSellerStatusAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao alterar status do vendedor" };
  }
}

// ===========================================
// 6. getActiveSellersAction (para select de redistribuicao)
// ===========================================

interface GetActiveSellersActionResult {
  success: boolean;
  data?: Array<{ id: string; name: string }>;
  error?: string;
}

export async function getActiveSellersAction(
  excludeSellerId?: string
): Promise<GetActiveSellersActionResult> {
  try {
    await requireAdmin();

    const activeSellers = await listActiveSellers();
    const filteredSellers = excludeSellerId
      ? activeSellers.filter((s) => s.id !== excludeSellerId)
      : activeSellers;

    return {
      success: true,
      data: filteredSellers.map((s) => ({ id: s.id, name: s.name })),
    };
  } catch (error) {
    console.error("getActiveSellersAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao buscar vendedores ativos" };
  }
}

// ===========================================
// 7. countPendingLeadsAction
// ===========================================

interface CountPendingLeadsActionResult {
  success: boolean;
  data?: number;
  error?: string;
}

export async function countPendingLeadsAction(
  sellerId: string
): Promise<CountPendingLeadsActionResult> {
  try {
    await requireAdmin();

    const count = await countPendingLeads(sellerId);

    return { success: true, data: count };
  } catch (error) {
    console.error("countPendingLeadsAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao contar leads pendentes" };
  }
}

// ===========================================
// 9. getRoundRobinConfigAction
// ===========================================

interface GetRoundRobinConfigActionResult {
  success: boolean;
  data?: {
    config: RoundRobinConfig;
    queue: SellerQueueItem[];
  };
  error?: string;
}

export async function getRoundRobinConfigAction(): Promise<GetRoundRobinConfigActionResult> {
  try {
    await requireAdmin();

    const { config, queue } = await getRoundRobinConfig();

    return {
      success: true,
      data: { config, queue },
    };
  } catch (error) {
    console.error("getRoundRobinConfigAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao buscar configuracao" };
  }
}

// ===========================================
// 10. updateRoundRobinConfigAction (T052)
// ===========================================

interface UpdateRoundRobinConfigInput {
  method?: "SEQUENTIAL" | "LOAD_BALANCE" | "PERFORMANCE" | "SPEED";
  pendingLeadLimit?: number | null;
  skipOverloaded?: boolean;
  notifyWhenAllOverloaded?: boolean;
}

interface UpdateRoundRobinConfigActionResult {
  success: boolean;
  data?: RoundRobinConfig;
  error?: string;
}

export async function updateRoundRobinConfigAction(
  input: UpdateRoundRobinConfigInput
): Promise<UpdateRoundRobinConfigActionResult> {
  try {
    await requireAdmin();

    const config = await updateRoundRobinConfig(input);

    return {
      success: true,
      data: config,
    };
  } catch (error) {
    console.error("updateRoundRobinConfigAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao atualizar configuracao" };
  }
}

// ===========================================
// 11. getSellerProfileAction (T045)
// ===========================================

type PeriodType = "thisMonth" | "last3Months" | "last6Months" | "lastYear";

interface GetSellerProfileActionResult {
  success: boolean;
  data?: {
    seller: Seller;
    metrics: SellerMetrics;
    monthlyEvolution: Array<{
      month: string;
      year: number;
      quotations: number;
      accepted: number;
    }>;
    recentQuotations: Array<{
      id: string;
      vehicleMarca: string;
      vehicleModelo: string;
      vehicleAno: string;
      customerName: string;
      mensalidade: number;
      status: string;
      createdAt: Date;
    }>;
  };
  error?: string;
}

export async function getSellerProfileAction(
  sellerId: string,
  period: PeriodType = "thisMonth"
): Promise<GetSellerProfileActionResult> {
  try {
    await requireAdmin();

    const profile = await getSellerProfile(sellerId, period);

    if (!profile) {
      return { success: false, error: "Vendedor nao encontrado" };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error("getSellerProfileAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao buscar perfil do vendedor" };
  }
}

// ===========================================
// 12. reorderRoundRobinQueueAction (T059)
// ===========================================

interface ReorderRoundRobinQueueActionResult {
  success: boolean;
  data?: {
    queue: SellerQueueItem[];
  };
  error?: string;
}

export async function reorderRoundRobinQueueAction(
  orderedSellerIds: string[]
): Promise<ReorderRoundRobinQueueActionResult> {
  try {
    await requireAdmin();

    if (!orderedSellerIds || orderedSellerIds.length === 0) {
      return { success: false, error: "Lista de vendedores vazia" };
    }

    const result = await reorderRoundRobinQueue(orderedSellerIds);

    return {
      success: true,
      data: { queue: result.queue },
    };
  } catch (error) {
    console.error("reorderRoundRobinQueueAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao reordenar fila" };
  }
}

// ===========================================
// 13. resetRoundRobinQueueAction (T060)
// ===========================================

interface ResetRoundRobinQueueActionResult {
  success: boolean;
  data?: {
    queue: SellerQueueItem[];
  };
  error?: string;
}

export async function resetRoundRobinQueueAction(): Promise<ResetRoundRobinQueueActionResult> {
  try {
    await requireAdmin();

    const result = await resetRoundRobinQueue();

    return {
      success: true,
      data: { queue: result.queue },
    };
  } catch (error) {
    console.error("resetRoundRobinQueueAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao resetar fila" };
  }
}

// ===========================================
// 14. getSellerPendingLeadsAction (T066)
// ===========================================

interface GetSellerPendingLeadsActionResult {
  success: boolean;
  data?: PendingLead[];
  error?: string;
}

export async function getSellerPendingLeadsAction(
  sellerId: string
): Promise<GetSellerPendingLeadsActionResult> {
  try {
    await requireAdmin();

    const leads = await getSellerPendingLeads(sellerId);

    return {
      success: true,
      data: leads,
    };
  } catch (error) {
    console.error("getSellerPendingLeadsAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao buscar leads pendentes" };
  }
}

// ===========================================
// 15. reassignLeadsAction (T066)
// ===========================================

interface ReassignLeadsInput {
  quotationIds: string[];
  distribution: "equal" | "specific";
  toSellerId?: string;
}

interface ReassignLeadsActionResult {
  success: boolean;
  data?: {
    reassignedCount: number;
    toSellers: Array<{ id: string; name: string; count: number }>;
  };
  error?: string;
}

export async function reassignLeadsAction(
  fromSellerId: string,
  input: ReassignLeadsInput
): Promise<ReassignLeadsActionResult> {
  try {
    await requireAdmin();

    if (!input.quotationIds || input.quotationIds.length === 0) {
      return { success: false, error: "Nenhum lead selecionado" };
    }

    if (input.distribution === "specific" && !input.toSellerId) {
      return { success: false, error: "Selecione um vendedor de destino" };
    }

    const result = await reassignLeads(fromSellerId, input);

    if (!result.success) {
      return { success: false, error: "Nao ha vendedores disponiveis para redistribuicao" };
    }

    return {
      success: true,
      data: {
        reassignedCount: result.reassignedCount,
        toSellers: result.toSellers,
      },
    };
  } catch (error) {
    console.error("reassignLeadsAction error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, error: "Nao autorizado" };
      }
      if (error.message === "FORBIDDEN") {
        return { success: false, error: "Acesso nao autorizado" };
      }
    }

    return { success: false, error: "Erro ao reatribuir leads" };
  }
}
