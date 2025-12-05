/**
 * Zod Schemas for Quotation Filters and Actions
 * @module lib/schemas/quotation-filters
 */

import { z } from "zod";

// ===========================================
// Enum Schemas
// ===========================================

export const quotationStatusSchema = z.enum([
  "PENDING",
  "CONTACTED",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
]);

export const vehicleCategorySchema = z.enum([
  "NORMAL",
  "ESPECIAL",
  "UTILITARIO",
  "MOTO",
]);

export const activityTypeSchema = z.enum([
  "CREATION",
  "STATUS_CHANGE",
  "WHATSAPP_SENT",
  "NOTE",
  "CALL",
  "EMAIL",
  "ASSIGNMENT",
]);

export const orderBySchema = z.enum([
  "createdAt",
  "mensalidade",
  "valorFipe",
  "customerName",
]);

export const orderDirSchema = z.enum(["asc", "desc"]);

// ===========================================
// Filter Schemas
// ===========================================

export const quotationFiltersSchema = z.object({
  status: z.array(quotationStatusSchema).optional(),
  category: z.array(vehicleCategorySchema).optional(),
  sellerId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  fipeMin: z.coerce.number().min(0).optional(),
  fipeMax: z.coerce.number().max(10000000).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(50).default(10),
  orderBy: orderBySchema.default("createdAt"),
  orderDir: orderDirSchema.default("desc"),
});

export type QuotationFiltersInput = z.infer<typeof quotationFiltersSchema>;

// ===========================================
// Action Schemas
// ===========================================

export const updateStatusSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["CONTACTED", "ACCEPTED", "CANCELLED"]),
    notes: z.string().min(1).max(500).optional(),
  })
  .refine(
    (data) => {
      // Observacao obrigatoria para ACCEPTED e CANCELLED
      if (data.status === "ACCEPTED" || data.status === "CANCELLED") {
        return !!data.notes && data.notes.trim().length > 0;
      }
      return true;
    },
    {
      message: "Observacao obrigatoria para status Aceita ou Cancelada",
      path: ["notes"],
    }
  );

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const addNoteSchema = z.object({
  quotationId: z.string().uuid(),
  type: z.enum(["NOTE", "CALL", "EMAIL", "WHATSAPP_SENT"]),
  description: z.string().min(1).max(1000),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const getQuotationSchema = z.object({
  id: z.string().uuid(),
});

export type GetQuotationInput = z.infer<typeof getQuotationSchema>;

// ===========================================
// Search Params Schema (for URL parsing)
// ===========================================

export const searchParamsSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  orderBy: z.string().optional(),
  orderDir: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  fipeMin: z.string().optional(),
  fipeMax: z.string().optional(),
});

/**
 * Parse search params from URL into QuotationFilters
 */
export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): QuotationFiltersInput {
  const parsed: Record<string, unknown> = {};

  // Parse status array
  if (params.status) {
    const statusStr =
      typeof params.status === "string" ? params.status : params.status[0];
    if (statusStr) {
      parsed.status = statusStr.split(",").filter(Boolean);
    }
  }

  // Parse category array
  if (params.category) {
    const categoryStr =
      typeof params.category === "string"
        ? params.category
        : params.category[0];
    if (categoryStr) {
      parsed.category = categoryStr.split(",").filter(Boolean);
    }
  }

  // Parse simple string params
  if (params.search) {
    parsed.search =
      typeof params.search === "string" ? params.search : params.search[0];
  }

  // Parse numeric params
  if (params.page) {
    const pageStr =
      typeof params.page === "string" ? params.page : params.page[0];
    parsed.page = parseInt(pageStr, 10);
  }

  if (params.limit) {
    const limitStr =
      typeof params.limit === "string" ? params.limit : params.limit[0];
    parsed.limit = parseInt(limitStr, 10);
  }

  if (params.fipeMin) {
    const fipeMinStr =
      typeof params.fipeMin === "string" ? params.fipeMin : params.fipeMin[0];
    parsed.fipeMin = parseFloat(fipeMinStr);
  }

  if (params.fipeMax) {
    const fipeMaxStr =
      typeof params.fipeMax === "string" ? params.fipeMax : params.fipeMax[0];
    parsed.fipeMax = parseFloat(fipeMaxStr);
  }

  // Parse order params
  if (params.orderBy) {
    parsed.orderBy =
      typeof params.orderBy === "string" ? params.orderBy : params.orderBy[0];
  }

  if (params.orderDir) {
    parsed.orderDir =
      typeof params.orderDir === "string"
        ? params.orderDir
        : params.orderDir[0];
  }

  // Parse date params
  if (params.dateFrom) {
    const dateFromStr =
      typeof params.dateFrom === "string"
        ? params.dateFrom
        : params.dateFrom[0];
    parsed.dateFrom = new Date(dateFromStr);
  }

  if (params.dateTo) {
    const dateToStr =
      typeof params.dateTo === "string" ? params.dateTo : params.dateTo[0];
    parsed.dateTo = new Date(dateToStr);
  }

  return quotationFiltersSchema.parse(parsed);
}
