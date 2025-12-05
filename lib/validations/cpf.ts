/**
 * CPF Validation with check digits verification
 * @module lib/validations/cpf
 */

export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function calculateCheckDigit(digits: string, factor: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i], 10) * (factor - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);

  if (digits.length !== 11) {
    return false;
  }

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  // Calculate first check digit
  const firstCheckDigit = calculateCheckDigit(digits.slice(0, 9), 10);
  if (firstCheckDigit !== parseInt(digits[9], 10)) {
    return false;
  }

  // Calculate second check digit
  const secondCheckDigit = calculateCheckDigit(digits.slice(0, 10), 11);
  if (secondCheckDigit !== parseInt(digits[10], 10)) {
    return false;
  }

  return true;
}
