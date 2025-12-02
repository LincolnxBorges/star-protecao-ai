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
export type VehicleType = "AUTOMOVEL" | "MOTOCICLETA" | "CAMINHAO" | "INEXISTENTE";

interface PowerCrmResponse {
  mensagem: string;
  codFipe: string | null;
  vehicleType: VehicleType;
  brand: string;
  year: string;
  fuel: string;
  color: string;
  city?: string;
  uf?: string;
  chassi?: string;
  error?: string | null;
}

interface WdApi2FipeItem {
  codigo_fipe: string;
  texto_modelo: string;
  texto_valor: string;
  score: number;
}

interface WdApi2Response {
  MARCA: string;
  MODELO: string;
  ano: string;
  fipe?: {
    dados: WdApi2FipeItem[];
  };
  mensagemRetorno: string;
}

// Helper to extract brand from PowerCRM response (format: "VW SANTANA CG" -> "VW")
function extractBrandFromPowerCrm(brandString: string): string {
  // PowerCRM returns brand + model together, first word is usually the brand
  const parts = brandString.split(" ");
  return parts[0] || brandString;
}

// Helper to extract model from PowerCRM response (format: "VW SANTANA CG" -> "SANTANA CG")
function extractModelFromPowerCrm(brandString: string): string {
  const parts = brandString.split(" ");
  return parts.slice(1).join(" ") || brandString;
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

  // Default: private use light vehicle (includes AUTOMOVEL and INEXISTENTE)
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
    console.log(`Fetching: ${url}`);
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      const text = await response.text();
      console.error(`Response error: ${text}`);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    if (retries > 0) {
      console.log(`Retrying in ${delay}ms...`);
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
  codFipe: string | null,
  placa: string
): Promise<{ valorFipe: number; codigoFipe: string; modelo: string; marca: string }> {
  const token = process.env.WDAPI2_TOKEN;
  if (!token) {
    throw new Error("WDAPI2_TOKEN not configured");
  }

  const normalizedPlaca = normalizePlaca(placa);

  // Note: Using wdapi2.com.br (without api. prefix) due to SSL certificate mismatch
  const response = await fetchWithRetry<WdApi2Response>(
    `https://wdapi2.com.br/consulta/${normalizedPlaca}/${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // WDAPI2 returns fipe.dados, not fipeData
  const fipeData = response.fipe?.dados || [];

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
    modelo: response.MODELO || selectedFipe.texto_modelo,
    marca: response.MARCA,
  };
}

// ===========================================
// FIPE Selection Logic
// ===========================================

export function selectFipeValue(
  fipeData: WdApi2FipeItem[],
  codFipe: string | null
): WdApi2FipeItem {
  // 1. Try exact match by codigo_fipe (if provided)
  if (codFipe) {
    const exactMatch = fipeData.find((f) => f.codigo_fipe === codFipe);
    if (exactMatch) {
      return exactMatch;
    }
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
      console.log("PowerCRM response:", powerCrmData);
    } catch (error) {
      console.error("PowerCRM error:", error);
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Placa nao encontrada",
        },
      };
    }

    // 2. Get FIPE value first (this also gives us proper marca/modelo)
    let fipeResult;
    try {
      fipeResult = await getFipeValue(powerCrmData.codFipe, normalizedPlaca);
      console.log("FIPE result:", fipeResult);
    } catch (error) {
      console.error("FIPE lookup error:", error);
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao consultar veiculo. Tente novamente.",
        },
      };
    }

    // Use WDAPI2 data for marca/modelo (more reliable than PowerCRM)
    const marca = fipeResult.marca || extractBrandFromPowerCrm(powerCrmData.brand);
    const modelo = fipeResult.modelo || extractModelFromPowerCrm(powerCrmData.brand);

    // 3. Check blacklist
    const blacklistResult = await isBlacklisted(marca, modelo);

    if (blacklistResult.blacklisted) {
      return {
        success: false,
        error: {
          code: "BLACKLISTED",
          message: blacklistResult.motivo || "Nao trabalhamos com este veiculo",
          details: {
            marca,
            modelo,
            motivo: blacklistResult.motivo,
          },
        },
        saveAsLead: true,
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

    // Calculate quotation values using settings from database
    const pricing = await calculateQuotationValues(fipeResult.valorFipe, mensalidade, cotaParticipacao);

    // 7. Return success result
    return {
      success: true,
      data: {
        placa: normalizedPlaca,
        marca,
        modelo,
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
