/**
 * Clients Context
 * @module lib/clients
 *
 * Modulo de contexto para gestao de clientes.
 * Todas as funcoes de negocio relacionadas a clientes estao aqui.
 */

import { db } from "@/lib/db";
import {
  customers,
  quotations,
  vehicles,
  sellers,
  clientInteractions,
} from "@/lib/schema";
import {
  eq,
  and,
  desc,
  asc,
  sql,
  isNull,
  or,
  ilike,
  gte,
  lte,
  exists,
} from "drizzle-orm";
import type {
  ClientStatus,
  ClientFilters,
  ClientWithMetrics,
  ClientKPIs,
  ListClientsResult,
  ClientProfile,
  ClientQuotationsSummary,
  ClientInteraction,
  CreateInteractionInput,
  InteractionType,
  InteractionResult,
} from "@/lib/types/clients";

// ===========================================
// Helper Functions
// ===========================================

/**
 * Calcula o status do cliente baseado em suas cotacoes
 */
export function calculateClientStatus(
  customerCreatedAt: Date,
  quotationsList: Array<{ status: string; createdAt: Date | null }>
): ClientStatus {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Prioridade 1: Se tem cotacao aceita = CONVERTED
  if (quotationsList.some((q) => q.status === "ACCEPTED")) {
    return "CONVERTED";
  }

  // Prioridade 2: Se tem cotacao pendente/contatada = NEGOTIATING
  if (
    quotationsList.some((q) =>
      ["PENDING", "CONTACTED"].includes(q.status)
    )
  ) {
    return "NEGOTIATING";
  }

  // Prioridade 3: Se cadastrado nos ultimos 7 dias e sem cotacao = NEW
  if (customerCreatedAt > sevenDaysAgo && quotationsList.length === 0) {
    return "NEW";
  }

  // Prioridade 4: Se so tem cotacoes expiradas/canceladas/rejeitadas = LOST
  if (
    quotationsList.length > 0 &&
    quotationsList.every((q) =>
      ["EXPIRED", "CANCELLED", "REJECTED"].includes(q.status)
    )
  ) {
    return "LOST";
  }

  // Prioridade 5: Se sem cotacao nos ultimos 30 dias = INACTIVE
  const recentQuotation = quotationsList.some(
    (q) => q.createdAt && q.createdAt > thirtyDaysAgo
  );
  if (!recentQuotation && quotationsList.length > 0) {
    return "INACTIVE";
  }

  // Default para clientes novos sem cotacao
  if (quotationsList.length === 0) {
    return "NEW";
  }

  return "NEGOTIATING";
}

/**
 * Traduz o status do cliente para exibicao
 */
export function translateClientStatus(status: ClientStatus): string {
  const translations: Record<ClientStatus, string> = {
    CONVERTED: "Convertido",
    NEGOTIATING: "Em Negociacao",
    INACTIVE: "Inativo",
    LOST: "Perdido",
    NEW: "Novo",
  };
  return translations[status];
}

// ===========================================
// List Clients
// ===========================================

export async function listClients(
  currentSellerId: string | null,
  isAdmin: boolean,
  filters: ClientFilters
): Promise<ListClientsResult> {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Se nao for admin, forcar filtro pelo vendedor logado
  const effectiveSellerId = isAdmin ? filters.sellerId : currentSellerId;

  // Build where conditions
  const conditions: ReturnType<typeof sql>[] = [];

  // Excluir clientes deletados
  conditions.push(isNull(customers.deletedAt));

  // Filtro por vendedor (via cotacoes)
  if (effectiveSellerId) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(quotations)
          .where(
            and(
              eq(quotations.customerId, customers.id),
              eq(quotations.sellerId, effectiveSellerId)
            )
          )
      )
    );
  }

  // Busca
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(customers.name, searchTerm),
        ilike(customers.cpf, searchTerm),
        ilike(customers.phone, searchTerm),
        ilike(customers.email, searchTerm),
        ilike(customers.city, searchTerm)
      )!
    );
  }

  // Filtro por cidade
  if (filters.city) {
    conditions.push(eq(customers.city, filters.city));
  }

  // Filtro por periodo de cadastro
  if (filters.dateFrom) {
    conditions.push(gte(customers.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(customers.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

  // Contar total
  const [countResult] = await db
    .select({ count: sql<number>`count(distinct ${customers.id})::int` })
    .from(customers)
    .where(whereClause);

  const total = countResult?.count || 0;

  // Query principal com metricas
  const rawClients = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      cpf: customers.cpf,
      city: customers.city,
      state: customers.state,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(whereClause)
    .orderBy(
      filters.orderDir === "desc"
        ? desc(customers[filters.orderBy === "name" ? "name" : "createdAt"])
        : asc(customers[filters.orderBy === "name" ? "name" : "createdAt"])
    )
    .limit(limit)
    .offset(offset);

  // Buscar metricas para cada cliente
  const clientsWithMetrics: ClientWithMetrics[] = await Promise.all(
    rawClients.map(async (client) => {
      // Buscar cotacoes do cliente
      const clientQuotations = await db
        .select({
          status: quotations.status,
          mensalidade: quotations.mensalidade,
          createdAt: quotations.createdAt,
        })
        .from(quotations)
        .where(eq(quotations.customerId, client.id));

      // Buscar ultima interacao
      const [lastInteraction] = await db
        .select({ createdAt: clientInteractions.createdAt })
        .from(clientInteractions)
        .where(eq(clientInteractions.customerId, client.id))
        .orderBy(desc(clientInteractions.createdAt))
        .limit(1);

      // Calcular metricas
      const quotationCount = clientQuotations.length;
      const acceptedQuotations = clientQuotations.filter(
        (q) => q.status === "ACCEPTED"
      ).length;
      const monthlyValue = clientQuotations
        .filter((q) => q.status === "ACCEPTED")
        .reduce((sum, q) => sum + parseFloat(q.mensalidade), 0);

      const status = calculateClientStatus(
        client.createdAt!,
        clientQuotations.map((q) => ({
          status: q.status,
          createdAt: q.createdAt,
        }))
      );

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf,
        city: client.city,
        state: client.state,
        status,
        quotationCount,
        acceptedQuotations,
        monthlyValue,
        lastInteractionAt: lastInteraction?.createdAt || null,
        createdAt: client.createdAt!,
      };
    })
  );

  // Filtrar por status (pos-calculo)
  let filteredClients = clientsWithMetrics;
  if (filters.status && filters.status.length > 0) {
    filteredClients = clientsWithMetrics.filter((c) =>
      filters.status!.includes(c.status)
    );
  }

  return {
    items: filteredClients,
    total,
  };
}

// ===========================================
// KPIs
// ===========================================

export async function getClientKPIs(
  sellerId: string | null,
  isAdmin: boolean
): Promise<ClientKPIs> {
  const effectiveSellerId = isAdmin ? null : sellerId;

  // Condicao base: clientes nao deletados
  let baseCondition = isNull(customers.deletedAt);

  // Se tiver sellerId, filtrar por cotacoes desse vendedor
  if (effectiveSellerId) {
    baseCondition = and(
      baseCondition,
      exists(
        db
          .select({ one: sql`1` })
          .from(quotations)
          .where(
            and(
              eq(quotations.customerId, customers.id),
              eq(quotations.sellerId, effectiveSellerId)
            )
          )
      )
    )!;
  }

  // Total de clientes
  const [totalResult] = await db
    .select({ count: sql<number>`count(distinct ${customers.id})::int` })
    .from(customers)
    .where(baseCondition);

  const total = totalResult?.count || 0;

  // Convertidos (pelo menos 1 cotacao aceita)
  const convertedCondition = effectiveSellerId
    ? and(
        eq(quotations.status, "ACCEPTED"),
        eq(quotations.sellerId, effectiveSellerId)
      )
    : eq(quotations.status, "ACCEPTED");

  const [convertedResult] = await db
    .select({ count: sql<number>`count(distinct ${customers.id})::int` })
    .from(customers)
    .innerJoin(quotations, eq(quotations.customerId, customers.id))
    .where(and(isNull(customers.deletedAt), convertedCondition));

  const converted = convertedResult?.count || 0;

  // Em negociacao (cotacao pendente ou contatada)
  const negotiatingCondition = effectiveSellerId
    ? and(
        sql`${quotations.status} IN ('PENDING', 'CONTACTED')`,
        eq(quotations.sellerId, effectiveSellerId)
      )
    : sql`${quotations.status} IN ('PENDING', 'CONTACTED')`;

  const [negotiatingResult] = await db
    .select({ count: sql<number>`count(distinct ${customers.id})::int` })
    .from(customers)
    .innerJoin(quotations, eq(quotations.customerId, customers.id))
    .where(and(isNull(customers.deletedAt), negotiatingCondition));

  const negotiating = negotiatingResult?.count || 0;

  // Inativos (calculado como total - convertidos - negociando)
  const inactive = Math.max(0, total - converted - negotiating);

  const convertedPercentage = total > 0 ? (converted / total) * 100 : 0;

  return {
    total,
    converted,
    convertedPercentage: Math.round(convertedPercentage * 10) / 10,
    negotiating,
    inactive,
  };
}

// ===========================================
// Distinct Cities
// ===========================================

export async function getDistinctCities(
  sellerId: string | null,
  isAdmin: boolean
): Promise<string[]> {
  const effectiveSellerId = isAdmin ? null : sellerId;

  let condition = isNull(customers.deletedAt);

  if (effectiveSellerId) {
    condition = and(
      condition,
      exists(
        db
          .select({ one: sql`1` })
          .from(quotations)
          .where(
            and(
              eq(quotations.customerId, customers.id),
              eq(quotations.sellerId, effectiveSellerId)
            )
          )
      )
    )!;
  }

  const results = await db
    .selectDistinct({ city: customers.city })
    .from(customers)
    .where(condition)
    .orderBy(asc(customers.city));

  return results.map((r) => r.city);
}

// ===========================================
// Client Profile
// ===========================================

export async function getClientProfile(
  clientId: string,
  currentSellerId: string | null,
  isAdmin: boolean
): Promise<ClientProfile | null> {
  // Buscar cliente
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, clientId), isNull(customers.deletedAt)));

  if (!customer) {
    return null;
  }

  // Verificar autorizacao
  if (!isAdmin && currentSellerId) {
    const [hasAccess] = await db
      .select({ one: sql`1` })
      .from(quotations)
      .where(
        and(
          eq(quotations.customerId, clientId),
          eq(quotations.sellerId, currentSellerId)
        )
      )
      .limit(1);

    if (!hasAccess) {
      return null;
    }
  }

  // Buscar cotacoes com veiculos
  const quotationsWithVehicles = await db
    .select({
      id: quotations.id,
      mensalidade: quotations.mensalidade,
      status: quotations.status,
      createdAt: quotations.createdAt,
      acceptedAt: quotations.acceptedAt,
      vehicleMarca: vehicles.marca,
      vehicleModelo: vehicles.modelo,
      vehiclePlaca: vehicles.placa,
      vehicleAno: vehicles.ano,
    })
    .from(quotations)
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .where(eq(quotations.customerId, clientId))
    .orderBy(desc(quotations.createdAt));

  // Buscar veiculos unicos
  const vehiclesMap = new Map<
    string,
    { marca: string; modelo: string; ano: string; placa: string; isProtected: boolean; hasPendingQuotation: boolean }
  >();

  for (const q of quotationsWithVehicles) {
    const key = q.vehiclePlaca;
    const existing = vehiclesMap.get(key);

    if (!existing) {
      vehiclesMap.set(key, {
        marca: q.vehicleMarca,
        modelo: q.vehicleModelo,
        ano: q.vehicleAno,
        placa: q.vehiclePlaca,
        isProtected: q.status === "ACCEPTED",
        hasPendingQuotation: ["PENDING", "CONTACTED"].includes(q.status),
      });
    } else {
      if (q.status === "ACCEPTED") existing.isProtected = true;
      if (["PENDING", "CONTACTED"].includes(q.status))
        existing.hasPendingQuotation = true;
    }
  }

  // Buscar interacoes
  const interactionsData = await db
    .select({
      id: clientInteractions.id,
      type: clientInteractions.type,
      result: clientInteractions.result,
      description: clientInteractions.description,
      createdAt: clientInteractions.createdAt,
      sellerName: sellers.name,
    })
    .from(clientInteractions)
    .leftJoin(sellers, eq(clientInteractions.sellerId, sellers.id))
    .where(eq(clientInteractions.customerId, clientId))
    .orderBy(desc(clientInteractions.createdAt));

  // Buscar vendedor responsavel (da cotacao aceita ou mais recente)
  const [sellerData] = await db
    .select({
      id: sellers.id,
      name: sellers.name,
      email: sellers.email,
      phone: sellers.phone,
    })
    .from(quotations)
    .innerJoin(sellers, eq(quotations.sellerId, sellers.id))
    .where(eq(quotations.customerId, clientId))
    .orderBy(
      desc(sql`CASE WHEN ${quotations.status} = 'ACCEPTED' THEN 1 ELSE 0 END`),
      desc(quotations.createdAt)
    )
    .limit(1);

  // Calcular status
  const status = calculateClientStatus(
    customer.createdAt!,
    quotationsWithVehicles.map((q) => ({
      status: q.status,
      createdAt: q.createdAt,
    }))
  );

  return {
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
    status,
    createdAt: customer.createdAt!,
    quotations: quotationsWithVehicles.map((q) => ({
      id: q.id,
      vehicleMarca: q.vehicleMarca,
      vehicleModelo: q.vehicleModelo,
      vehiclePlaca: q.vehiclePlaca,
      mensalidade: parseFloat(q.mensalidade),
      status: q.status,
      createdAt: q.createdAt!,
      acceptedAt: q.acceptedAt,
    })),
    vehicles: Array.from(vehiclesMap.values()),
    interactions: interactionsData.map((i) => ({
      id: i.id,
      customerId: clientId,
      sellerId: "",
      type: i.type as InteractionType,
      result: i.result as InteractionResult | null,
      description: i.description,
      scheduledFollowUp: null,
      createdAt: i.createdAt!,
      authorName: i.sellerName || undefined,
    })),
    seller: sellerData || null,
  };
}

// ===========================================
// Client Quotations
// ===========================================

export async function getClientQuotations(
  clientId: string,
  currentSellerId: string | null,
  isAdmin: boolean
): Promise<ClientQuotationsSummary | null> {
  // Verificar autorizacao
  if (!isAdmin && currentSellerId) {
    const [hasAccess] = await db
      .select({ one: sql`1` })
      .from(quotations)
      .where(
        and(
          eq(quotations.customerId, clientId),
          eq(quotations.sellerId, currentSellerId)
        )
      )
      .limit(1);

    if (!hasAccess) {
      return null;
    }
  }

  // Buscar todas as cotacoes
  const quotationsData = await db
    .select({
      id: quotations.id,
      mensalidade: quotations.mensalidade,
      adesao: quotations.adesao,
      adesaoDesconto: quotations.adesaoDesconto,
      status: quotations.status,
      createdAt: quotations.createdAt,
      expiresAt: quotations.expiresAt,
      acceptedAt: quotations.acceptedAt,
      vehicleMarca: vehicles.marca,
      vehicleModelo: vehicles.modelo,
      vehicleAno: vehicles.ano,
      vehiclePlaca: vehicles.placa,
      vehicleValorFipe: vehicles.valorFipe,
      sellerId: sellers.id,
      sellerName: sellers.name,
    })
    .from(quotations)
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .leftJoin(sellers, eq(quotations.sellerId, sellers.id))
    .where(eq(quotations.customerId, clientId))
    .orderBy(desc(quotations.createdAt));

  const total = quotationsData.length;
  const accepted = quotationsData.filter((q) => q.status === "ACCEPTED").length;
  const activeMonthlyValue = quotationsData
    .filter((q) => q.status === "ACCEPTED")
    .reduce((sum, q) => sum + parseFloat(q.mensalidade), 0);

  return {
    total,
    accepted,
    activeMonthlyValue,
    quotations: quotationsData.map((q) => ({
      id: q.id,
      vehicle: {
        marca: q.vehicleMarca,
        modelo: q.vehicleModelo,
        ano: q.vehicleAno,
        placa: q.vehiclePlaca,
        valorFipe: parseFloat(q.vehicleValorFipe),
      },
      mensalidade: parseFloat(q.mensalidade),
      adesao: parseFloat(q.adesao),
      adesaoDesconto: parseFloat(q.adesaoDesconto),
      status: q.status,
      createdAt: q.createdAt!,
      expiresAt: q.expiresAt,
      acceptedAt: q.acceptedAt,
      seller: q.sellerId
        ? {
            id: q.sellerId,
            name: q.sellerName!,
          }
        : null,
    })),
  };
}

// ===========================================
// Client Interactions
// ===========================================

export async function createClientInteraction(
  input: CreateInteractionInput,
  sellerId: string
): Promise<ClientInteraction> {
  const [interaction] = await db
    .insert(clientInteractions)
    .values({
      customerId: input.customerId,
      sellerId,
      type: input.type,
      result: input.result || null,
      description: input.description,
      scheduledFollowUp: input.scheduledFollowUp || null,
    })
    .returning();

  return {
    id: interaction.id,
    customerId: interaction.customerId,
    sellerId: interaction.sellerId,
    type: interaction.type as InteractionType,
    result: interaction.result as InteractionResult | null,
    description: interaction.description,
    scheduledFollowUp: interaction.scheduledFollowUp,
    createdAt: interaction.createdAt!,
  };
}

export async function getClientInteractions(
  clientId: string,
  options?: { limit?: number }
): Promise<ClientInteraction[]> {
  const limit = options?.limit || 50;

  const results = await db
    .select({
      id: clientInteractions.id,
      customerId: clientInteractions.customerId,
      sellerId: clientInteractions.sellerId,
      type: clientInteractions.type,
      result: clientInteractions.result,
      description: clientInteractions.description,
      scheduledFollowUp: clientInteractions.scheduledFollowUp,
      createdAt: clientInteractions.createdAt,
      authorName: sellers.name,
    })
    .from(clientInteractions)
    .leftJoin(sellers, eq(clientInteractions.sellerId, sellers.id))
    .where(eq(clientInteractions.customerId, clientId))
    .orderBy(desc(clientInteractions.createdAt))
    .limit(limit);

  return results.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    sellerId: r.sellerId,
    type: r.type as InteractionType,
    result: r.result as InteractionResult | null,
    description: r.description,
    scheduledFollowUp: r.scheduledFollowUp,
    createdAt: r.createdAt!,
    authorName: r.authorName || undefined,
  }));
}

// ===========================================
// Soft Delete
// ===========================================

export async function softDeleteClient(
  clientId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _adminId: string
): Promise<{ success: boolean }> {
  const [updated] = await db
    .update(customers)
    .set({ deletedAt: new Date() })
    .where(and(eq(customers.id, clientId), isNull(customers.deletedAt)))
    .returning();

  return { success: !!updated };
}

// ===========================================
// Export CSV
// ===========================================

export async function exportClientsCSV(
  currentSellerId: string | null,
  isAdmin: boolean,
  filters: Omit<ClientFilters, "page" | "limit">
): Promise<string> {
  // Buscar todos os clientes sem paginacao
  const result = await listClients(currentSellerId, isAdmin, {
    ...filters,
    page: 1,
    limit: 10000, // Limite alto para exportacao
  });

  const headers = [
    "Nome",
    "CPF",
    "Telefone",
    "Email",
    "Cidade",
    "Estado",
    "Status",
    "Cotacoes",
    "Cotacoes Aceitas",
    "Valor Mensal",
    "Ultimo Contato",
    "Data Cadastro",
  ];

  const rows = result.items.map((c) => [
    `"${c.name}"`,
    c.cpf,
    c.phone,
    c.email,
    `"${c.city}"`,
    c.state,
    translateClientStatus(c.status),
    c.quotationCount.toString(),
    c.acceptedQuotations.toString(),
    c.monthlyValue.toFixed(2),
    c.lastInteractionAt
      ? c.lastInteractionAt.toLocaleDateString("pt-BR")
      : "",
    c.createdAt.toLocaleDateString("pt-BR"),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  return csv;
}

// ===========================================
// List Sellers (for Admin Filter)
// ===========================================

export interface SellerOption {
  id: string;
  name: string;
}

export async function listSellers(): Promise<SellerOption[]> {
  const results = await db
    .select({
      id: sellers.id,
      name: sellers.name,
    })
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"))
    .orderBy(asc(sellers.name));

  return results;
}
