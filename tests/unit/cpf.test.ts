import { describe, it, expect } from "vitest";
import {
  isValidCpf,
  normalizeCpf,
  formatCpf,
} from "@/lib/validations/cpf";

describe("CPF Validation", () => {
  describe("normalizeCpf", () => {
    it("should remove non-numeric characters", () => {
      expect(normalizeCpf("123.456.789-09")).toBe("12345678909");
      expect(normalizeCpf("123456789-09")).toBe("12345678909");
      expect(normalizeCpf("12345678909")).toBe("12345678909");
    });
  });

  describe("formatCpf", () => {
    it("should format CPF with dots and hyphen", () => {
      expect(formatCpf("12345678909")).toBe("123.456.789-09");
    });

    it("should return original if not 11 digits", () => {
      expect(formatCpf("123")).toBe("123");
      expect(formatCpf("123456789012")).toBe("123456789012");
    });

    it("should handle already formatted CPF", () => {
      expect(formatCpf("123.456.789-09")).toBe("123.456.789-09");
    });
  });

  describe("isValidCpf", () => {
    it("should validate correct CPFs", () => {
      // Valid CPFs for testing
      expect(isValidCpf("529.982.247-25")).toBe(true);
      expect(isValidCpf("52998224725")).toBe(true);
      expect(isValidCpf("111.444.777-35")).toBe(true);
      expect(isValidCpf("11144477735")).toBe(true);
    });

    it("should reject CPFs with invalid check digits", () => {
      expect(isValidCpf("529.982.247-26")).toBe(false); // wrong first digit
      expect(isValidCpf("529.982.247-24")).toBe(false); // wrong second digit
      expect(isValidCpf("123.456.789-00")).toBe(false);
    });

    it("should reject CPFs with all same digits", () => {
      expect(isValidCpf("111.111.111-11")).toBe(false);
      expect(isValidCpf("000.000.000-00")).toBe(false);
      expect(isValidCpf("222.222.222-22")).toBe(false);
      expect(isValidCpf("333.333.333-33")).toBe(false);
      expect(isValidCpf("444.444.444-44")).toBe(false);
      expect(isValidCpf("555.555.555-55")).toBe(false);
      expect(isValidCpf("666.666.666-66")).toBe(false);
      expect(isValidCpf("777.777.777-77")).toBe(false);
      expect(isValidCpf("888.888.888-88")).toBe(false);
      expect(isValidCpf("999.999.999-99")).toBe(false);
    });

    it("should reject CPFs with wrong length", () => {
      expect(isValidCpf("123")).toBe(false);
      expect(isValidCpf("12345678901234")).toBe(false);
      expect(isValidCpf("")).toBe(false);
    });

    it("should handle formatted and unformatted CPFs", () => {
      expect(isValidCpf("529.982.247-25")).toBe(true);
      expect(isValidCpf("52998224725")).toBe(true);
    });
  });
});
