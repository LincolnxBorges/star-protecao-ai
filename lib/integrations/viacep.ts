/**
 * ViaCEP Integration
 * Busca de endereço por CEP usando API pública ViaCEP
 */

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const VIACEP_BASE_URL = "https://viacep.com.br/ws";
const DEFAULT_TIMEOUT_MS = 2000;

/**
 * Fetches address data from ViaCEP API by CEP
 * @param cep - The CEP to search (8 digits, with or without formatting)
 * @param timeoutMs - Timeout in milliseconds (default: 2000ms)
 * @returns Address data or null if not found/error
 */
export async function fetchAddressByCEP(
  cep: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AddressData | null> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${VIACEP_BASE_URL}/${cleanCep}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`ViaCEP request failed with status: ${response.status}`);
      return null;
    }

    const data: ViaCEPResponse = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      cep: formatCEP(data.cep),
      logradouro: data.logradouro || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      estado: data.uf || "",
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("ViaCEP request timed out");
    } else {
      console.error("ViaCEP request failed:", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Formats a CEP string to XXXXX-XXX format
 * @param cep - The CEP to format (8 digits)
 * @returns Formatted CEP string
 */
export function formatCEP(cep: string): string {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) {
    return cep;
  }
  return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
}

/**
 * Validates if a CEP has valid format (8 digits)
 * @param cep - The CEP to validate
 * @returns true if valid format
 */
export function isValidCEPFormat(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, "");
  return cleanCep.length === 8;
}
