/**
 * Dashboard Types
 * Feature: 002-dashboard
 *
 * Types and interfaces for the Dashboard feature.
 */

// ===========================================
// Enums & Constants
// ===========================================

export type QuotationStatus =
  | "PENDING"
  | "CONTACTED"
  | "ACCEPTED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type VehicleCategory = "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO";

export type PeriodFilter = "today" | "week" | "month";

export const STATUS_COLORS = {
  PENDING: "bg-amber-500 text-amber-50",
  CONTACTED: "bg-blue-500 text-blue-50",
  ACCEPTED: "bg-green-500 text-green-50",
  EXPIRED: "bg-gray-500 text-gray-50",
  CANCELLED: "bg-red-500 text-red-50",
  REJECTED: "bg-red-500 text-red-50",
} as const;

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  PENDING: "Pendente",
  CONTACTED: "Contatado",
  ACCEPTED: "Aceita",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
  REJECTED: "Rejeitada",
};

export const URGENCY_COLORS = {
  expiring: "bg-red-50 border-red-200 text-red-700",
  noContact: "bg-amber-50 border-amber-200 text-amber-700",
} as const;

export const VEHICLE_ICONS = {
  NORMAL: "Car",
  ESPECIAL: "Car",
  UTILITARIO: "Truck",
  MOTO: "Bike",
} as const;

// ===========================================
// KPI Types
// ===========================================

export interface KpiData {
  pending: KpiCard;
  accepted: KpiCard;
  potential: KpiCard;
  conversion: KpiCard;
}

export interface KpiCard {
  value: number;
  change: string;
  label: string;
}

// ===========================================
// Alert Types
// ===========================================

export interface UrgentAlert {
  type: "expiring" | "noContact";
  count: number;
  message: string;
}

// ===========================================
// Quotation List Types
// ===========================================

export interface QuotationListItem {
  id: string;
  vehicle: {
    marca: string;
    modelo: string;
    ano: string;
    valorFipe: number;
    categoria: VehicleCategory;
  };
  customer: {
    name: string;
    phone: string;
  };
  mensalidade: number;
  status: QuotationStatus;
  createdAt: Date;
  expiresAt: Date | null;
}

// ===========================================
// Status Distribution Types
// ===========================================

export interface StatusDistributionItem {
  status: QuotationStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

// ===========================================
// Ranking Types
// ===========================================

export interface RankingItem {
  position: number;
  sellerId: string;
  name: string;
  acceptedCount: number;
  isCurrentUser: boolean;
}

export interface RankingData {
  items: RankingItem[];
  maxAccepted: number;
  currentUserGap: number;
}

// ===========================================
// Goal/Meta Types
// ===========================================

export interface GoalData {
  hasGoal: boolean;
  targetAccepted: number;
  currentAccepted: number;
  percentage: number;
  remaining: number;
  conversionRate: number;
}

// ===========================================
// Dashboard Complete Data
// ===========================================

export interface DashboardData {
  user: {
    name: string;
    sellerId: string;
  };
  kpis: KpiData;
  urgentAlerts: UrgentAlert[];
  recentQuotations: QuotationListItem[];
  statusDistribution: StatusDistributionItem[];
  ranking: RankingData;
  goal: GoalData;
}

// ===========================================
// Period Helpers
// ===========================================

export interface DateRange {
  start: Date;
  end: Date;
}

// ===========================================
// Server Action Types
// ===========================================

export interface MarkContactedResult {
  success: boolean;
  error?: string;
}
