# Types: Gestao de Vendedores

**Feature**: 005-gestao-vendedores
**Date**: 2025-11-27

## Arquivo: `lib/types/sellers.ts`

```typescript
// ===========================================
// Enums
// ===========================================

export type SellerStatus = 'ACTIVE' | 'INACTIVE' | 'VACATION';
export type SellerRole = 'SELLER' | 'ADMIN';
export type RoundRobinMethod = 'SEQUENTIAL' | 'LOAD_BALANCE' | 'PERFORMANCE' | 'SPEED';

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
  assignmentCount: number;
  createdAt: Date;
}

export interface RoundRobinConfig {
  id: string;
  method: RoundRobinMethod;
  currentIndex: number;
  pendingLeadLimit: number | null;
  skipOverloaded: boolean;
  notifyWhenAllOverloaded: boolean;
  updatedAt: Date;
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
  month: string; // 'Jan', 'Fev', etc.
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
  sortOrder?: 'asc' | 'desc';
}

export type SellerSortField =
  | 'name'
  | 'quotations'
  | 'accepted'
  | 'conversion'
  | 'responseTime'
  | 'lastLead'
  | 'createdAt';

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
  pendingLeadsAction?: 'keep' | 'redistribute' | 'assign';
  assignToSellerId?: string;
}

export interface ReassignLeadsData {
  quotationIds: string[];
  distribution: 'equal' | 'specific';
  toSellerId?: string;
}

// ===========================================
// Status Config
// ===========================================

export const SELLER_STATUS_CONFIG: Record<
  SellerStatus,
  { label: string; variant: 'success' | 'destructive' | 'warning' }
> = {
  ACTIVE: { label: 'Ativo', variant: 'success' },
  INACTIVE: { label: 'Inativo', variant: 'destructive' },
  VACATION: { label: 'Ferias', variant: 'warning' },
};

export const ROUND_ROBIN_METHOD_CONFIG: Record<
  RoundRobinMethod,
  { label: string; description: string }
> = {
  SEQUENTIAL: {
    label: 'Sequencial (Round-Robin Classico)',
    description: 'Distribui leads em ordem fixa, um para cada vendedor',
  },
  LOAD_BALANCE: {
    label: 'Balanceamento por carga',
    description: 'Prioriza vendedores com menos leads pendentes',
  },
  PERFORMANCE: {
    label: 'Por performance',
    description: 'Prioriza vendedores com melhor taxa de conversao',
  },
  SPEED: {
    label: 'Por velocidade',
    description: 'Prioriza vendedores com menor tempo de resposta',
  },
};
```
