/**
 * License Plate Validation (Brazilian formats)
 * @module lib/validations/placa
 */

// Old format: ABC-1234 or ABC1234
const OLD_FORMAT_REGEX = /^[A-Z]{3}-?\d{4}$/i;

// Mercosul format: ABC1D23
const MERCOSUL_FORMAT_REGEX = /^[A-Z]{3}\d[A-Z]\d{2}$/i;

export function normalizePlaca(placa: string): string {
  return placa.replace(/-/g, "").toUpperCase();
}

export function isOldFormat(placa: string): boolean {
  return OLD_FORMAT_REGEX.test(placa);
}

export function isMercosulFormat(placa: string): boolean {
  return MERCOSUL_FORMAT_REGEX.test(placa);
}

export function isValidPlaca(placa: string): boolean {
  const normalized = normalizePlaca(placa);
  return isOldFormat(normalized) || isMercosulFormat(normalized);
}

export function formatPlaca(placa: string): string {
  const normalized = normalizePlaca(placa);

  // If it's old format, add hyphen
  if (/^[A-Z]{3}\d{4}$/.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }

  // Mercosul format stays as is
  return normalized;
}
