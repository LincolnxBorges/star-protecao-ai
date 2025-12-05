/**
 * Types for Quotation Management
 * @module lib/types/quotations
 */

// ===========================================
// Status and Category Types
// ===========================================

export type QuotationStatus =
  | "PENDING"
  | "CONTACTED"
  | "ACCEPTED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type VehicleCategory = "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO";

export type UsageType = "PARTICULAR" | "COMERCIAL";

export type ActivityType =
  | "CREATION"
  | "STATUS_CHANGE"
  | "WHATSAPP_SENT"
  | "NOTE"
  | "CALL"
  | "EMAIL"
  | "ASSIGNMENT";

// ===========================================
// Filter and Query Types
// ===========================================

export interface QuotationFilters {
  status?: QuotationStatus[];
  category?: VehicleCategory[];
  sellerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fipeMin?: number;
  fipeMax?: number;
  page?: number;
  limit?: number;
  orderBy?: "createdAt" | "mensalidade" | "valorFipe" | "customerName";
  orderDir?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===========================================
// Activity Types
// ===========================================

export interface QuotationActivity {
  id: string;
  quotationId: string;
  type: ActivityType;
  description: string;
  authorId: string | null;
  authorName: string | null;
  metadata: string | null;
  createdAt: Date;
}

export interface CreateActivityData {
  quotationId: string;
  type: ActivityType;
  description: string;
  authorId?: string;
  authorName?: string;
  metadata?: Record<string, unknown>;
}

// ===========================================
// Status Count Types
// ===========================================

export interface StatusCount {
  status: QuotationStatus;
  count: number;
}

export interface StatusCountsResult {
  counts: StatusCount[];
  total: number;
}

// ===========================================
// Date Period Filter
// ===========================================

export type DatePeriod = "today" | "7days" | "30days" | "custom";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

// ===========================================
// UI State Types
// ===========================================

export interface QuotationListState {
  filters: QuotationFilters;
  isLoading: boolean;
  error: string | null;
}

export interface QuotationDetailState {
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

// ===========================================
// Action Result Types
// ===========================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateStatusResult {
  success: boolean;
  quotation?: {
    id: string;
    status: QuotationStatus;
  };
  activity?: QuotationActivity;
  error?: string;
}

export interface AddNoteResult {
  success: boolean;
  activity?: QuotationActivity;
  error?: string;
}
