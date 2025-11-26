/**
 * Vehicles Context
 * @module lib/vehicles
 */

import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { isBlacklisted } from "@/lib/blacklist";
import { findPricingRule, calculateQuotationValues } from "@/lib/pricing";
import { normalizePlaca } from "@/lib/validations/placa";

// ===========================================
// Types
// ===========================================

export type VehicleCategory = "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO";
export type UsageType = "PARTICULAR" | "COMERCIAL";
export type ClientCategory = "LEVE" | "UTILITARIO";
export type VehicleType = "AUTOMOVEL" | "MOTOCICLETA" | "CAMINHAO";

interface PowerCrmResponse {
  codFipe: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: string;
  fuel: string;
  color: string;
  error?: string;
}

interface WdApi2FipeData {
  codigo_fipe: string;
  texto_modelo: string;
  texto_valor: string;
  score: number;
}

export interface VehicleLookupResult {
  success: true;
  data: {
    placa: string;
    marca: string;
    modelo: string;
    ano: string;
    valorFipe: number;
    codigoFipe: string;
    combustivel: string | null;
    cor: string | null;
    categoria: VehicleCategory;
    tipoUso: UsageType;
    pricing: {
      mensalidade: number;
      adesao: number;
      adesaoDesconto: number;
      cotaParticipacao: number | null;
    };
  };
}

export interface VehicleLookupError {
  success: false;
  error: {
    code: "NOT_FOUND" | "BLACKLISTED" | "OVER_LIMIT" | "API_ERROR";
    message: string;
    details?: Record<string, unknown>;
  };
  saveAsLead?: boolean;
}

// ===========================================
// FIPE Limits by Category
// ===========================================

export const FIPE_LIMITS: Record<VehicleCategory, number> = {
  NORMAL: 180000,
  ESPECIAL: 190000,
  UTILITARIO: 450000,
  MOTO: 90000,
};

// ===========================================
// Category Determination
// ===========================================

export function determineCategory(
  vehicleType: VehicleType,
  clientCategory: ClientCategory,
  usageType: UsageType
): VehicleCategory {
  // Motorcycle always maps to MOTO
  if (vehicleType === "MOTOCICLETA") {
    return "MOTO";
  }

  // Truck always maps to UTILITARIO
  if (vehicleType === "CAMINHAO") {
    return "UTILITARIO";
  }

  // Client selected UTILITARIO
  if (clientCategory === "UTILITARIO") {
    return "UTILITARIO";
  }

  // Commercial use maps to ESPECIAL
  if (usageType === "COMERCIAL") {
    return "ESPECIAL";
  }

  // Default: private use light vehicle
  return "NORMAL";
}

// ===========================================
// FIPE Limit Check
// ===========================================

export function checkFipeLimit(
  categoria: VehicleCategory,
  valorFipe: number
): { allowed: boolean; limit: number } {
  const limit = FIPE_LIMITS[categoria];
  return {
    allowed: valorFipe <= limit,
    limit,
  };
}

// ===========================================
// API Integration Helpers
// ===========================================

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 1,
  delay = 2000
): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    throw error;
  }
}

// ===========================================
// PowerCRM API Integration
// ===========================================

export async function lookupPlateOnPowerCRM(
  placa: string
): Promise<PowerCrmResponse> {
  const apiKey = process.env.POWER_CRM_API_KEY;
  if (!apiKey) {
    throw new Error("POWER_CRM_API_KEY not configured");
  }

  const normalizedPlaca = normalizePlaca(placa);

  const response = await fetchWithRetry<PowerCrmResponse>(
    `https://api.powercrm.com.br/api/quotation/plates/${normalizedPlaca}`,
    {
      method: "GET",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response;
}

// ===========================================
// WDAPI2 API Integration
// ===========================================

export async function getFipeValue(
  codFipe: string,
  placa: string
): Promise<{ valorFipe: number; codigoFipe: string; modelo: string }> {
  const token = process.env.WDAPI2_TOKEN;
  if (!token) {
    throw new Error("WDAPI2_TOKEN not configured");
  }

  const normalizedPlaca = normalizePlaca(placa);

  const response = await fetchWithRetry<{ fipeData: WdApi2FipeData[] }>(
    `https://api.wdapi2.com.br/consulta/${normalizedPlaca}/${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const fipeData = response.fipeData || [];

  if (fipeData.length === 0) {
    throw new Error("No FIPE data available");
  }

  // Strategy: find exact match by codFipe or use highest score
  const selectedFipe = selectFipeValue(fipeData, codFipe);

  // Parse value from "R$ 42.540,00" format
  const valorFipe = parseMoneyValue(selectedFipe.texto_valor);

  return {
    valorFipe,
    codigoFipe: selectedFipe.codigo_fipe,
    modelo: selectedFipe.texto_modelo,
  };
}

// ===========================================
// FIPE Selection Logic
// ===========================================

export function selectFipeValue(
  fipeData: WdApi2FipeData[],
  codFipe: string
): WdApi2FipeData {
  // 1. Try exact match by codigo_fipe
  const exactMatch = fipeData.find((f) => f.codigo_fipe === codFipe);
  if (exactMatch) {
    return exactMatch;
  }

  // 2. Fallback: highest score
  return fipeData.reduce((best, current) =>
    current.score > best.score ? current : best
  );
}

function parseMoneyValue(value: string): number {
  // "R$ 42.540,00" -> 42540.00
  const cleaned = value
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned);
}

// ===========================================
// Main Vehicle Lookup Function
// ===========================================

export async function lookupVehicle(
  placa: string,
  clientCategory: ClientCategory,
  tipoUso: UsageType
): Promise<VehicleLookupResult | VehicleLookupError> {
  const normalizedPlaca = normalizePlaca(placa);

  try {
    // 1. Query PowerCRM for vehicle data
    let powerCrmData: PowerCrmResponse;
    try {
      powerCrmData = await lookupPlateOnPowerCRM(normalizedPlaca);
    } catch {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Placa nao encontrada",
        },
      };
    }

    // 2. Check blacklist
    const blacklistResult = await isBlacklisted(
      powerCrmData.brand,
      powerCrmData.model
    );

    if (blacklistResult.blacklisted) {
      return {
        success: false,
        error: {
          code: "BLACKLISTED",
          message: blacklistResult.motivo || "Nao trabalhamos com este veiculo",
          details: {
            marca: powerCrmData.brand,
            modelo: powerCrmData.model,
            motivo: blacklistResult.motivo,
          },
        },
        saveAsLead: true,
      };
    }

    // 3. Get FIPE value
    let fipeResult;
    try {
      fipeResult = await getFipeValue(powerCrmData.codFipe, normalizedPlaca);
    } catch {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao consultar veiculo. Tente novamente.",
        },
      };
    }

    // 4. Determine category
    const categoria = determineCategory(
      powerCrmData.vehicleType,
      clientCategory,
      tipoUso
    );

    // 5. Check FIPE limit
    const limitCheck = checkFipeLimit(categoria, fipeResult.valorFipe);

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: {
          code: "OVER_LIMIT",
          message: `Valor acima do limite para categoria ${categoria}`,
          details: {
            categoria,
            valorFipe: fipeResult.valorFipe,
            limite: limitCheck.limit,
          },
        },
        saveAsLead: true,
      };
    }

    // 6. Find pricing rule and calculate values
    const pricingRule = await findPricingRule(categoria, fipeResult.valorFipe);

    if (!pricingRule) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Nao foi possivel calcular o valor da cotacao",
        },
      };
    }

    const mensalidade = parseFloat(pricingRule.mensalidade);
    const cotaParticipacao = pricingRule.cotaParticipacao
      ? parseFloat(pricingRule.cotaParticipacao)
      : null;

    const pricing = calculateQuotationValues(mensalidade, cotaParticipacao);

    // 7. Return success result
    return {
      success: true,
      data: {
        placa: normalizedPlaca,
        marca: powerCrmData.brand,
        modelo: fipeResult.modelo || powerCrmData.model,
        ano: powerCrmData.year,
        valorFipe: fipeResult.valorFipe,
        codigoFipe: fipeResult.codigoFipe,
        combustivel: powerCrmData.fuel || null,
        cor: powerCrmData.color || null,
        categoria,
        tipoUso,
        pricing,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "API_ERROR",
        message: "Erro ao consultar veiculo. Tente novamente.",
      },
    };
  }
}

// ===========================================
// Vehicle CRUD
// ===========================================

export async function createVehicle(data: {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  valorFipe: number;
  codigoFipe: string;
  combustivel?: string | null;
  cor?: string | null;
  categoria: VehicleCategory;
  tipoUso: UsageType;
}) {
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      placa: normalizePlaca(data.placa),
      marca: data.marca,
      modelo: data.modelo,
      ano: data.ano,
      valorFipe: data.valorFipe.toFixed(2),
      codigoFipe: data.codigoFipe,
      combustivel: data.combustivel,
      cor: data.cor,
      categoria: data.categoria,
      tipoUso: data.tipoUso,
    })
    .returning();

  return vehicle;
}
