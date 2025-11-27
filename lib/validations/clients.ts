import { z } from "zod";

// ===========================================
// Client Validation Schemas - Gestao de Clientes
// ===========================================

export const interactionTypeValues = [
  "CALL_MADE",
  "CALL_RECEIVED",
  "WHATSAPP_SENT",
  "WHATSAPP_RECEIVED",
  "EMAIL_SENT",
  "EMAIL_RECEIVED",
  "MEETING",
  "NOTE",
] as const;

export const interactionResultValues = [
  "POSITIVE",
  "NEUTRAL",
  "NEGATIVE",
  "NO_CONTACT",
] as const;

export const clientStatusValues = [
  "CONVERTED",
  "NEGOTIATING",
  "INACTIVE",
  "LOST",
  "NEW",
] as const;

export const createInteractionSchema = z.object({
  customerId: z.string().uuid("ID de cliente invalido"),
  type: z.enum(interactionTypeValues, { message: "Selecione o tipo de interacao" }),
  result: z.enum(interactionResultValues).optional(),
  description: z
    .string()
    .min(1, "Descricao obrigatoria")
    .max(2000, "Descricao muito longa (maximo 2000 caracteres)"),
  scheduledFollowUp: z.date().optional(),
});

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(clientStatusValues)).optional(),
  city: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sellerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  orderBy: z
    .enum([
      "name",
      "createdAt",
      "quotationCount",
      "lastInteractionAt",
      "monthlyValue",
    ])
    .default("name"),
  orderDir: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;
