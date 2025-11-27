/**
 * Seller Types
 * @module lib/types/sellers
 */

import { z } from "zod";

// ===========================================
// Enums
// ===========================================

export type SellerStatus = "ACTIVE" | "INACTIVE" | "VACATION";
export type SellerRole = "SELLER" | "ADMIN";
export type RoundRobinMethod = "SEQUENTIAL" | "LOAD_BALANCE" | "PERFORMANCE" | "SPEED";

// ===========================================
// Base Types
// ===========================================

export interface Seller {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  cargo: string | null;
  image: string | null;
  status: SellerStatus;
  role: SellerRole;
  deactivationReason: string | null;
  deactivatedAt: Date | null;
  roundRobinPosition: number | null;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  lastAssignmentAt: Date | null;
  assignmentCount: number | null;
  createdAt: Date | null;
}

export interface RoundRobinConfig {
  id: string;
  method: RoundRobinMethod;
  currentIndex: number | null;
  pendingLeadLimit: number | null;
  skipOverloaded: boolean;
  notifyWhenAllOverloaded: boolean;
  updatedAt: Date | null;
}

// ===========================================
// Metrics Types
// ===========================================

export interface SellerMetrics {
  totalQuotations: number;
  acceptedQuotations: number;
  pendingQuotations: number;
  expiredQuotations: number;
  cancelledQuotations: number;
  conversionRate: number;
  avgResponseTimeHours: number | null;
  potentialRevenue: number;
  ranking: number;
}

export interface TeamMetrics {
  totalSellers: number;
  activeSellers: number;
  teamConversionRate: number;
  teamAvgResponseTimeHours: number | null;
  totalQuotationsMonth: number;
  totalAcceptedMonth: number;
  totalPotentialMonth: number;
  topSeller: {
    id: string;
    name: string;
    acceptedCount: number;
    conversionRate: number;
  } | null;
}

export interface MonthlyData {
  month: string;
  year: number;
  quotations: number;
  accepted: number;
}

// ===========================================
// Composite Types
// ===========================================

export interface SellerWithMetrics extends Seller {
  metrics: SellerMetrics;
  lastLeadReceivedAt: Date | null;
}

export interface SellerQueueItem {
  seller: Seller;
  position: number;
  isNext: boolean;
  pendingCount: number;
}

export interface QuotationSummary {
  id: string;
  vehicleMarca: string;
  vehicleModelo: string;
  vehicleAno: string;
  customerName: string;
  mensalidade: number;
  status: string;
  createdAt: Date;
}

// ===========================================
// Filter Types
// ===========================================

export interface SellerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SellerStatus[];
  sortBy?: SellerSortField;
  sortOrder?: "asc" | "desc";
}

export type SellerSortField =
  | "name"
  | "quotations"
  | "accepted"
  | "conversion"
  | "responseTime"
  | "lastLead"
  | "createdAt";

// ===========================================
// Form Types
// ===========================================

export interface CreateSellerData {
  name: string;
  email: string;
  phone: string;
  cargo?: string;
  role: SellerRole;
  password: string;
  status: SellerStatus;
  participateRoundRobin: boolean;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
}

export interface UpdateSellerData {
  name?: string;
  email?: string;
  phone?: string;
  cargo?: string;
  role?: SellerRole;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
}

export interface ChangeStatusData {
  newStatus: SellerStatus;
  reason?: string;
  pendingLeadsAction?: "keep" | "redistribute" | "assign";
  assignToSellerId?: string;
}

export interface ReassignLeadsData {
  quotationIds: string[];
  distribution: "equal" | "specific";
  toSellerId?: string;
}

// ===========================================
// Status Config
// ===========================================

export const SELLER_STATUS_CONFIG: Record<
  SellerStatus,
  { label: string; variant: "success" | "destructive" | "warning" }
> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  INACTIVE: { label: "Inativo", variant: "destructive" },
  VACATION: { label: "Ferias", variant: "warning" },
};

export const ROUND_ROBIN_METHOD_CONFIG: Record<
  RoundRobinMethod,
  { label: string; description: string }
> = {
  SEQUENTIAL: {
    label: "Sequencial (Round-Robin Classico)",
    description: "Distribui leads em ordem fixa, um para cada vendedor",
  },
  LOAD_BALANCE: {
    label: "Balanceamento por carga",
    description: "Prioriza vendedores com menos leads pendentes",
  },
  PERFORMANCE: {
    label: "Por performance",
    description: "Prioriza vendedores com melhor taxa de conversao",
  },
  SPEED: {
    label: "Por velocidade",
    description: "Prioriza vendedores com menor tempo de resposta",
  },
};

// ===========================================
// Zod Schemas
// ===========================================

// Phone validation: Brazilian format (XX) XXXXX-XXXX or (XX) XXXX-XXXX
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;

// Password: min 8 chars, at least 1 number, at least 1 uppercase
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const createSellerSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255, "Nome muito longo"),
  email: z
    .string()
    .email("Email invalido")
    .max(255, "Email muito longo"),
  phone: z
    .string()
    .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX"),
  cargo: z
    .string()
    .max(100, "Cargo muito longo")
    .optional(),
  role: z.enum(["SELLER", "ADMIN"]),
  password: z
    .string()
    .regex(
      passwordRegex,
      "Senha deve ter no minimo 8 caracteres, 1 numero e 1 letra maiuscula"
    ),
  status: z.enum(["ACTIVE", "INACTIVE", "VACATION"]),
  participateRoundRobin: z.boolean(),
  notifyEmail: z.boolean(),
  notifyWhatsapp: z.boolean(),
});

export type CreateSellerFormData = z.infer<typeof createSellerSchema>;

export const updateSellerSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255, "Nome muito longo"),
  email: z
    .string()
    .email("Email invalido")
    .max(255, "Email muito longo"),
  phone: z
    .string()
    .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX"),
  cargo: z
    .string()
    .max(100, "Cargo muito longo")
    .optional(),
  role: z.enum(["SELLER", "ADMIN"]),
  notifyEmail: z.boolean(),
  notifyWhatsapp: z.boolean(),
});

export type UpdateSellerFormData = z.infer<typeof updateSellerSchema>;

// ===========================================
// Action Results
// ===========================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListSellersResult {
  items: SellerWithMetrics[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  teamMetrics: TeamMetrics;
}

export interface SellerProfileResult {
  seller: Seller;
  metrics: SellerMetrics;
  monthlyEvolution: MonthlyData[];
  recentQuotations: QuotationSummary[];
}

export interface RoundRobinConfigResult {
  config: RoundRobinConfig;
  queue: SellerQueueItem[];
}

export interface StatusCounts {
  all: number;
  active: number;
  inactive: number;
  vacation: number;
}
