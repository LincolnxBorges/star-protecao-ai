/**
 * Quotations Context
 * @module lib/quotations
 */

import { db } from "@/lib/db";
import {
  quotations,
  customers,
  vehicles,
  sellers,
  quotationActivities,
  user,
} from "@/lib/schema";
import { eq, and, desc, sql, lt, asc, gte, lte, ilike, or } from "drizzle-orm";
import type {
  QuotationStatus,
  ActivityType,
  QuotationActivity,
  CreateActivityData,
  StatusCount,
  QuotationFilters,
  VehicleCategory,
} from "@/lib/types/quotations";

// ===========================================
// Types
// ===========================================

export interface CreateQuotationData {
  customerId: string;
  vehicleId: string;
  mensalidade: number;
  adesao: number;
  adesaoDesconto: number;
  cotaParticipacao: number | null;
  sellerId?: string | null;
  isRejected?: boolean;
  rejectionReason?: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  vehicleId: string;
  sellerId: string | null;
  mensalidade: string;
  adesao: string;
  adesaoDesconto: string;
  cotaParticipacao: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date | null;
  expiresAt: Date | null;
  contactedAt: Date | null;
  acceptedAt: Date | null;
  notes: string | null;
}

export interface QuotationWithRelations extends Quotation {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    cep: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
  };
  vehicle: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: string;
    valorFipe: string;
    codigoFipe: string;
    combustivel: string | null;
    cor: string | null;
    categoria: string;
    tipoUso: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

// ===========================================
// Quotation Creation
// ===========================================

export async function createQuotation(
  data: CreateQuotationData
): Promise<Quotation> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [quotation] = await db
    .insert(quotations)
    .values({
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      sellerId: data.isRejected ? null : data.sellerId || null,
      mensalidade: data.mensalidade.toFixed(2),
      adesao: data.adesao.toFixed(2),
      adesaoDesconto: data.adesaoDesconto.toFixed(2),
      cotaParticipacao: data.cotaParticipacao?.toFixed(2) || null,
      status: data.isRejected ? "REJECTED" : "PENDING",
      rejectionReason: data.rejectionReason || null,
      expiresAt,
    })
    .returning();

  return quotation;
}

// ===========================================
// Quotation Queries
// ===========================================

export async function getQuotationById(
  id: string
): Promise<QuotationWithRelations | null> {
  const results = await db
    .select({
      quotation: quotations,
      customer: customers,
      vehicle: vehicles,
      seller: sellers,
    })
    .from(quotations)
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .leftJoin(sellers, eq(quotations.sellerId, sellers.id))
    .where(eq(quotations.id, id));

  if (results.length === 0) {
    return null;
  }

  const { quotation, customer, vehicle, seller } = results[0];

  return {
    ...quotation,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf,
      cep: customer.cep,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    },
    vehicle: {
      id: vehicle.id,
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      ano: vehicle.ano,
      valorFipe: vehicle.valorFipe,
      codigoFipe: vehicle.codigoFipe,
      combustivel: vehicle.combustivel,
      cor: vehicle.cor,
      categoria: vehicle.categoria,
      tipoUso: vehicle.tipoUso,
    },
    seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
        }
      : null,
  };
}

export async function listQuotations(options?: {
  sellerId?: string;
  status?: string[];
  page?: number;
  limit?: number;
}): Promise<{ items: QuotationWithRelations[]; total: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;

  if (options?.sellerId) {
    whereClause = and(whereClause, eq(quotations.sellerId, options.sellerId))!;
  }

  if (options?.status && options.status.length > 0) {
    whereClause = and(
      whereClause,
      sql`${quotations.status} IN (${sql.join(
        options.status.map((s) => sql`${s}`),
        sql`, `
      )})`
    )!;
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quotations)
    .where(whereClause);

  const total = Number(countResult.count);

  const results = await db
    .select({
      quotation: quotations,
      customer: customers,
      vehicle: vehicles,
      seller: sellers,
    })
    .from(quotations)
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .leftJoin(sellers, eq(quotations.sellerId, sellers.id))
    .where(whereClause)
    .orderBy(desc(quotations.createdAt))
    .limit(limit)
    .offset(offset);

  const items = results.map(({ quotation, customer, vehicle, seller }) => ({
    ...quotation,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf,
      cep: customer.cep,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    },
    vehicle: {
      id: vehicle.id,
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      ano: vehicle.ano,
      valorFipe: vehicle.valorFipe,
      codigoFipe: vehicle.codigoFipe,
      combustivel: vehicle.combustivel,
      cor: vehicle.cor,
      categoria: vehicle.categoria,
      tipoUso: vehicle.tipoUso,
    },
    seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
        }
      : null,
  }));

  return { items, total };
}

// ===========================================
// Advanced Quotation Listing with Filters
// ===========================================

export async function listQuotationsWithFilters(
  filters: QuotationFilters
): Promise<{ items: QuotationWithRelations[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: ReturnType<typeof sql>[] = [];

  // Filter by seller (for authorization)
  if (filters.sellerId) {
    conditions.push(eq(quotations.sellerId, filters.sellerId));
  }

  // Filter by status (multiple)
  if (filters.status && filters.status.length > 0) {
    conditions.push(
      sql`${quotations.status} IN (${sql.join(
        filters.status.map((s) => sql`${s}`),
        sql`, `
      )})`
    );
  }

  // Filter by vehicle category (multiple)
  if (filters.category && filters.category.length > 0) {
    conditions.push(
      sql`${vehicles.categoria} IN (${sql.join(
        filters.category.map((c) => sql`${c}`),
        sql`, `
      )})`
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    conditions.push(gte(quotations.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(quotations.createdAt, filters.dateTo));
  }

  // Filter by FIPE value range
  if (filters.fipeMin !== undefined) {
    conditions.push(
      sql`CAST(${vehicles.valorFipe} AS DECIMAL) >= ${filters.fipeMin}`
    );
  }
  if (filters.fipeMax !== undefined) {
    conditions.push(
      sql`CAST(${vehicles.valorFipe} AS DECIMAL) <= ${filters.fipeMax}`
    );
  }

  // Search filter (ILIKE across multiple fields)
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(customers.name, searchTerm),
        ilike(customers.phone, searchTerm),
        ilike(customers.cpf, searchTerm),
        ilike(vehicles.placa, searchTerm),
        ilike(vehicles.marca, searchTerm),
        ilike(vehicles.modelo, searchTerm)
      )!
    );
  }

  // Combine all conditions
  const whereClause =
    conditions.length > 0 ? and(...conditions) : sql`1=1`;

  // Count total for pagination
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotations)
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .where(whereClause);

  const total = countResult.count;

  // Build order by
  let orderColumn;
  switch (filters.orderBy) {
    case "mensalidade":
      orderColumn = sql`CAST(${quotations.mensalidade} AS DECIMAL)`;
      break;
    case "valorFipe":
      orderColumn = sql`CAST(${vehicles.valorFipe} AS DECIMAL)`;
      break;
    case "customerName":
      orderColumn = customers.name;
      break;
    case "createdAt":
    default:
      orderColumn = quotations.createdAt;
  }

  const orderDirection = filters.orderDir === "asc" ? asc : desc;

  // Query with joins
  const results = await db
    .select({
      quotation: quotations,
      customer: customers,
      vehicle: vehicles,
      seller: sellers,
    })
    .from(quotations)
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .leftJoin(sellers, eq(quotations.sellerId, sellers.id))
    .where(whereClause)
    .orderBy(orderDirection(orderColumn))
    .limit(limit)
    .offset(offset);

  const items = results.map(({ quotation, customer, vehicle, seller }) => ({
    ...quotation,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf,
      cep: customer.cep,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    },
    vehicle: {
      id: vehicle.id,
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      ano: vehicle.ano,
      valorFipe: vehicle.valorFipe,
      codigoFipe: vehicle.codigoFipe,
      combustivel: vehicle.combustivel,
      cor: vehicle.cor,
      categoria: vehicle.categoria,
      tipoUso: vehicle.tipoUso,
    },
    seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
        }
      : null,
  }));

  return { items, total };
}

// ===========================================
// Authorization Helpers
// ===========================================

/**
 * Check if a seller/admin can access a specific quotation
 * @param quotation - The quotation to check
 * @param sellerId - The seller's ID (null if admin)
 * @param isAdmin - Whether the user is an admin
 * @returns true if access is allowed
 */
export function canAccessQuotation(
  quotation: { sellerId: string | null },
  sellerId: string | null,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (sellerId === null) return false;
  return quotation.sellerId === sellerId;
}

/**
 * Get quotation by ID with access check
 * @throws Error with "FORBIDDEN" if access denied
 */
export async function getQuotationByIdWithAccessCheck(
  id: string,
  sellerId: string | null,
  isAdmin: boolean
): Promise<QuotationWithRelations | null> {
  const quotation = await getQuotationById(id);

  if (!quotation) {
    return null;
  }

  if (!canAccessQuotation(quotation, sellerId, isAdmin)) {
    throw new Error("FORBIDDEN");
  }

  return quotation;
}

// ===========================================
// Quotation Updates
// ===========================================

type UpdateableStatus = "CONTACTED" | "ACCEPTED" | "CANCELLED";

const VALID_TRANSITIONS: Record<string, UpdateableStatus[]> = {
  PENDING: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["ACCEPTED", "CANCELLED"],
};

export async function updateQuotationStatus(
  id: string,
  status: UpdateableStatus,
  notes?: string,
  sellerId?: string
): Promise<Quotation | null> {
  // Get current quotation
  const [current] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, id));

  if (!current) {
    return null;
  }

  // Check authorization if sellerId provided
  if (sellerId && current.sellerId !== sellerId) {
    throw new Error("FORBIDDEN");
  }

  // Validate transition
  const validTransitions = VALID_TRANSITIONS[current.status] || [];
  if (!validTransitions.includes(status)) {
    throw new Error(`Invalid status transition: ${current.status} -> ${status}`);
  }

  // Prepare update data
  const updateData: Record<string, unknown> = { status };

  if (status === "CONTACTED") {
    updateData.contactedAt = new Date();
  } else if (status === "ACCEPTED") {
    updateData.acceptedAt = new Date();
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const [updated] = await db
    .update(quotations)
    .set(updateData)
    .where(eq(quotations.id, id))
    .returning();

  return updated;
}

// ===========================================
// Expiration
// ===========================================

export async function expireOldQuotations(): Promise<number> {
  const result = await db
    .update(quotations)
    .set({ status: "EXPIRED" })
    .where(
      and(
        eq(quotations.status, "PENDING"),
        lt(quotations.expiresAt, new Date())
      )
    );

  return result.rowCount || 0;
}

// ===========================================
// Status Counts
// ===========================================

const ALL_STATUSES: QuotationStatus[] = [
  "PENDING",
  "CONTACTED",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
];

export async function getStatusCounts(
  sellerId?: string
): Promise<StatusCount[]> {
  let whereClause = sql`1=1`;

  if (sellerId) {
    whereClause = eq(quotations.sellerId, sellerId);
  }

  const results = await db
    .select({
      status: quotations.status,
      count: sql<number>`count(*)::int`,
    })
    .from(quotations)
    .where(whereClause)
    .groupBy(quotations.status);

  // Create a map for quick lookup
  const countMap = new Map(
    results.map((r) => [r.status, r.count])
  );

  // Return all statuses with count (0 if not found)
  return ALL_STATUSES.map((status) => ({
    status,
    count: countMap.get(status) || 0,
  }));
}

// ===========================================
// Quotation Activities
// ===========================================

export async function createQuotationActivity(
  data: CreateActivityData
): Promise<QuotationActivity> {
  let authorName = data.authorName;

  // If authorId provided but no authorName, fetch from user table
  if (data.authorId && !authorName) {
    const [foundUser] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, data.authorId));

    if (foundUser) {
      authorName = foundUser.name;
    }
  }

  const [activity] = await db
    .insert(quotationActivities)
    .values({
      quotationId: data.quotationId,
      type: data.type,
      description: data.description,
      authorId: data.authorId || null,
      authorName: authorName || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    })
    .returning();

  return {
    id: activity.id,
    quotationId: activity.quotationId,
    type: activity.type as ActivityType,
    description: activity.description,
    authorId: activity.authorId,
    authorName: activity.authorName,
    metadata: activity.metadata,
    createdAt: activity.createdAt!,
  };
}

export async function listQuotationActivities(
  quotationId: string,
  options?: { limit?: number }
): Promise<QuotationActivity[]> {
  const limit = options?.limit || 50;

  const results = await db
    .select()
    .from(quotationActivities)
    .where(eq(quotationActivities.quotationId, quotationId))
    .orderBy(desc(quotationActivities.createdAt))
    .limit(limit);

  return results.map((activity) => ({
    id: activity.id,
    quotationId: activity.quotationId,
    type: activity.type as ActivityType,
    description: activity.description,
    authorId: activity.authorId,
    authorName: activity.authorName,
    metadata: activity.metadata,
    createdAt: activity.createdAt!,
  }));
}
