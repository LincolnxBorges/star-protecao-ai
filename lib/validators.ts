/**
 * Validators Module
 * Funcoes de validacao reutilizaveis para o sistema
 */

// ===========================================
// CNPJ Validation
// ===========================================

/**
 * Validates a CNPJ number including check digits
 * Uses the standard algorithm from Receita Federal
 * @param cnpj - The CNPJ to validate (with or without formatting)
 * @returns true if the CNPJ is valid
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-numeric characters
  const numbers = cnpj.replace(/\D/g, "");

  // Must have exactly 14 digits
  if (numbers.length !== 14) {
    return false;
  }

  // Reject known invalid CNPJs (all same digit)
  if (/^(\d)\1+$/.test(numbers)) {
    return false;
  }

  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum1 = numbers
    .slice(0, 12)
    .split("")
    .reduce((acc, digit, i) => acc + parseInt(digit) * weights1[i], 0);
  const remainder1 = sum1 % 11;
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;

  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum2 = (numbers.slice(0, 12) + digit1)
    .split("")
    .reduce((acc, digit, i) => acc + parseInt(digit) * weights2[i], 0);
  const remainder2 = sum2 % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;

  // Compare calculated digits with provided ones
  return numbers.slice(12) === `${digit1}${digit2}`;
}

/**
 * Formats a CNPJ number to XX.XXX.XXX/XXXX-XX format
 * @param cnpj - The CNPJ to format (14 digits)
 * @returns Formatted CNPJ string
 */
export function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/\D/g, "");
  if (numbers.length !== 14) {
    return cnpj;
  }
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Removes formatting from CNPJ
 * @param cnpj - The CNPJ to unformat
 * @returns CNPJ with only digits
 */
export function unformatCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

// ===========================================
// CPF Validation
// ===========================================

/**
 * Validates a CPF number including check digits
 * @param cpf - The CPF to validate (with or without formatting)
 * @returns true if the CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");

  if (numbers.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(numbers)) {
    return false;
  }

  // Calculate first check digit
  const sum1 = numbers
    .slice(0, 9)
    .split("")
    .reduce((acc, digit, i) => acc + parseInt(digit) * (10 - i), 0);
  const remainder1 = (sum1 * 10) % 11;
  const digit1 = remainder1 === 10 ? 0 : remainder1;

  // Calculate second check digit
  const sum2 = numbers
    .slice(0, 10)
    .split("")
    .reduce((acc, digit, i) => acc + parseInt(digit) * (11 - i), 0);
  const remainder2 = (sum2 * 10) % 11;
  const digit2 = remainder2 === 10 ? 0 : remainder2;

  return numbers.slice(9) === `${digit1}${digit2}`;
}

/**
 * Formats a CPF number to XXX.XXX.XXX-XX format
 * @param cpf - The CPF to format (11 digits)
 * @returns Formatted CPF string
 */
export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) {
    return cpf;
  }
  return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

// ===========================================
// Phone Validation
// ===========================================

/**
 * Validates a Brazilian phone number
 * @param phone - The phone to validate
 * @returns true if the phone is valid (10 or 11 digits)
 */
export function validatePhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "");
  return numbers.length >= 10 && numbers.length <= 11;
}

/**
 * Formats a phone number to (XX) XXXX-XXXX or (XX) XXXXX-XXXX format
 * @param phone - The phone to format
 * @returns Formatted phone string
 */
export function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, "");

  if (numbers.length === 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  if (numbers.length === 11) {
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  return phone;
}

/**
 * Removes formatting from phone
 * @param phone - The phone to unformat
 * @returns Phone with only digits
 */
export function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// ===========================================
// CEP Validation
// ===========================================

/**
 * Validates a Brazilian CEP
 * @param cep - The CEP to validate
 * @returns true if the CEP has 8 digits
 */
export function validateCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, "");
  return numbers.length === 8;
}

/**
 * Formats a CEP to XXXXX-XXX format
 * @param cep - The CEP to format (8 digits)
 * @returns Formatted CEP string
 */
export function formatCEP(cep: string): string {
  const numbers = cep.replace(/\D/g, "");
  if (numbers.length !== 8) {
    return cep;
  }
  return numbers.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/**
 * Removes formatting from CEP
 * @param cep - The CEP to unformat
 * @returns CEP with only digits
 */
export function unformatCEP(cep: string): string {
  return cep.replace(/\D/g, "");
}

// ===========================================
// Input Masks (for use with forms)
// ===========================================

/**
 * Applies CNPJ mask as user types
 * @param value - Current input value
 * @returns Masked value
 */
export function applyCNPJMask(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 14);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8)
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12)
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

/**
 * Applies CPF mask as user types
 * @param value - Current input value
 * @returns Masked value
 */
export function applyCPFMask(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

/**
 * Applies phone mask as user types
 * @param value - Current input value
 * @returns Masked value
 */
export function applyPhoneMask(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 2) return numbers ? `(${numbers}` : "";
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;

  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

/**
 * Applies CEP mask as user types
 * @param value - Current input value
 * @returns Masked value
 */
export function applyCEPMask(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 8);

  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}
