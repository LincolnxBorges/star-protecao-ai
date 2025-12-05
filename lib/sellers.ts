/**
 * Sellers Context
 * @module lib/sellers
 */

import { db } from "@/lib/db";
import { sellers, quotations, roundRobinConfig, vehicles, customers } from "@/lib/schema";
import { eq, asc, desc, sql, and, or, ilike, inArray } from "drizzle-orm";
import type {
  Seller,
  SellerWithMetrics,
  SellerMetrics,
  TeamMetrics,
  SellerFilters,
  RoundRobinConfig,
  SellerQueueItem,
  StatusCounts,
} from "@/lib/types/sellers";

// Re-export types for backwards compatibility
export type { Seller } from "@/lib/types/sellers";

export interface CreateSellerData {
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  cargo?: string | null;
  role?: "SELLER" | "ADMIN";
  status?: "ACTIVE" | "INACTIVE" | "VACATION";
  participateRoundRobin?: boolean;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
}

// ===========================================
// Seller Queries
// ===========================================

export async function getSellerById(id: string): Promise<Seller | null> {
  const results = await db.select().from(sellers).where(eq(sellers.id, id));

  return results[0] || null;
}

export async function getSellerByUserId(
  userId: string
): Promise<Seller | null> {
  const results = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, userId));

  return results[0] || null;
}

export async function listActiveSellers(): Promise<Seller[]> {
  return db
    .select()
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"))
    .orderBy(asc(sellers.name));
}

// ===========================================
// Seller CRUD
// ===========================================

export async function createSeller(data: CreateSellerData): Promise<Seller> {
  // Calculate round-robin position if participating
  let roundRobinPosition: number | null = null;
  if (data.participateRoundRobin !== false && data.status !== "INACTIVE") {
    const [maxPos] = await db
      .select({ max: sql<number>`coalesce(max(${sellers.roundRobinPosition}), 0)` })
      .from(sellers)
      .where(eq(sellers.status, "ACTIVE"));
    roundRobinPosition = (maxPos?.max || 0) + 1;
  }

  const [seller] = await db
    .insert(sellers)
    .values({
      userId: data.userId || null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      cargo: data.cargo || null,
      role: data.role || "SELLER",
      status: data.status || "ACTIVE",
      roundRobinPosition,
      notifyEmail: data.notifyEmail ?? true,
      notifyWhatsapp: data.notifyWhatsapp ?? true,
    })
    .returning();

  return seller;
}

/**
 * Check if email is already in use by another seller
 */
export async function isEmailInUse(email: string, excludeSellerId?: string): Promise<boolean> {
  const results = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.email, email));

  if (excludeSellerId) {
    return results.some(r => r.id !== excludeSellerId);
  }

  return results.length > 0;
}

export async function updateSeller(
  id: string,
  data: Partial<Omit<CreateSellerData, "userId">>
): Promise<Seller | null> {
  const [updated] = await db
    .update(sellers)
    .set(data)
    .where(eq(sellers.id, id))
    .returning();

  return updated || null;
}

export async function deactivateSeller(id: string, reason?: string): Promise<Seller | null> {
  const [updated] = await db
    .update(sellers)
    .set({
      status: "INACTIVE",
      deactivationReason: reason || null,
      deactivatedAt: new Date(),
    })
    .where(eq(sellers.id, id))
    .returning();

  return updated || null;
}

export async function activateSeller(id: string): Promise<Seller | null> {
  // Get max position to add at end of queue
  const [maxPos] = await db
    .select({ max: sql<number>`coalesce(max(${sellers.roundRobinPosition}), 0)` })
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"));

  const [updated] = await db
    .update(sellers)
    .set({
      status: "ACTIVE",
      deactivationReason: null,
      deactivatedAt: null,
      roundRobinPosition: (maxPos?.max || 0) + 1,
    })
    .where(eq(sellers.id, id))
    .returning();

  return updated || null;
}

/**
 * Altera o status de um vendedor com logica de transicao completa
 * T032: changeSellerStatus
 */
export async function changeSellerStatus(
  sellerId: string,
  newStatus: "ACTIVE" | "INACTIVE" | "VACATION",
  reason?: string
): Promise<Seller | null> {
  const seller = await getSellerById(sellerId);
  if (!seller) return null;

  // Se o status nao mudou, apenas retorna
  if (seller.status === newStatus) {
    return seller;
  }

  // Transicao para ACTIVE
  if (newStatus === "ACTIVE") {
    return activateSeller(sellerId);
  }

  // Transicao para INACTIVE ou VACATION
  // Remove da fila do round-robin e marca como desativado
  const [updated] = await db
    .update(sellers)
    .set({
      status: newStatus,
      deactivationReason: reason || null,
      deactivatedAt: new Date(),
      roundRobinPosition: null, // Remove da fila
    })
    .where(eq(sellers.id, sellerId))
    .returning();

  return updated || null;
}

/**
 * Redistribui leads pendentes de um vendedor para outros vendedores ativos
 * T033: redistributeLeads
 */
export async function redistributeLeads(
  fromSellerId: string,
  action: "redistribute" | "assign",
  toSellerId?: string
): Promise<{ redistributed: number; toSellers: string[] }> {
  // Buscar cotacoes pendentes do vendedor
  const pendingQuotations = await db
    .select({ id: quotations.id })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, fromSellerId),
        eq(quotations.status, "PENDING")
      )
    );

  if (pendingQuotations.length === 0) {
    return { redistributed: 0, toSellers: [] };
  }

  const quotationIds = pendingQuotations.map((q) => q.id);
  const toSellers: string[] = [];

  if (action === "assign" && toSellerId) {
    // Atribuir todos para um vendedor especifico
    await db
      .update(quotations)
      .set({ sellerId: toSellerId })
      .where(inArray(quotations.id, quotationIds));
    toSellers.push(toSellerId);
  } else {
    // Distribuir igualmente entre vendedores ativos
    const activeSellers = await listActiveSellers();
    const availableSellers = activeSellers.filter((s) => s.id !== fromSellerId);

    if (availableSellers.length === 0) {
      return { redistributed: 0, toSellers: [] };
    }

    // Distribuir round-robin entre vendedores disponiveis
    for (let i = 0; i < quotationIds.length; i++) {
      const targetSeller = availableSellers[i % availableSellers.length];
      await db
        .update(quotations)
        .set({ sellerId: targetSeller.id })
        .where(eq(quotations.id, quotationIds[i]));

      if (!toSellers.includes(targetSeller.id)) {
        toSellers.push(targetSeller.id);
      }
    }
  }

  return { redistributed: quotationIds.length, toSellers };
}

/**
 * Conta leads pendentes de um vendedor
 */
export async function countPendingLeads(sellerId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING")
      )
    );

  return Number(result?.count || 0);
}

// ===========================================
// Round-Robin Assignment
// ===========================================

/**
 * Get the next seller to assign using round-robin algorithm.
 * Selects the active seller with the oldest lastAssignmentAt (or null = never assigned).
 * Uses roundRobinPosition as secondary criteria and createdAt as tiebreaker.
 *
 * @returns The next seller to assign, or null if no active sellers exist
 */
export async function getNextActiveSeller(): Promise<Seller | null> {
  // Query active sellers ordered by:
  // 1. lastAssignmentAt NULLS FIRST (never assigned get priority, then oldest assignment)
  // 2. roundRobinPosition ASC (queue order for tiebreaker)
  // 3. createdAt ASC (final tiebreaker)
  const results = await db
    .select()
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"))
    .orderBy(
      sql`${sellers.lastAssignmentAt} ASC NULLS FIRST`,
      asc(sellers.roundRobinPosition),
      asc(sellers.createdAt)
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Assign a seller to a quotation and update the seller's assignment tracking.
 *
 * @param quotationId - The ID of the quotation to assign
 * @returns The assigned seller, or null if no active sellers or quotation not found
 */
export async function assignSellerToQuotation(
  quotationId: string
): Promise<Seller | null> {
  // Get the next seller in round-robin order
  const seller = await getNextActiveSeller();

  if (!seller) {
    console.warn("No active sellers available for assignment");
    return null;
  }

  // Update the quotation with the seller ID
  const [updatedQuotation] = await db
    .update(quotations)
    .set({ sellerId: seller.id })
    .where(eq(quotations.id, quotationId))
    .returning();

  if (!updatedQuotation) {
    console.warn(`Quotation ${quotationId} not found for assignment`);
    return null;
  }

  // Update the seller's assignment tracking
  await db
    .update(sellers)
    .set({
      lastAssignmentAt: new Date(),
      assignmentCount: (seller.assignmentCount || 0) + 1,
    })
    .where(eq(sellers.id, seller.id));

  return seller;
}

// ===========================================
// Statistics
// ===========================================

export async function getSellerStats(sellerId: string): Promise<{
  totalQuotations: number;
  pendingQuotations: number;
  acceptedQuotations: number;
}> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${quotations.status} = 'PENDING')`,
      accepted: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
    })
    .from(quotations)
    .where(eq(quotations.sellerId, sellerId));

  return {
    totalQuotations: Number(stats?.total || 0),
    pendingQuotations: Number(stats?.pending || 0),
    acceptedQuotations: Number(stats?.accepted || 0),
  };
}

// ===========================================
// Seller Metrics Functions (T007-T009)
// ===========================================

/**
 * Calculate metrics for a single seller
 */
async function calculateSellerMetrics(
  sellerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<SellerMetrics> {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate || now;

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      accepted: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
      pending: sql<number>`count(*) filter (where ${quotations.status} = 'PENDING')`,
      expired: sql<number>`count(*) filter (where ${quotations.status} = 'EXPIRED')`,
      cancelled: sql<number>`count(*) filter (where ${quotations.status} = 'CANCELLED')`,
      potentialRevenue: sql<number>`coalesce(sum(${quotations.mensalidade}) filter (where ${quotations.status} = 'ACCEPTED'), 0)`,
      avgResponseHours: sql<number>`extract(epoch from avg(${quotations.contactedAt} - ${quotations.createdAt})) / 3600`,
    })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        sql`${quotations.createdAt} >= ${start}`,
        sql`${quotations.createdAt} <= ${end}`
      )
    );

  const total = Number(stats?.total || 0);
  const accepted = Number(stats?.accepted || 0);

  return {
    totalQuotations: total,
    acceptedQuotations: accepted,
    pendingQuotations: Number(stats?.pending || 0),
    expiredQuotations: Number(stats?.expired || 0),
    cancelledQuotations: Number(stats?.cancelled || 0),
    conversionRate: total > 0 ? (accepted / total) * 100 : 0,
    avgResponseTimeHours: stats?.avgResponseHours ? Number(stats.avgResponseHours) : null,
    potentialRevenue: Number(stats?.potentialRevenue || 0),
    ranking: 0, // Will be calculated separately
  };
}

/**
 * List sellers with their metrics
 * T007: listSellersWithMetrics
 * T041: Atualizado para suportar ordenacao por metricas
 */
export async function listSellersWithMetrics(
  filters: SellerFilters = {}
): Promise<{
  items: SellerWithMetrics[];
  total: number;
  statusCounts: StatusCounts;
}> {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = "name",
    sortOrder = "asc",
  } = filters;

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(sellers.name, `%${search}%`),
        ilike(sellers.email, `%${search}%`),
        ilike(sellers.phone, `%${search}%`)
      )
    );
  }

  if (status && status.length > 0) {
    conditions.push(inArray(sellers.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get status counts (sem filtro de status para mostrar contagem total de cada)
  const [statusCountsResult] = await db
    .select({
      all: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${sellers.status} = 'ACTIVE')`,
      inactive: sql<number>`count(*) filter (where ${sellers.status} = 'INACTIVE')`,
      vacation: sql<number>`count(*) filter (where ${sellers.status} = 'VACATION')`,
    })
    .from(sellers)
    .where(search ? or(
      ilike(sellers.name, `%${search}%`),
      ilike(sellers.email, `%${search}%`),
      ilike(sellers.phone, `%${search}%`)
    ) : undefined);

  const statusCounts: StatusCounts = {
    all: Number(statusCountsResult?.all || 0),
    active: Number(statusCountsResult?.active || 0),
    inactive: Number(statusCountsResult?.inactive || 0),
    vacation: Number(statusCountsResult?.vacation || 0),
  };

  // Get total count with filters (inclui filtro de status)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sellers)
    .where(whereClause);

  const total = Number(countResult?.count || 0);

  // Campos que podem ser ordenados diretamente no banco
  const dbSortableFields = ["name", "createdAt"];
  const isDbSortable = dbSortableFields.includes(sortBy);

  // Se a ordenacao eh por campo do banco, aplicar no query
  // Senao, buscar todos os vendedores filtrados para ordenar em memoria
  let sellersList;
  if (isDbSortable) {
    const sortColumn = sortBy === "name" ? sellers.name : sellers.createdAt;
    sellersList = await db
      .select()
      .from(sellers)
      .where(whereClause)
      .orderBy(sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit);
  } else {
    // Para ordenacao por metricas, buscar todos os vendedores filtrados
    sellersList = await db
      .select()
      .from(sellers)
      .where(whereClause)
      .orderBy(asc(sellers.name)); // Ordem padrao para busca inicial
  }

  // Calculate metrics for each seller
  const sellersWithMetrics: SellerWithMetrics[] = await Promise.all(
    sellersList.map(async (seller) => {
      const metrics = await calculateSellerMetrics(seller.id);

      // Get last lead received
      const [lastLead] = await db
        .select({ createdAt: quotations.createdAt })
        .from(quotations)
        .where(eq(quotations.sellerId, seller.id))
        .orderBy(desc(quotations.createdAt))
        .limit(1);

      return {
        ...seller,
        status: seller.status as "ACTIVE" | "INACTIVE" | "VACATION",
        role: seller.role as "SELLER" | "ADMIN",
        metrics,
        lastLeadReceivedAt: lastLead?.createdAt || null,
      };
    })
  );

  // Calculate rankings based on accepted quotations
  const sortedByAccepted = [...sellersWithMetrics].sort(
    (a, b) => b.metrics.acceptedQuotations - a.metrics.acceptedQuotations
  );
  sortedByAccepted.forEach((seller, index) => {
    seller.metrics.ranking = index + 1;
  });

  // Se ordenacao por metricas, aplicar ordenacao em memoria e paginacao
  if (!isDbSortable) {
    // Funcao de comparacao baseada no sortBy
    const getSortValue = (seller: SellerWithMetrics): number | Date | null => {
      switch (sortBy) {
        case "quotations":
          return seller.metrics.totalQuotations;
        case "accepted":
          return seller.metrics.acceptedQuotations;
        case "conversion":
          return seller.metrics.conversionRate;
        case "responseTime":
          return seller.metrics.avgResponseTimeHours ?? Infinity;
        case "lastLead":
          return seller.lastLeadReceivedAt;
        default:
          return 0;
      }
    };

    // Ordenar
    sellersWithMetrics.sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);

      // Tratar nulls - colocar no final
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // Comparar valores
      let comparison: number;
      if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = (aVal as number) - (bVal as number);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Aplicar paginacao
    const offset = (page - 1) * limit;
    return {
      items: sellersWithMetrics.slice(offset, offset + limit),
      total,
      statusCounts,
    };
  }

  return { items: sellersWithMetrics, total, statusCounts };
}

/**
 * Get team-wide metrics
 * T008: getTeamMetrics
 */
export async function getTeamMetrics(): Promise<TeamMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get seller counts
  const [sellerCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${sellers.status} = 'ACTIVE')`,
    })
    .from(sellers);

  // Get quotation stats for the month
  const [quotationStats] = await db
    .select({
      total: sql<number>`count(*)`,
      accepted: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
      totalRevenue: sql<number>`coalesce(sum(${quotations.mensalidade}) filter (where ${quotations.status} = 'ACCEPTED'), 0)`,
      avgResponseHours: sql<number>`extract(epoch from avg(${quotations.contactedAt} - ${quotations.createdAt})) / 3600`,
    })
    .from(quotations)
    .where(sql`${quotations.createdAt} >= ${startOfMonth}`);

  const totalQuotations = Number(quotationStats?.total || 0);
  const totalAccepted = Number(quotationStats?.accepted || 0);

  // Get top seller
  const topSellerResult = await db
    .select({
      sellerId: quotations.sellerId,
      count: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
    })
    .from(quotations)
    .where(sql`${quotations.createdAt} >= ${startOfMonth}`)
    .groupBy(quotations.sellerId)
    .orderBy(desc(sql`count(*) filter (where ${quotations.status} = 'ACCEPTED')`))
    .limit(1);

  let topSeller: TeamMetrics["topSeller"] = null;
  if (topSellerResult[0]?.sellerId) {
    const seller = await getSellerById(topSellerResult[0].sellerId);
    if (seller) {
      const sellerMetrics = await calculateSellerMetrics(seller.id);
      topSeller = {
        id: seller.id,
        name: seller.name,
        acceptedCount: Number(topSellerResult[0].count),
        conversionRate: sellerMetrics.conversionRate,
      };
    }
  }

  return {
    totalSellers: Number(sellerCounts?.total || 0),
    activeSellers: Number(sellerCounts?.active || 0),
    teamConversionRate: totalQuotations > 0 ? (totalAccepted / totalQuotations) * 100 : 0,
    teamAvgResponseTimeHours: quotationStats?.avgResponseHours
      ? Number(quotationStats.avgResponseHours)
      : null,
    totalQuotationsMonth: totalQuotations,
    totalAcceptedMonth: totalAccepted,
    totalPotentialMonth: Number(quotationStats?.totalRevenue || 0),
    topSeller,
  };
}

/**
 * Get a single seller with their metrics
 * T009: getSellerWithMetrics
 */
export async function getSellerWithMetrics(
  sellerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<SellerWithMetrics | null> {
  const seller = await getSellerById(sellerId);
  if (!seller) return null;

  const metrics = await calculateSellerMetrics(sellerId, startDate, endDate);

  // Get last lead received
  const [lastLead] = await db
    .select({ createdAt: quotations.createdAt })
    .from(quotations)
    .where(eq(quotations.sellerId, sellerId))
    .orderBy(desc(quotations.createdAt))
    .limit(1);

  return {
    ...seller,
    status: seller.status as "ACTIVE" | "INACTIVE" | "VACATION",
    role: seller.role as "SELLER" | "ADMIN",
    metrics,
    lastLeadReceivedAt: lastLead?.createdAt || null,
  };
}

// ===========================================
// Round-Robin Config Functions (T010)
// ===========================================

/**
 * Get round-robin configuration with queue
 * T010: getRoundRobinConfig
 */
export async function getRoundRobinConfig(): Promise<{
  config: RoundRobinConfig;
  queue: SellerQueueItem[];
}> {
  // Get or create config
  let [config] = await db.select().from(roundRobinConfig).limit(1);

  if (!config) {
    [config] = await db
      .insert(roundRobinConfig)
      .values({
        method: "SEQUENTIAL",
        currentIndex: 0,
        skipOverloaded: true,
        notifyWhenAllOverloaded: true,
      })
      .returning();
  }

  // Get active sellers ordered by position
  const activeSellers = await db
    .select()
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"))
    .orderBy(asc(sellers.roundRobinPosition), asc(sellers.createdAt));

  // Build queue with pending counts
  const queue: SellerQueueItem[] = await Promise.all(
    activeSellers.map(async (seller, index) => {
      const [pending] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotations)
        .where(
          and(
            eq(quotations.sellerId, seller.id),
            eq(quotations.status, "PENDING")
          )
        );

      return {
        seller: {
          ...seller,
          status: seller.status as "ACTIVE" | "INACTIVE" | "VACATION",
          role: seller.role as "SELLER" | "ADMIN",
        },
        position: index + 1,
        isNext: index === 0,
        pendingCount: Number(pending?.count || 0),
      };
    })
  );

  return {
    config: {
      ...config,
      method: config.method as "SEQUENTIAL" | "LOAD_BALANCE" | "PERFORMANCE" | "SPEED",
    },
    queue,
  };
}

// ===========================================
// Round-Robin Config Update Functions (T051)
// ===========================================

export interface UpdateRoundRobinConfigInput {
  method?: "SEQUENTIAL" | "LOAD_BALANCE" | "PERFORMANCE" | "SPEED";
  pendingLeadLimit?: number | null;
  skipOverloaded?: boolean;
  notifyWhenAllOverloaded?: boolean;
}

/**
 * Update round-robin configuration
 * T051: updateRoundRobinConfig
 */
export async function updateRoundRobinConfig(
  input: UpdateRoundRobinConfigInput
): Promise<RoundRobinConfig> {
  // Get or create config
  let [config] = await db.select().from(roundRobinConfig).limit(1);

  if (!config) {
    // Create default config first
    [config] = await db
      .insert(roundRobinConfig)
      .values({
        method: input.method || "SEQUENTIAL",
        currentIndex: 0,
        pendingLeadLimit: input.pendingLeadLimit ?? null,
        skipOverloaded: input.skipOverloaded ?? true,
        notifyWhenAllOverloaded: input.notifyWhenAllOverloaded ?? true,
      })
      .returning();
  } else {
    // Update existing config
    [config] = await db
      .update(roundRobinConfig)
      .set({
        method: input.method ?? config.method,
        pendingLeadLimit: input.pendingLeadLimit !== undefined ? input.pendingLeadLimit : config.pendingLeadLimit,
        skipOverloaded: input.skipOverloaded ?? config.skipOverloaded,
        notifyWhenAllOverloaded: input.notifyWhenAllOverloaded ?? config.notifyWhenAllOverloaded,
        updatedAt: new Date(),
      })
      .where(eq(roundRobinConfig.id, config.id))
      .returning();
  }

  return {
    ...config,
    method: config.method as "SEQUENTIAL" | "LOAD_BALANCE" | "PERFORMANCE" | "SPEED",
  };
}

// ===========================================
// Round-Robin Queue Management Functions (T057, T058)
// ===========================================

/**
 * Reorder round-robin queue by updating seller positions
 * T057: reorderRoundRobinQueue
 * @param orderedSellerIds - Array of seller IDs in the new order
 */
export async function reorderRoundRobinQueue(
  orderedSellerIds: string[]
): Promise<{ success: boolean; queue: SellerQueueItem[] }> {
  // Update each seller's position based on the new order
  await Promise.all(
    orderedSellerIds.map((sellerId, index) =>
      db
        .update(sellers)
        .set({ roundRobinPosition: index + 1 })
        .where(eq(sellers.id, sellerId))
    )
  );

  // Return the updated queue
  const { queue } = await getRoundRobinConfig();
  return { success: true, queue };
}

/**
 * Reset round-robin queue to alphabetical order
 * T058: resetRoundRobinQueue
 */
export async function resetRoundRobinQueue(): Promise<{
  success: boolean;
  queue: SellerQueueItem[];
}> {
  // Get all active sellers ordered alphabetically
  const activeSellers = await db
    .select()
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"))
    .orderBy(asc(sellers.name));

  // Update positions in alphabetical order
  await Promise.all(
    activeSellers.map((seller, index) =>
      db
        .update(sellers)
        .set({ roundRobinPosition: index + 1 })
        .where(eq(sellers.id, seller.id))
    )
  );

  // Return the updated queue
  const { queue } = await getRoundRobinConfig();
  return { success: true, queue };
}

// ===========================================
// Seller Profile Functions (T044)
// ===========================================

type PeriodType = "thisMonth" | "last3Months" | "last6Months" | "lastYear";

/**
 * Get seller profile with detailed metrics and history
 * T044: getSellerProfile
 */
export async function getSellerProfile(
  sellerId: string,
  period: PeriodType = "thisMonth"
): Promise<{
  seller: Seller;
  metrics: SellerMetrics;
  monthlyEvolution: Array<{ month: string; year: number; quotations: number; accepted: number }>;
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
} | null> {
  const seller = await getSellerById(sellerId);
  if (!seller) return null;

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  let monthsBack: number;

  switch (period) {
    case "last3Months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      monthsBack = 3;
      break;
    case "last6Months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      monthsBack = 6;
      break;
    case "lastYear":
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      monthsBack = 12;
      break;
    case "thisMonth":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      monthsBack = 1;
      break;
  }

  // Get metrics for the period
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      accepted: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
      pending: sql<number>`count(*) filter (where ${quotations.status} = 'PENDING')`,
      expired: sql<number>`count(*) filter (where ${quotations.status} = 'EXPIRED')`,
      cancelled: sql<number>`count(*) filter (where ${quotations.status} = 'CANCELLED')`,
      potentialRevenue: sql<number>`coalesce(sum(${quotations.mensalidade}) filter (where ${quotations.status} = 'ACCEPTED'), 0)`,
      avgResponseHours: sql<number>`extract(epoch from avg(${quotations.contactedAt} - ${quotations.createdAt})) / 3600`,
    })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        sql`${quotations.createdAt} >= ${startDate}`
      )
    );

  const total = Number(stats?.total || 0);
  const accepted = Number(stats?.accepted || 0);

  const metrics: SellerMetrics = {
    totalQuotations: total,
    acceptedQuotations: accepted,
    pendingQuotations: Number(stats?.pending || 0),
    expiredQuotations: Number(stats?.expired || 0),
    cancelledQuotations: Number(stats?.cancelled || 0),
    conversionRate: total > 0 ? (accepted / total) * 100 : 0,
    avgResponseTimeHours: stats?.avgResponseHours ? Number(stats.avgResponseHours) : null,
    potentialRevenue: Number(stats?.potentialRevenue || 0),
    ranking: 0, // Not calculated for profile view
  };

  // Get monthly evolution data
  const monthlyData = await db
    .select({
      month: sql<number>`extract(month from ${quotations.createdAt})`,
      year: sql<number>`extract(year from ${quotations.createdAt})`,
      quotations: sql<number>`count(*)`,
      accepted: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
    })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        sql`${quotations.createdAt} >= ${startDate}`
      )
    )
    .groupBy(
      sql`extract(year from ${quotations.createdAt})`,
      sql`extract(month from ${quotations.createdAt})`
    )
    .orderBy(
      sql`extract(year from ${quotations.createdAt})`,
      sql`extract(month from ${quotations.createdAt})`
    );

  // Generate month names for all months in period (even with 0 data)
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthlyEvolution: Array<{ month: string; year: number; quotations: number; accepted: number }> = [];

  for (let i = 0; i < monthsBack; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();

    const existingData = monthlyData.find(
      (d) => Number(d.month) === month && Number(d.year) === year
    );

    monthlyEvolution.push({
      month: monthNames[month - 1],
      year,
      quotations: existingData ? Number(existingData.quotations) : 0,
      accepted: existingData ? Number(existingData.accepted) : 0,
    });
  }

  // Get recent quotations (last 10) with joins
  const recentQuotationsData = await db
    .select({
      id: quotations.id,
      vehicleMarca: vehicles.marca,
      vehicleModelo: vehicles.modelo,
      vehicleAno: vehicles.ano,
      customerName: customers.name,
      mensalidade: quotations.mensalidade,
      status: quotations.status,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .where(eq(quotations.sellerId, sellerId))
    .orderBy(desc(quotations.createdAt))
    .limit(10);

  const recentQuotations = recentQuotationsData.map((q) => ({
    id: q.id,
    vehicleMarca: q.vehicleMarca || "",
    vehicleModelo: q.vehicleModelo || "",
    vehicleAno: q.vehicleAno || "",
    customerName: q.customerName || "",
    mensalidade: Number(q.mensalidade || 0),
    status: q.status || "",
    createdAt: q.createdAt!,
  }));

  return {
    seller: {
      ...seller,
      status: seller.status as "ACTIVE" | "INACTIVE" | "VACATION",
      role: seller.role as "SELLER" | "ADMIN",
    },
    metrics,
    monthlyEvolution,
    recentQuotations,
  };
}

// ===========================================
// Lead Reassignment Functions (T064, T065)
// ===========================================

export interface PendingLead {
  id: string;
  vehicleMarca: string;
  vehicleModelo: string;
  vehicleAno: string;
  customerName: string;
  customerPhone: string | null;
  mensalidade: number;
  createdAt: Date;
}

/**
 * Get pending leads for a seller
 * T065: getSellerPendingLeads
 */
export async function getSellerPendingLeads(sellerId: string): Promise<PendingLead[]> {
  const pendingLeads = await db
    .select({
      id: quotations.id,
      vehicleMarca: vehicles.marca,
      vehicleModelo: vehicles.modelo,
      vehicleAno: vehicles.ano,
      customerName: customers.name,
      customerPhone: customers.phone,
      mensalidade: quotations.mensalidade,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING")
      )
    )
    .orderBy(desc(quotations.createdAt));

  return pendingLeads.map((lead) => ({
    id: lead.id,
    vehicleMarca: lead.vehicleMarca || "",
    vehicleModelo: lead.vehicleModelo || "",
    vehicleAno: lead.vehicleAno || "",
    customerName: lead.customerName || "",
    customerPhone: lead.customerPhone,
    mensalidade: Number(lead.mensalidade || 0),
    createdAt: lead.createdAt!,
  }));
}

export interface ReassignLeadsInput {
  quotationIds: string[];
  distribution: "equal" | "specific";
  toSellerId?: string;
}

/**
 * Reassign leads from one seller to others
 * T064: reassignLeads
 */
export async function reassignLeads(
  fromSellerId: string,
  input: ReassignLeadsInput
): Promise<{
  success: boolean;
  reassignedCount: number;
  toSellers: Array<{ id: string; name: string; count: number }>;
}> {
  const { quotationIds, distribution, toSellerId } = input;

  if (quotationIds.length === 0) {
    return { success: true, reassignedCount: 0, toSellers: [] };
  }

  const toSellersMap = new Map<string, { id: string; name: string; count: number }>();

  if (distribution === "specific" && toSellerId) {
    // Assign all to a specific seller
    await db
      .update(quotations)
      .set({ sellerId: toSellerId })
      .where(inArray(quotations.id, quotationIds));

    const seller = await getSellerById(toSellerId);
    if (seller) {
      toSellersMap.set(seller.id, {
        id: seller.id,
        name: seller.name,
        count: quotationIds.length,
      });
    }
  } else {
    // Equal distribution among active sellers (excluding the source seller)
    const activeSellers = await listActiveSellers();
    const availableSellers = activeSellers.filter((s) => s.id !== fromSellerId);

    if (availableSellers.length === 0) {
      return { success: false, reassignedCount: 0, toSellers: [] };
    }

    // Distribute round-robin among available sellers
    for (let i = 0; i < quotationIds.length; i++) {
      const targetSeller = availableSellers[i % availableSellers.length];

      await db
        .update(quotations)
        .set({ sellerId: targetSeller.id })
        .where(eq(quotations.id, quotationIds[i]));

      const existing = toSellersMap.get(targetSeller.id);
      if (existing) {
        existing.count += 1;
      } else {
        toSellersMap.set(targetSeller.id, {
          id: targetSeller.id,
          name: targetSeller.name,
          count: 1,
        });
      }
    }
  }

  return {
    success: true,
    reassignedCount: quotationIds.length,
    toSellers: Array.from(toSellersMap.values()),
  };
}
