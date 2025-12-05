import { describe, it, expect } from "vitest";
import {
  isValidPlaca,
  normalizePlaca,
  isOldFormat,
  isMercosulFormat,
  formatPlaca,
} from "@/lib/validations/placa";

describe("Placa Validation", () => {
  describe("normalizePlaca", () => {
    it("should remove hyphens and uppercase", () => {
      expect(normalizePlaca("abc-1234")).toBe("ABC1234");
      expect(normalizePlaca("ABC1234")).toBe("ABC1234");
      expect(normalizePlaca("abc1d23")).toBe("ABC1D23");
    });
  });

  describe("isOldFormat", () => {
    it("should validate old format with hyphen", () => {
      expect(isOldFormat("ABC-1234")).toBe(true);
      expect(isOldFormat("abc-1234")).toBe(true);
    });

    it("should validate old format without hyphen", () => {
      expect(isOldFormat("ABC1234")).toBe(true);
      expect(isOldFormat("abc1234")).toBe(true);
    });

    it("should reject invalid old formats", () => {
      expect(isOldFormat("ABC123")).toBe(false);
      expect(isOldFormat("ABCD1234")).toBe(false);
      expect(isOldFormat("AB12345")).toBe(false);
      expect(isOldFormat("ABC1D23")).toBe(false);
    });
  });

  describe("isMercosulFormat", () => {
    it("should validate Mercosul format", () => {
      expect(isMercosulFormat("ABC1D23")).toBe(true);
      expect(isMercosulFormat("abc1d23")).toBe(true);
      expect(isMercosulFormat("XYZ9A99")).toBe(true);
    });

    it("should reject invalid Mercosul formats", () => {
      expect(isMercosulFormat("ABC1234")).toBe(false);
      expect(isMercosulFormat("ABC-1234")).toBe(false);
      expect(isMercosulFormat("ABCDE23")).toBe(false);
      expect(isMercosulFormat("ABC1DD3")).toBe(false);
    });
  });

  describe("isValidPlaca", () => {
    it("should accept valid old format plates", () => {
      expect(isValidPlaca("ABC-1234")).toBe(true);
      expect(isValidPlaca("ABC1234")).toBe(true);
      expect(isValidPlaca("xyz-9999")).toBe(true);
    });

    it("should accept valid Mercosul format plates", () => {
      expect(isValidPlaca("ABC1D23")).toBe(true);
      expect(isValidPlaca("XYZ9A99")).toBe(true);
      expect(isValidPlaca("abc1d23")).toBe(true);
    });

    it("should reject invalid plates", () => {
      expect(isValidPlaca("")).toBe(false);
      expect(isValidPlaca("ABC")).toBe(false);
      expect(isValidPlaca("1234567")).toBe(false);
      expect(isValidPlaca("ABC12345")).toBe(false);
      expect(isValidPlaca("AB-12345")).toBe(false);
    });
  });

  describe("formatPlaca", () => {
    it("should format old plates with hyphen", () => {
      expect(formatPlaca("ABC1234")).toBe("ABC-1234");
      expect(formatPlaca("abc1234")).toBe("ABC-1234");
    });

    it("should keep Mercosul format as is", () => {
      expect(formatPlaca("ABC1D23")).toBe("ABC1D23");
      expect(formatPlaca("abc1d23")).toBe("ABC1D23");
    });
  });
});
