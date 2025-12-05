import { describe, it, expect } from "vitest";
import {
  determineCategory,
  checkFipeLimit,
  FIPE_LIMITS,
} from "@/lib/vehicles";

describe("Vehicle Category Determination", () => {
  describe("determineCategory", () => {
    it("should return MOTO for motorcycles regardless of client selection", () => {
      expect(determineCategory("MOTOCICLETA", "LEVE", "PARTICULAR")).toBe("MOTO");
      expect(determineCategory("MOTOCICLETA", "UTILITARIO", "COMERCIAL")).toBe("MOTO");
    });

    it("should return UTILITARIO for trucks regardless of client selection", () => {
      expect(determineCategory("CAMINHAO", "LEVE", "PARTICULAR")).toBe("UTILITARIO");
      expect(determineCategory("CAMINHAO", "UTILITARIO", "COMERCIAL")).toBe("UTILITARIO");
    });

    it("should return UTILITARIO when client selects UTILITARIO", () => {
      expect(determineCategory("AUTOMOVEL", "UTILITARIO", "PARTICULAR")).toBe("UTILITARIO");
      expect(determineCategory("AUTOMOVEL", "UTILITARIO", "COMERCIAL")).toBe("UTILITARIO");
    });

    it("should return ESPECIAL for commercial use light vehicles", () => {
      expect(determineCategory("AUTOMOVEL", "LEVE", "COMERCIAL")).toBe("ESPECIAL");
    });

    it("should return NORMAL for private use light vehicles", () => {
      expect(determineCategory("AUTOMOVEL", "LEVE", "PARTICULAR")).toBe("NORMAL");
    });
  });

  describe("checkFipeLimit", () => {
    it("should pass for values within NORMAL limit", () => {
      const result = checkFipeLimit("NORMAL", 150000);
      expect(result.allowed).toBe(true);
    });

    it("should fail for values above NORMAL limit", () => {
      const result = checkFipeLimit("NORMAL", 200000);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(FIPE_LIMITS.NORMAL);
    });

    it("should pass for ESPECIAL up to 190k", () => {
      const result = checkFipeLimit("ESPECIAL", 190000);
      expect(result.allowed).toBe(true);
    });

    it("should fail for ESPECIAL above 190k", () => {
      const result = checkFipeLimit("ESPECIAL", 200000);
      expect(result.allowed).toBe(false);
    });

    it("should pass for UTILITARIO up to 450k", () => {
      const result = checkFipeLimit("UTILITARIO", 450000);
      expect(result.allowed).toBe(true);
    });

    it("should fail for UTILITARIO above 450k", () => {
      const result = checkFipeLimit("UTILITARIO", 500000);
      expect(result.allowed).toBe(false);
    });

    it("should pass for MOTO up to 90k", () => {
      const result = checkFipeLimit("MOTO", 90000);
      expect(result.allowed).toBe(true);
    });

    it("should fail for MOTO above 90k", () => {
      const result = checkFipeLimit("MOTO", 100000);
      expect(result.allowed).toBe(false);
    });
  });

  describe("FIPE_LIMITS constants", () => {
    it("should have correct limits", () => {
      expect(FIPE_LIMITS.NORMAL).toBe(180000);
      expect(FIPE_LIMITS.ESPECIAL).toBe(190000);
      expect(FIPE_LIMITS.UTILITARIO).toBe(450000);
      expect(FIPE_LIMITS.MOTO).toBe(90000);
    });
  });
});
