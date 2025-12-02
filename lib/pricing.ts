/**
 * Pricing Context
 * @module lib/pricing
 */

import { db } from "@/lib/db";
import { pricingRules, settings } from "@/lib/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import type { VehicleCategory } from "@/lib/vehicles";
import type { QuotationSettings } from "@/lib/settings-schemas";

// ===========================================
// Types
// ===========================================

export interface PricingRule {
  id: string;
  categoria: string;
  faixaMin: string;
  faixaMax: string;
  mensalidade: string;
  cotaParticipacao: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

export interface QuotationValues {
  mensalidade: number;
  adesao: number;
  adesaoDesconto: number;
  cotaParticipacao: number | null;
}

// ===========================================
// Find Pricing Rule
// ===========================================

export async function findPricingRule(
  categoria: VehicleCategory | string,
  valorFipe: number
): Promise<PricingRule | null> {
  const valorFipeStr = valorFipe.toFixed(2);

  const results = await db
    .select()
    .from(pricingRules)
    .where(
      and(
        eq(pricingRules.isActive, true),
        eq(pricingRules.categoria, categoria as "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO"),
        lte(pricingRules.faixaMin, valorFipeStr),
        gte(pricingRules.faixaMax, valorFipeStr)
      )
    );

  return results[0] || null;
}

// ===========================================
// Get Quotation Settings from Database
// ===========================================

// Default values if settings not found in database
const DEFAULT_QUOTATION_SETTINGS = {
  taxaAdesao: 2, // 2% do valor FIPE
  desconto: 20, // 20% de desconto sobre a adesao
};

async function getQuotationSettings(): Promise<{ taxaAdesao: number; desconto: number }> {
  try {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.category, "quotation"))
      .limit(1);

    if (result.length > 0) {
      const data = result[0].data as QuotationSettings;
      return {
        taxaAdesao: data.taxaAdesao ?? DEFAULT_QUOTATION_SETTINGS.taxaAdesao,
        desconto: data.desconto ?? DEFAULT_QUOTATION_SETTINGS.desconto,
      };
    }
  } catch (error) {
    console.error("Error fetching quotation settings:", error);
  }

  return DEFAULT_QUOTATION_SETTINGS;
}

// ===========================================
// Calculate Quotation Values
// ===========================================

/**
 * Calculate quotation values using settings from database
 * @param valorFipe - Vehicle FIPE value
 * @param mensalidade - Monthly fee from pricing rules
 * @param cotaParticipacao - Participation fee (optional)
 */
export async function calculateQuotationValues(
  valorFipe: number,
  mensalidade: number,
  cotaParticipacao?: number | null
): Promise<QuotationValues> {
  // Get settings from database
  const quotationSettings = await getQuotationSettings();

  // Calculate adesao based on FIPE value and configured rate
  const adesao = valorFipe * (quotationSettings.taxaAdesao / 100);

  // Apply configured discount
  const descontoMultiplier = 1 - (quotationSettings.desconto / 100);
  const adesaoDesconto = adesao * descontoMultiplier;

  return {
    mensalidade,
    adesao,
    adesaoDesconto,
    cotaParticipacao: cotaParticipacao ?? null,
  };
}

/**
 * Calculate quotation values synchronously with provided settings
 * Use this when you already have the settings loaded
 */
export function calculateQuotationValuesSync(
  valorFipe: number,
  mensalidade: number,
  taxaAdesao: number,
  desconto: number,
  cotaParticipacao?: number | null
): QuotationValues {
  const adesao = valorFipe * (taxaAdesao / 100);
  const descontoMultiplier = 1 - (desconto / 100);
  const adesaoDesconto = adesao * descontoMultiplier;

  return {
    mensalidade,
    adesao,
    adesaoDesconto,
    cotaParticipacao: cotaParticipacao ?? null,
  };
}

// ===========================================
// Pricing CRUD
// ===========================================

export async function listPricingRules(
  categoria?: VehicleCategory | string,
  activeOnly = true
): Promise<PricingRule[]> {
  if (categoria && activeOnly) {
    return db
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.isActive, true),
          eq(pricingRules.categoria, categoria as "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO")
        )
      );
  }

  if (activeOnly) {
    return db
      .select()
      .from(pricingRules)
      .where(eq(pricingRules.isActive, true));
  }

  if (categoria) {
    return db
      .select()
      .from(pricingRules)
      .where(eq(pricingRules.categoria, categoria as "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO"));
  }

  return db.select().from(pricingRules);
}

export async function createPricingRule(data: {
  categoria: VehicleCategory;
  faixaMin: number;
  faixaMax: number;
  mensalidade: number;
  cotaParticipacao?: number | null;
}): Promise<PricingRule> {
  const [rule] = await db
    .insert(pricingRules)
    .values({
      categoria: data.categoria,
      faixaMin: data.faixaMin.toFixed(2),
      faixaMax: data.faixaMax.toFixed(2),
      mensalidade: data.mensalidade.toFixed(2),
      cotaParticipacao: data.cotaParticipacao?.toFixed(2) || null,
    })
    .returning();

  return rule;
}

export async function updatePricingRule(
  id: string,
  data: {
    faixaMin?: number;
    faixaMax?: number;
    mensalidade?: number;
    cotaParticipacao?: number | null;
    isActive?: boolean;
  }
): Promise<PricingRule> {
  const updateData: Record<string, unknown> = {};

  if (data.faixaMin !== undefined) {
    updateData.faixaMin = data.faixaMin.toFixed(2);
  }
  if (data.faixaMax !== undefined) {
    updateData.faixaMax = data.faixaMax.toFixed(2);
  }
  if (data.mensalidade !== undefined) {
    updateData.mensalidade = data.mensalidade.toFixed(2);
  }
  if (data.cotaParticipacao !== undefined) {
    updateData.cotaParticipacao = data.cotaParticipacao?.toFixed(2) || null;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  const [rule] = await db
    .update(pricingRules)
    .set(updateData)
    .where(eq(pricingRules.id, id))
    .returning();

  return rule;
}

export async function deletePricingRule(id: string): Promise<PricingRule> {
  const [rule] = await db
    .update(pricingRules)
    .set({ isActive: false })
    .where(eq(pricingRules.id, id))
    .returning();

  return rule;
}
