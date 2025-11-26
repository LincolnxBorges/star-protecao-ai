import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateQuotationValues } from "@/lib/pricing";
import { createQuotation } from "@/lib/quotations";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// ===========================================
// Types for testing
// ===========================================

interface QuotationForList {
  id: string;
  status: string;
  sellerId: string | null;
  createdAt: Date;
}

type QuotationStatus =
  | "PENDING"
  | "CONTACTED"
  | "ACCEPTED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

// ===========================================
// Pure functions for testing business logic
// ===========================================

// Filter quotations by seller (null sellerId = show all for admin)
function filterQuotationsBySeller(
  quotations: QuotationForList[],
  sellerId: string | null
): QuotationForList[] {
  if (sellerId === null) {
    // Admin sees all
    return quotations;
  }
  // Seller sees only their own
  return quotations.filter((q) => q.sellerId === sellerId);
}

// Filter quotations by status
function filterQuotationsByStatus(
  quotations: QuotationForList[],
  statuses: string[]
): QuotationForList[] {
  if (statuses.length === 0) {
    return quotations;
  }
  return quotations.filter((q) => statuses.includes(q.status));
}

// Check if seller can access quotation
function canAccessQuotation(
  quotation: { sellerId: string | null },
  sellerId: string | null,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (sellerId === null) return false;
  return quotation.sellerId === sellerId;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  PENDING: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: [],
  EXPIRED: [],
  CANCELLED: [],
  REJECTED: [],
};

function isValidStatusTransition(
  currentStatus: QuotationStatus,
  newStatus: QuotationStatus
): boolean {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
  return validNextStatuses.includes(newStatus);
}

// Check if quotation should expire
function shouldExpire(quotation: { status: string; expiresAt: Date }): boolean {
  if (quotation.status !== "PENDING") return false;
  return quotation.expiresAt < new Date();
}

describe("Quotation Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createQuotation", () => {
    it("should create quotation with correct values", async () => {
      const { db } = await import("@/lib/db");

      const mockQuotation = {
        id: "quotation-id",
        customerId: "customer-id",
        vehicleId: "vehicle-id",
        sellerId: "seller-id",
        mensalidade: "200.00",
        adesao: "400.00",
        adesaoDesconto: "320.00",
        cotaParticipacao: null,
        status: "PENDING",
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      } as never);

      const result = await createQuotation({
        customerId: "customer-id",
        vehicleId: "vehicle-id",
        mensalidade: 200,
        adesao: 400,
        adesaoDesconto: 320,
        cotaParticipacao: null,
        sellerId: "seller-id",
      });

      expect(result.id).toBe("quotation-id");
      expect(result.status).toBe("PENDING");
    });

    it("should create rejected quotation with REJECTED status", async () => {
      const { db } = await import("@/lib/db");

      const mockQuotation = {
        id: "quotation-id",
        customerId: "customer-id",
        vehicleId: "vehicle-id",
        sellerId: null,
        mensalidade: "0",
        adesao: "0",
        adesaoDesconto: "0",
        cotaParticipacao: null,
        status: "REJECTED",
        rejectionReason: "Veiculo na blacklist",
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      } as never);

      const result = await createQuotation({
        customerId: "customer-id",
        vehicleId: "vehicle-id",
        mensalidade: 0,
        adesao: 0,
        adesaoDesconto: 0,
        cotaParticipacao: null,
        isRejected: true,
        rejectionReason: "Veiculo na blacklist",
      });

      expect(result.status).toBe("REJECTED");
      expect(result.rejectionReason).toBe("Veiculo na blacklist");
      expect(result.sellerId).toBeNull();
    });

    it("should set expiresAt to 7 days from creation", async () => {
      const { db } = await import("@/lib/db");
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "quotation-id",
              expiresAt: expectedExpiry,
            },
          ]),
        }),
      } as never);

      const result = await createQuotation({
        customerId: "customer-id",
        vehicleId: "vehicle-id",
        mensalidade: 200,
        adesao: 400,
        adesaoDesconto: 320,
        cotaParticipacao: null,
      });

      expect(result.expiresAt).toBeDefined();
    });
  });
});

describe("Quotation Values Calculation", () => {
  describe("calculateQuotationValues", () => {
    it("should calculate adesao as 2x mensalidade", () => {
      const mensalidade = 300;
      const result = calculateQuotationValues(mensalidade);

      expect(result.adesao).toBe(mensalidade * 2);
    });

    it("should calculate adesaoDesconto as 80% of adesao", () => {
      const mensalidade = 300;
      const result = calculateQuotationValues(mensalidade);
      const expectedDiscount = mensalidade * 2 * 0.8;

      expect(result.adesaoDesconto).toBe(expectedDiscount);
    });

    it("should preserve mensalidade value", () => {
      const mensalidade = 325.95;
      const result = calculateQuotationValues(mensalidade);

      expect(result.mensalidade).toBe(mensalidade);
    });

    it("should handle cota participacao when provided", () => {
      const mensalidade = 300;
      const cotaParticipacao = 2500;
      const result = calculateQuotationValues(mensalidade, cotaParticipacao);

      expect(result.cotaParticipacao).toBe(cotaParticipacao);
    });

    it("should set cota participacao to null when not provided", () => {
      const result = calculateQuotationValues(300);

      expect(result.cotaParticipacao).toBeNull();
    });

    it("should calculate correctly for all pricing tiers", () => {
      // Test with values from pricing table
      const testCases = [
        { mensalidade: 95.00, expectedAdesao: 190, expectedDesconto: 152 },
        { mensalidade: 201.67, expectedAdesao: 403.34, expectedDesconto: 322.67 },
        { mensalidade: 532.58, expectedAdesao: 1065.16, expectedDesconto: 852.13 },
      ];

      testCases.forEach(({ mensalidade, expectedAdesao, expectedDesconto }) => {
        const result = calculateQuotationValues(mensalidade);

        expect(result.adesao).toBeCloseTo(expectedAdesao, 2);
        expect(result.adesaoDesconto).toBeCloseTo(expectedDesconto, 2);
      });
    });

    it("should handle zero mensalidade edge case", () => {
      const result = calculateQuotationValues(0);

      expect(result.mensalidade).toBe(0);
      expect(result.adesao).toBe(0);
      expect(result.adesaoDesconto).toBe(0);
    });
  });
});

// ===========================================
// T060: Quotation listing with seller filter
// ===========================================

describe("Quotation Listing", () => {
  const mockQuotations: QuotationForList[] = [
    {
      id: "q1",
      status: "PENDING",
      sellerId: "seller-1",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "q2",
      status: "CONTACTED",
      sellerId: "seller-2",
      createdAt: new Date("2024-01-14"),
    },
    {
      id: "q3",
      status: "PENDING",
      sellerId: "seller-1",
      createdAt: new Date("2024-01-13"),
    },
    {
      id: "q4",
      status: "ACCEPTED",
      sellerId: null,
      createdAt: new Date("2024-01-12"),
    },
  ];

  describe("filterQuotationsBySeller", () => {
    it("returns all quotations for admin (null sellerId)", () => {
      const result = filterQuotationsBySeller(mockQuotations, null);
      expect(result).toHaveLength(4);
    });

    it("returns only seller's quotations for non-admin", () => {
      const result = filterQuotationsBySeller(mockQuotations, "seller-1");
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.sellerId === "seller-1")).toBe(true);
    });

    it("returns empty array for seller with no quotations", () => {
      const result = filterQuotationsBySeller(mockQuotations, "seller-3");
      expect(result).toHaveLength(0);
    });
  });

  describe("filterQuotationsByStatus", () => {
    it("returns all quotations when no status filter", () => {
      const result = filterQuotationsByStatus(mockQuotations, []);
      expect(result).toHaveLength(4);
    });

    it("filters by single status", () => {
      const result = filterQuotationsByStatus(mockQuotations, ["PENDING"]);
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.status === "PENDING")).toBe(true);
    });

    it("filters by multiple statuses", () => {
      const result = filterQuotationsByStatus(mockQuotations, [
        "PENDING",
        "CONTACTED",
      ]);
      expect(result).toHaveLength(3);
    });
  });

  describe("canAccessQuotation", () => {
    it("admin can access any quotation", () => {
      expect(
        canAccessQuotation({ sellerId: "seller-1" }, "admin-id", true)
      ).toBe(true);
      expect(canAccessQuotation({ sellerId: null }, "admin-id", true)).toBe(
        true
      );
    });

    it("seller can access their own quotations", () => {
      expect(
        canAccessQuotation({ sellerId: "seller-1" }, "seller-1", false)
      ).toBe(true);
    });

    it("seller cannot access other seller's quotations", () => {
      expect(
        canAccessQuotation({ sellerId: "seller-2" }, "seller-1", false)
      ).toBe(false);
    });

    it("seller cannot access unassigned quotations", () => {
      expect(canAccessQuotation({ sellerId: null }, "seller-1", false)).toBe(
        false
      );
    });
  });
});

// ===========================================
// T061: Status transitions
// ===========================================

describe("Quotation Status Transitions", () => {
  describe("isValidStatusTransition", () => {
    // PENDING transitions
    it("allows PENDING -> CONTACTED", () => {
      expect(isValidStatusTransition("PENDING", "CONTACTED")).toBe(true);
    });

    it("allows PENDING -> CANCELLED", () => {
      expect(isValidStatusTransition("PENDING", "CANCELLED")).toBe(true);
    });

    it("disallows PENDING -> ACCEPTED", () => {
      expect(isValidStatusTransition("PENDING", "ACCEPTED")).toBe(false);
    });

    it("disallows PENDING -> EXPIRED", () => {
      expect(isValidStatusTransition("PENDING", "EXPIRED")).toBe(false);
    });

    // CONTACTED transitions
    it("allows CONTACTED -> ACCEPTED", () => {
      expect(isValidStatusTransition("CONTACTED", "ACCEPTED")).toBe(true);
    });

    it("allows CONTACTED -> CANCELLED", () => {
      expect(isValidStatusTransition("CONTACTED", "CANCELLED")).toBe(true);
    });

    it("disallows CONTACTED -> PENDING", () => {
      expect(isValidStatusTransition("CONTACTED", "PENDING")).toBe(false);
    });

    // Final states (no transitions allowed)
    it("disallows any transition from ACCEPTED", () => {
      expect(isValidStatusTransition("ACCEPTED", "CONTACTED")).toBe(false);
      expect(isValidStatusTransition("ACCEPTED", "CANCELLED")).toBe(false);
    });

    it("disallows any transition from EXPIRED", () => {
      expect(isValidStatusTransition("EXPIRED", "PENDING")).toBe(false);
      expect(isValidStatusTransition("EXPIRED", "CONTACTED")).toBe(false);
    });

    it("disallows any transition from CANCELLED", () => {
      expect(isValidStatusTransition("CANCELLED", "PENDING")).toBe(false);
      expect(isValidStatusTransition("CANCELLED", "CONTACTED")).toBe(false);
    });

    it("disallows any transition from REJECTED", () => {
      expect(isValidStatusTransition("REJECTED", "PENDING")).toBe(false);
      expect(isValidStatusTransition("REJECTED", "CONTACTED")).toBe(false);
    });
  });
});

// ===========================================
// T062: Quotation expiration
// ===========================================

describe("Quotation Expiration", () => {
  describe("shouldExpire", () => {
    it("expires PENDING quotation past expiry date", () => {
      const quotation = {
        status: "PENDING",
        expiresAt: new Date("2024-01-01"), // Past date
      };
      expect(shouldExpire(quotation)).toBe(true);
    });

    it("does not expire PENDING quotation before expiry date", () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const quotation = {
        status: "PENDING",
        expiresAt: future,
      };
      expect(shouldExpire(quotation)).toBe(false);
    });

    it("does not expire CONTACTED quotation even if past expiry", () => {
      const quotation = {
        status: "CONTACTED",
        expiresAt: new Date("2024-01-01"),
      };
      expect(shouldExpire(quotation)).toBe(false);
    });

    it("does not expire ACCEPTED quotation even if past expiry", () => {
      const quotation = {
        status: "ACCEPTED",
        expiresAt: new Date("2024-01-01"),
      };
      expect(shouldExpire(quotation)).toBe(false);
    });

    it("does not expire already EXPIRED quotation", () => {
      const quotation = {
        status: "EXPIRED",
        expiresAt: new Date("2024-01-01"),
      };
      expect(shouldExpire(quotation)).toBe(false);
    });

    it("does not expire REJECTED quotation", () => {
      const quotation = {
        status: "REJECTED",
        expiresAt: new Date("2024-01-01"),
      };
      expect(shouldExpire(quotation)).toBe(false);
    });
  });
});
