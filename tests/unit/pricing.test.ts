import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findPricingRule,
  calculateQuotationValues,
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "@/lib/pricing";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe("Pricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findPricingRule", () => {
    it("should find pricing rule for NORMAL category within range", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "1",
              categoria: "NORMAL",
              faixaMin: "40000.01",
              faixaMax: "50000.00",
              mensalidade: "201.67",
              cotaParticipacao: null,
              isActive: true,
            },
          ]),
        }),
      } as never);

      const result = await findPricingRule("NORMAL", 45000);

      expect(result).not.toBeNull();
      expect(result?.mensalidade).toBe("201.67");
    });

    it("should return null for value outside all ranges", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const result = await findPricingRule("NORMAL", 999999999);

      expect(result).toBeNull();
    });

    it("should find pricing rule for MOTO category", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "2",
              categoria: "MOTO",
              faixaMin: "20000.01",
              faixaMax: "26000.00",
              mensalidade: "189.00",
              cotaParticipacao: null,
              isActive: true,
            },
          ]),
        }),
      } as never);

      const result = await findPricingRule("MOTO", 25000);

      expect(result).not.toBeNull();
      expect(result?.mensalidade).toBe("189.00");
    });
  });

  describe("calculateQuotationValues", () => {
    it("should calculate correct values from mensalidade", () => {
      const result = calculateQuotationValues(200);

      expect(result.mensalidade).toBe(200);
      expect(result.adesao).toBe(400); // 2x mensalidade
      expect(result.adesaoDesconto).toBe(320); // 80% of adesao (20% discount)
    });

    it("should handle decimal mensalidade", () => {
      const result = calculateQuotationValues(201.67);

      expect(result.mensalidade).toBe(201.67);
      expect(result.adesao).toBeCloseTo(403.34, 2);
      expect(result.adesaoDesconto).toBeCloseTo(322.67, 2);
    });

    it("should include cota participacao if provided", () => {
      const result = calculateQuotationValues(200, 1500);

      expect(result.cotaParticipacao).toBe(1500);
    });

    it("should have null cota participacao if not provided", () => {
      const result = calculateQuotationValues(200);

      expect(result.cotaParticipacao).toBeNull();
    });
  });

  // ===========================================
  // Phase 7: CRUD Tests (T075)
  // ===========================================

  describe("listPricingRules", () => {
    it("should list all active pricing rules by default", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "1",
              categoria: "NORMAL",
              faixaMin: "0.00",
              faixaMax: "10000.00",
              mensalidade: "95.00",
              cotaParticipacao: null,
              isActive: true,
            },
            {
              id: "2",
              categoria: "NORMAL",
              faixaMin: "10000.01",
              faixaMax: "20000.00",
              mensalidade: "117.27",
              cotaParticipacao: null,
              isActive: true,
            },
          ]),
        }),
      } as never);

      const result = await listPricingRules();

      expect(result).toHaveLength(2);
      expect(result[0].categoria).toBe("NORMAL");
    });

    it("should filter by categoria when provided", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "3",
              categoria: "MOTO",
              faixaMin: "0.00",
              faixaMax: "6000.00",
              mensalidade: "79.35",
              cotaParticipacao: null,
              isActive: true,
            },
          ]),
        }),
      } as never);

      const result = await listPricingRules("MOTO");

      expect(result).toHaveLength(1);
      expect(result[0].categoria).toBe("MOTO");
    });

    it("should include inactive rules when activeOnly is false", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockResolvedValue([
          {
            id: "1",
            categoria: "NORMAL",
            faixaMin: "0.00",
            faixaMax: "10000.00",
            mensalidade: "95.00",
            isActive: true,
          },
          {
            id: "2",
            categoria: "NORMAL",
            faixaMin: "10000.01",
            faixaMax: "20000.00",
            mensalidade: "117.27",
            isActive: false,
          },
        ]),
      } as never);

      const result = await listPricingRules(undefined, false);

      expect(result).toHaveLength(2);
    });
  });

  describe("createPricingRule", () => {
    it("should create a new pricing rule", async () => {
      const { db } = await import("@/lib/db");

      const newRule = {
        id: "new-id",
        categoria: "NORMAL" as const,
        faixaMin: "200000.01",
        faixaMax: "250000.00",
        mensalidade: "600.00",
        cotaParticipacao: null,
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newRule]),
        }),
      } as never);

      const result = await createPricingRule({
        categoria: "NORMAL",
        faixaMin: 200000.01,
        faixaMax: 250000,
        mensalidade: 600,
      });

      expect(result.categoria).toBe("NORMAL");
      expect(result.mensalidade).toBe("600.00");
    });

    it("should create rule with cota participacao", async () => {
      const { db } = await import("@/lib/db");

      const newRule = {
        id: "new-id",
        categoria: "UTILITARIO" as const,
        faixaMin: "500000.01",
        faixaMax: "600000.00",
        mensalidade: "1500.00",
        cotaParticipacao: "5000.00",
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newRule]),
        }),
      } as never);

      const result = await createPricingRule({
        categoria: "UTILITARIO",
        faixaMin: 500000.01,
        faixaMax: 600000,
        mensalidade: 1500,
        cotaParticipacao: 5000,
      });

      expect(result.cotaParticipacao).toBe("5000.00");
    });
  });

  describe("updatePricingRule", () => {
    it("should update mensalidade of existing rule", async () => {
      const { db } = await import("@/lib/db");

      const updatedRule = {
        id: "existing-id",
        categoria: "NORMAL",
        faixaMin: "0.00",
        faixaMax: "10000.00",
        mensalidade: "100.00",
        cotaParticipacao: null,
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRule]),
          }),
        }),
      } as never);

      const result = await updatePricingRule("existing-id", {
        mensalidade: 100,
      });

      expect(result.mensalidade).toBe("100.00");
    });

    it("should update multiple fields at once", async () => {
      const { db } = await import("@/lib/db");

      const updatedRule = {
        id: "existing-id",
        categoria: "NORMAL",
        faixaMin: "0.00",
        faixaMax: "15000.00",
        mensalidade: "110.00",
        cotaParticipacao: "1000.00",
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRule]),
          }),
        }),
      } as never);

      const result = await updatePricingRule("existing-id", {
        faixaMax: 15000,
        mensalidade: 110,
        cotaParticipacao: 1000,
      });

      expect(result.faixaMax).toBe("15000.00");
      expect(result.mensalidade).toBe("110.00");
      expect(result.cotaParticipacao).toBe("1000.00");
    });

    it("should deactivate a rule", async () => {
      const { db } = await import("@/lib/db");

      const updatedRule = {
        id: "existing-id",
        categoria: "NORMAL",
        faixaMin: "0.00",
        faixaMax: "10000.00",
        mensalidade: "95.00",
        cotaParticipacao: null,
        isActive: false,
        createdAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRule]),
          }),
        }),
      } as never);

      const result = await updatePricingRule("existing-id", {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });
  });

  describe("deletePricingRule", () => {
    it("should soft delete (deactivate) a pricing rule", async () => {
      const { db } = await import("@/lib/db");

      const deletedRule = {
        id: "to-delete-id",
        categoria: "NORMAL",
        faixaMin: "0.00",
        faixaMax: "10000.00",
        mensalidade: "95.00",
        cotaParticipacao: null,
        isActive: false,
        createdAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deletedRule]),
          }),
        }),
      } as never);

      const result = await deletePricingRule("to-delete-id");

      expect(result.isActive).toBe(false);
    });
  });
});
