/**
 * Quotations Context
 * @module lib/quotations
 */

import { db } from "@/lib/db";
import { quotations, customers, vehicles, sellers } from "@/lib/schema";
import { eq, and, desc, sql, lt } from "drizzle-orm";

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

type QuotationStatus = "CONTACTED" | "ACCEPTED" | "CANCELLED";

const VALID_TRANSITIONS: Record<string, QuotationStatus[]> = {
  PENDING: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["ACCEPTED", "CANCELLED"],
};

export async function updateQuotationStatus(
  id: string,
  status: QuotationStatus,
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
