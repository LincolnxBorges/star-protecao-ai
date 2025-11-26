/**
 * Zod Validation Schemas
 * @module lib/validations/schemas
 */

import { z } from "zod";
import { isValidCpf } from "./cpf";
import { isValidPlaca } from "./placa";

// ===========================================
// Enums
// ===========================================

export const vehicleCategorySchema = z.enum([
  "NORMAL",
  "ESPECIAL",
  "UTILITARIO",
  "MOTO",
]);

export const usageTypeSchema = z.enum(["PARTICULAR", "COMERCIAL"]);

export const quotationStatusSchema = z.enum([
  "PENDING",
  "CONTACTED",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
]);

export const sellerRoleSchema = z.enum(["SELLER", "ADMIN"]);

// Client-side category selection (LEVE maps to NORMAL, ESPECIAL determined by usage)
export const clientCategorySchema = z.enum(["LEVE", "UTILITARIO"]);

// ===========================================
// Customer Schema
// ===========================================

export const customerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email invalido"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 digitos")
    .transform((val) => val.replace(/\D/g, "")),
  cpf: z
    .string()
    .refine((val) => isValidCpf(val), "CPF invalido"),
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP invalido")
    .transform((val) => val.replace(/-/g, "")),
  street: z.string().min(1, "Logradouro obrigatorio"),
  number: z.string().min(1, "Numero obrigatorio"),
  complement: z.string().max(100).optional().nullable(),
  neighborhood: z.string().min(1, "Bairro obrigatorio"),
  city: z.string().min(1, "Cidade obrigatoria"),
  state: z
    .string()
    .length(2, "Estado deve ter 2 caracteres")
    .transform((val) => val.toUpperCase()),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ===========================================
// Vehicle Schema
// ===========================================

export const vehicleSchema = z.object({
  placa: z
    .string()
    .refine((val) => isValidPlaca(val), "Placa invalida"),
  marca: z.string().min(1, "Marca obrigatoria"),
  modelo: z.string().min(1, "Modelo obrigatorio"),
  ano: z.string().min(1, "Ano obrigatorio"),
  valorFipe: z.number().positive("Valor FIPE deve ser positivo"),
  codigoFipe: z.string().min(1, "Codigo FIPE obrigatorio"),
  combustivel: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
  categoria: vehicleCategorySchema,
  tipoUso: usageTypeSchema,
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

// ===========================================
// Vehicle Lookup Request Schema
// ===========================================

export const vehicleLookupSchema = z.object({
  placa: z
    .string()
    .refine((val) => isValidPlaca(val), "Placa invalida"),
  categoria: clientCategorySchema,
  tipoUso: usageTypeSchema,
});

export type VehicleLookupInput = z.infer<typeof vehicleLookupSchema>;

// ===========================================
// Quotation Schema
// ===========================================

export const createQuotationSchema = z.object({
  vehicle: vehicleSchema,
  customer: customerSchema,
  isRejected: z.boolean().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export const updateQuotationStatusSchema = z.object({
  status: z.enum(["CONTACTED", "ACCEPTED", "CANCELLED"]),
  notes: z.string().max(1000).optional(),
});

export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;

// ===========================================
// Pricing Rule Schema
// ===========================================

export const createPricingRuleSchema = z.object({
  categoria: vehicleCategorySchema,
  faixaMin: z.number().min(0, "Faixa minima deve ser >= 0"),
  faixaMax: z.number().positive("Faixa maxima deve ser positiva"),
  mensalidade: z.number().positive("Mensalidade deve ser positiva"),
  cotaParticipacao: z.number().min(0).optional().nullable(),
});

export const updatePricingRuleSchema = z.object({
  faixaMin: z.number().min(0).optional(),
  faixaMax: z.number().positive().optional(),
  mensalidade: z.number().positive().optional(),
  cotaParticipacao: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;

// ===========================================
// Blacklist Schema
// ===========================================

export const createBlacklistSchema = z.object({
  marca: z.string().max(100, "Marca deve ter no maximo 100 caracteres"),
  modelo: z.string().max(100).optional().nullable(),
  motivo: z.string().max(255).optional(),
});

export type CreateBlacklistInput = z.infer<typeof createBlacklistSchema>;

// ===========================================
// Pagination Schema
// ===========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
