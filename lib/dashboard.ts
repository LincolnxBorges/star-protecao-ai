/**
 * Dashboard Context Module
 * Feature: 002-dashboard
 *
 * Business logic for the seller dashboard.
 * Following Constitution Principle I: Context-Oriented Architecture
 */

import { db } from "@/lib/db";
import {
  quotations,
  sellers,
  customers,
  vehicles,
  sellerGoals,
} from "@/lib/schema";
import { eq, and, gte, lte, count, sql, isNull, desc } from "drizzle-orm";
import type {
  PeriodFilter,
  DateRange,
  KpiData,
  UrgentAlert,
  QuotationListItem,
  QuotationStatus,
  StatusDistributionItem,
  RankingData,
  RankingItem,
  GoalData,
} from "@/lib/types/dashboard";

// ===========================================
// Constants
// ===========================================

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  PENDING: "Pendente",
  CONTACTED: "Contatado",
  ACCEPTED: "Aceita",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
  REJECTED: "Rejeitada",
};

export const STATUS_COLORS: Record<QuotationStatus, string> = {
  PENDING: "bg-amber-500",
  CONTACTED: "bg-blue-500",
  ACCEPTED: "bg-green-500",
  EXPIRED: "bg-gray-500",
  CANCELLED: "bg-red-500",
  REJECTED: "bg-red-500",
};

// ===========================================
// Period Helpers (T008)
// ===========================================

export function getPeriodRange(period: PeriodFilter): DateRange {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function getMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ===========================================
// Seller Helpers (T009)
// ===========================================

export async function getSellerByUserId(userId: string) {
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, userId))
    .limit(1);

  return seller || null;
}

// ===========================================
// Greeting Helper
// ===========================================

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// ===========================================
// KPI Functions (T012-T016)
// ===========================================

export async function getKpiPending(
  sellerId: string,
  period: PeriodFilter
): Promise<number> {
  const range = getPeriodRange(period);

  const [result] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING"),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    );

  return result?.count ?? 0;
}

export async function getKpiAccepted(
  sellerId: string,
  period: PeriodFilter
): Promise<number> {
  const range = getPeriodRange(period);

  const [result] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    );

  return result?.count ?? 0;
}

export async function getKpiPotential(sellerId: string): Promise<number> {
  const range = getMonthRange();

  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${quotations.mensalidade}), 0)`,
    })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.acceptedAt, range.start),
        lte(quotations.acceptedAt, range.end)
      )
    );

  return parseFloat(result?.total ?? "0");
}

export async function getKpiConversion(
  sellerId: string,
  period: PeriodFilter
): Promise<number> {
  const range = getPeriodRange(period);

  const [totalResult] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    );

  const [acceptedResult] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    );

  const total = totalResult?.count ?? 0;
  const accepted = acceptedResult?.count ?? 0;

  if (total === 0) return 0;
  return Math.round((accepted / total) * 100 * 10) / 10;
}

async function getYesterdayPending(sellerId: string): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const [result] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING"),
        gte(quotations.createdAt, yesterday),
        lte(quotations.createdAt, yesterdayEnd)
      )
    );

  return result?.count ?? 0;
}

async function getLastMonthConversion(sellerId: string): Promise<number> {
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [totalResult] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        gte(quotations.createdAt, lastMonthStart),
        lte(quotations.createdAt, lastMonthEnd)
      )
    );

  const [acceptedResult] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.createdAt, lastMonthStart),
        lte(quotations.createdAt, lastMonthEnd)
      )
    );

  const total = totalResult?.count ?? 0;
  const accepted = acceptedResult?.count ?? 0;

  if (total === 0) return 0;
  return Math.round((accepted / total) * 100 * 10) / 10;
}

export async function getKpis(
  sellerId: string,
  period: PeriodFilter
): Promise<KpiData> {
  const [pending, accepted, potential, conversion] = await Promise.all([
    getKpiPending(sellerId, period),
    getKpiAccepted(sellerId, period),
    getKpiPotential(sellerId),
    getKpiConversion(sellerId, period),
  ]);

  // Calculate changes
  const yesterdayPending = await getYesterdayPending(sellerId);
  const pendingChange = pending - yesterdayPending;

  const lastMonthConversion = await getLastMonthConversion(sellerId);
  const conversionChange = conversion - lastMonthConversion;

  return {
    pending: {
      value: pending,
      change: pendingChange >= 0 ? `+${pendingChange} hoje` : `${pendingChange} hoje`,
      label: "Pendentes",
    },
    accepted: {
      value: accepted,
      change: `${accepted} no período`,
      label: "Aceitas",
    },
    potential: {
      value: potential,
      change: "este mês",
      label: "Potencial Mensal",
    },
    conversion: {
      value: conversion,
      change: conversionChange >= 0 ? `↑ ${conversionChange}%` : `↓ ${Math.abs(conversionChange)}%`,
      label: "Conversão",
    },
  };
}

// ===========================================
// Alert Functions (T022-T024)
// ===========================================

export async function getExpiringTodayAlerts(sellerId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [result] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING"),
        gte(quotations.expiresAt, today),
        lte(quotations.expiresAt, todayEnd)
      )
    );

  return result?.count ?? 0;
}

export async function getNoContactAlerts(sellerId: string): Promise<number> {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const [result] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING"),
        isNull(quotations.contactedAt),
        lte(quotations.createdAt, twentyFourHoursAgo)
      )
    );

  return result?.count ?? 0;
}

export async function getUrgentAlerts(sellerId: string): Promise<UrgentAlert[]> {
  const [expiringCount, noContactCount] = await Promise.all([
    getExpiringTodayAlerts(sellerId),
    getNoContactAlerts(sellerId),
  ]);

  const alerts: UrgentAlert[] = [];

  if (expiringCount > 0) {
    alerts.push({
      type: "expiring",
      count: expiringCount,
      message: `${expiringCount} ${expiringCount === 1 ? "cotação expira" : "cotações expiram"} HOJE`,
    });
  }

  if (noContactCount > 0) {
    alerts.push({
      type: "noContact",
      count: noContactCount,
      message: `${noContactCount} ${noContactCount === 1 ? "lead" : "leads"} sem contato há 24h+`,
    });
  }

  return alerts;
}

// ===========================================
// Quotation List Functions (T030-T031)
// ===========================================

export async function getRecentQuotations(
  sellerId: string,
  limit: number = 4
): Promise<QuotationListItem[]> {
  const results = await db
    .select({
      id: quotations.id,
      mensalidade: quotations.mensalidade,
      status: quotations.status,
      createdAt: quotations.createdAt,
      expiresAt: quotations.expiresAt,
      vehicleMarca: vehicles.marca,
      vehicleModelo: vehicles.modelo,
      vehicleAno: vehicles.ano,
      vehicleValorFipe: vehicles.valorFipe,
      vehicleCategoria: vehicles.categoria,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(quotations)
    .innerJoin(vehicles, eq(quotations.vehicleId, vehicles.id))
    .innerJoin(customers, eq(quotations.customerId, customers.id))
    .where(eq(quotations.sellerId, sellerId))
    .orderBy(desc(quotations.createdAt))
    .limit(limit);

  return results.map((row) => ({
    id: row.id,
    vehicle: {
      marca: row.vehicleMarca,
      modelo: row.vehicleModelo,
      ano: row.vehicleAno,
      valorFipe: parseFloat(row.vehicleValorFipe),
      categoria: row.vehicleCategoria as "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO",
    },
    customer: {
      name: row.customerName,
      phone: row.customerPhone,
    },
    mensalidade: parseFloat(row.mensalidade),
    status: row.status as QuotationStatus,
    createdAt: row.createdAt!,
    expiresAt: row.expiresAt,
  }));
}

export async function markAsContacted(quotationId: string): Promise<boolean> {
  const now = new Date();

  const [result] = await db
    .update(quotations)
    .set({
      status: "CONTACTED",
      contactedAt: now,
    })
    .where(
      and(
        eq(quotations.id, quotationId),
        eq(quotations.status, "PENDING")
      )
    )
    .returning({ id: quotations.id });

  return !!result;
}

// ===========================================
// Status Distribution Functions (T039)
// ===========================================

export async function getStatusDistribution(
  sellerId: string,
  period: PeriodFilter
): Promise<StatusDistributionItem[]> {
  const range = getPeriodRange(period);

  const results = await db
    .select({
      status: quotations.status,
      count: count(),
    })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    )
    .groupBy(quotations.status);

  const total = results.reduce((sum, r) => sum + r.count, 0);

  // Only include statuses that have data (as per clarification)
  const statusOrder: QuotationStatus[] = [
    "PENDING",
    "CONTACTED",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED",
  ];

  return statusOrder
    .filter((status) => results.some((r) => r.status === status))
    .map((status) => {
      const result = results.find((r) => r.status === status);
      const statusCount = result?.count ?? 0;
      return {
        status,
        label: STATUS_LABELS[status],
        count: statusCount,
        percentage: total > 0 ? Math.round((statusCount / total) * 100) : 0,
        color: STATUS_COLORS[status],
      };
    });
}

// ===========================================
// Ranking Functions (T044)
// ===========================================

export async function getRanking(currentSellerId: string): Promise<RankingData> {
  const range = getMonthRange();

  // Get all sellers with their accepted quotation counts for the month
  const results = await db
    .select({
      sellerId: sellers.id,
      name: sellers.name,
      acceptedCount: count(quotations.id),
    })
    .from(sellers)
    .leftJoin(
      quotations,
      and(
        eq(quotations.sellerId, sellers.id),
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.acceptedAt, range.start),
        lte(quotations.acceptedAt, range.end)
      )
    )
    .where(eq(sellers.status, "ACTIVE"))
    .groupBy(sellers.id, sellers.name)
    .orderBy(desc(count(quotations.id)))
    .limit(5);

  const items: RankingItem[] = results.map((row, index) => ({
    position: index + 1,
    sellerId: row.sellerId,
    name: row.name,
    acceptedCount: row.acceptedCount,
    isCurrentUser: row.sellerId === currentSellerId,
  }));

  const maxAccepted = items.length > 0 ? items[0].acceptedCount : 0;
  const currentUser = items.find((item) => item.isCurrentUser);
  const leader = items[0];

  // Calculate gap to first place
  let currentUserGap = 0;
  if (currentUser && leader && currentUser.sellerId !== leader.sellerId) {
    currentUserGap = leader.acceptedCount - currentUser.acceptedCount;
  }

  return {
    items,
    maxAccepted,
    currentUserGap,
  };
}

// ===========================================
// Goal Progress Functions (T050)
// ===========================================

export async function getGoalProgress(sellerId: string): Promise<GoalData> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const range = getMonthRange();

  // Get current month's goal
  const [goal] = await db
    .select()
    .from(sellerGoals)
    .where(
      and(
        eq(sellerGoals.sellerId, sellerId),
        eq(sellerGoals.month, currentMonth),
        eq(sellerGoals.year, currentYear)
      )
    )
    .limit(1);

  // Get current accepted count for the month
  const [acceptedResult] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.acceptedAt, range.start),
        lte(quotations.acceptedAt, range.end)
      )
    );

  // Get total quotations for conversion rate
  const [totalResult] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    );

  const currentAccepted = acceptedResult?.count ?? 0;
  const totalQuotations = totalResult?.count ?? 0;
  const conversionRate =
    totalQuotations > 0
      ? Math.round((currentAccepted / totalQuotations) * 100 * 10) / 10
      : 0;

  if (!goal) {
    return {
      hasGoal: false,
      targetAccepted: 0,
      currentAccepted,
      percentage: 0,
      remaining: 0,
      conversionRate,
    };
  }

  const percentage = Math.min(
    Math.round((currentAccepted / goal.targetAccepted) * 100),
    100
  );
  const remaining = Math.max(goal.targetAccepted - currentAccepted, 0);

  return {
    hasGoal: true,
    targetAccepted: goal.targetAccepted,
    currentAccepted,
    percentage,
    remaining,
    conversionRate,
  };
}
