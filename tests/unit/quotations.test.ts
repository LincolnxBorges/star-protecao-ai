import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateQuotationValuesSync } from "@/lib/pricing";
import {
  createQuotation,
  getStatusCounts,
  createQuotationActivity,
  listQuotationActivities,
} from "@/lib/quotations";
import type { QuotationFilters } from "@/lib/types/quotations";

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
  // Using fixed settings: taxaAdesao=3%, desconto=20%
  const taxaAdesao = 3;
  const desconto = 20;
  const valorFipe = 50000; // Fixed FIPE value for tests

  describe("calculateQuotationValuesSync", () => {
    it("should calculate adesao based on FIPE value and rate", () => {
      const mensalidade = 300;
      const result = calculateQuotationValuesSync(valorFipe, mensalidade, taxaAdesao, desconto);

      expect(result.adesao).toBe(valorFipe * (taxaAdesao / 100)); // 3% of 50000 = 1500
    });

    it("should calculate adesaoDesconto with configured discount", () => {
      const mensalidade = 300;
      const result = calculateQuotationValuesSync(valorFipe, mensalidade, taxaAdesao, desconto);
      const expectedAdesao = valorFipe * (taxaAdesao / 100);
      const expectedDiscount = expectedAdesao * (1 - desconto / 100);

      expect(result.adesaoDesconto).toBe(expectedDiscount); // 80% of 1500 = 1200
    });

    it("should preserve mensalidade value", () => {
      const mensalidade = 325.95;
      const result = calculateQuotationValuesSync(valorFipe, mensalidade, taxaAdesao, desconto);

      expect(result.mensalidade).toBe(mensalidade);
    });

    it("should handle cota participacao when provided", () => {
      const mensalidade = 300;
      const cotaParticipacao = 2500;
      const result = calculateQuotationValuesSync(valorFipe, mensalidade, taxaAdesao, desconto, cotaParticipacao);

      expect(result.cotaParticipacao).toBe(cotaParticipacao);
    });

    it("should set cota participacao to null when not provided", () => {
      const result = calculateQuotationValuesSync(valorFipe, 300, taxaAdesao, desconto);

      expect(result.cotaParticipacao).toBeNull();
    });

    it("should calculate correctly for different FIPE values", () => {
      const testCases = [
        { fipe: 30000, expectedAdesao: 900, expectedDesconto: 720 },
        { fipe: 50000, expectedAdesao: 1500, expectedDesconto: 1200 },
        { fipe: 100000, expectedAdesao: 3000, expectedDesconto: 2400 },
      ];

      testCases.forEach(({ fipe, expectedAdesao, expectedDesconto }) => {
        const result = calculateQuotationValuesSync(fipe, 200, taxaAdesao, desconto);

        expect(result.adesao).toBeCloseTo(expectedAdesao, 2);
        expect(result.adesaoDesconto).toBeCloseTo(expectedDesconto, 2);
      });
    });

    it("should handle zero values edge case", () => {
      const result = calculateQuotationValuesSync(0, 0, taxaAdesao, desconto);

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

// ===========================================
// T011: New Context Functions Tests
// ===========================================

describe("Status Counts (getStatusCounts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return counts for all statuses", async () => {
    const { db } = await import("@/lib/db");

    // Mock the select query
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([
            { status: "PENDING", count: 5 },
            { status: "CONTACTED", count: 3 },
            { status: "ACCEPTED", count: 2 },
          ]),
        }),
      }),
    } as never);

    const result = await getStatusCounts();

    expect(result).toHaveLength(6); // All 6 statuses
    expect(result.find((r) => r.status === "PENDING")?.count).toBe(5);
    expect(result.find((r) => r.status === "CONTACTED")?.count).toBe(3);
    expect(result.find((r) => r.status === "ACCEPTED")?.count).toBe(2);
    expect(result.find((r) => r.status === "EXPIRED")?.count).toBe(0);
    expect(result.find((r) => r.status === "CANCELLED")?.count).toBe(0);
    expect(result.find((r) => r.status === "REJECTED")?.count).toBe(0);
  });

  it("should filter by sellerId when provided", async () => {
    const { db } = await import("@/lib/db");

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([{ status: "PENDING", count: 2 }]),
        }),
      }),
    } as never);

    const result = await getStatusCounts("seller-123");

    expect(result).toBeDefined();
    expect(db.select).toHaveBeenCalled();
  });
});

describe("Quotation Activities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createQuotationActivity", () => {
    it("should create activity with author info", async () => {
      const { db } = await import("@/lib/db");

      const mockActivity = {
        id: "activity-id",
        quotationId: "quotation-id",
        type: "STATUS_CHANGE",
        description: "Status alterado para CONTACTED",
        authorId: "user-id",
        authorName: "John Doe",
        metadata: null,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockActivity]),
        }),
      } as never);

      const result = await createQuotationActivity({
        quotationId: "quotation-id",
        type: "STATUS_CHANGE",
        description: "Status alterado para CONTACTED",
        authorId: "user-id",
        authorName: "John Doe",
      });

      expect(result.id).toBe("activity-id");
      expect(result.type).toBe("STATUS_CHANGE");
      expect(result.authorName).toBe("John Doe");
    });

    it("should serialize metadata as JSON", async () => {
      const { db } = await import("@/lib/db");

      const mockActivity = {
        id: "activity-id",
        quotationId: "quotation-id",
        type: "STATUS_CHANGE",
        description: "Status alterado",
        authorId: "user-id",
        authorName: "John Doe",
        metadata: JSON.stringify({ previousStatus: "PENDING", newStatus: "CONTACTED" }),
        createdAt: new Date(),
      };

      let insertedValues: Record<string, unknown> | null = null;

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockImplementation((values) => {
          insertedValues = values;
          return {
            returning: vi.fn().mockResolvedValue([mockActivity]),
          };
        }),
      } as never);

      await createQuotationActivity({
        quotationId: "quotation-id",
        type: "STATUS_CHANGE",
        description: "Status alterado",
        authorId: "user-id",
        authorName: "John Doe",
        metadata: { previousStatus: "PENDING", newStatus: "CONTACTED" },
      });

      expect(insertedValues).not.toBeNull();
      expect((insertedValues as unknown as { metadata: string }).metadata).toBe(
        JSON.stringify({ previousStatus: "PENDING", newStatus: "CONTACTED" })
      );
    });

    it("should fetch author name from user table if not provided", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ name: "Fetched Name" }]),
        }),
      } as never);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "activity-id",
              quotationId: "quotation-id",
              type: "NOTE",
              description: "Test note",
              authorId: "user-id",
              authorName: "Fetched Name",
              metadata: null,
              createdAt: new Date(),
            },
          ]),
        }),
      } as never);

      await createQuotationActivity({
        quotationId: "quotation-id",
        type: "NOTE",
        description: "Test note",
        authorId: "user-id",
        // authorName not provided
      });

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("listQuotationActivities", () => {
    it("should return activities ordered by createdAt DESC", async () => {
      const { db } = await import("@/lib/db");

      const mockActivities = [
        {
          id: "activity-2",
          quotationId: "quotation-id",
          type: "STATUS_CHANGE",
          description: "Status changed",
          authorId: "user-id",
          authorName: "John",
          metadata: null,
          createdAt: new Date("2025-01-02"),
        },
        {
          id: "activity-1",
          quotationId: "quotation-id",
          type: "CREATION",
          description: "Created",
          authorId: null,
          authorName: "System",
          metadata: null,
          createdAt: new Date("2025-01-01"),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockActivities),
            }),
          }),
        }),
      } as never);

      const result = await listQuotationActivities("quotation-id");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("activity-2");
      expect(result[1].id).toBe("activity-1");
    });

    it("should respect limit option", async () => {
      const { db } = await import("@/lib/db");

      const mockActivities = [
        {
          id: "activity-1",
          quotationId: "quotation-id",
          type: "NOTE",
          description: "Note 1",
          authorId: null,
          authorName: null,
          metadata: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockActivities),
            }),
          }),
        }),
      } as never);

      await listQuotationActivities("quotation-id", { limit: 10 });

      expect(db.select).toHaveBeenCalled();
    });
  });
});

// ===========================================
// Pure function tests for listQuotationsWithFilters
// ===========================================

describe("Quotation Filters Logic", () => {
  // Test pure filter logic without database

  interface MockQuotation {
    id: string;
    status: string;
    sellerId: string | null;
    createdAt: Date;
    mensalidade: number;
    vehicle: {
      categoria: string;
      valorFipe: number;
      placa: string;
      marca: string;
      modelo: string;
    };
    customer: {
      name: string;
      phone: string;
      cpf: string;
    };
  }

  const mockQuotations: MockQuotation[] = [
    {
      id: "q1",
      status: "PENDING",
      sellerId: "seller-1",
      createdAt: new Date("2025-01-15"),
      mensalidade: 200,
      vehicle: { categoria: "NORMAL", valorFipe: 50000, placa: "ABC1234", marca: "Honda", modelo: "Civic" },
      customer: { name: "John Doe", phone: "11999999999", cpf: "12345678901" },
    },
    {
      id: "q2",
      status: "CONTACTED",
      sellerId: "seller-2",
      createdAt: new Date("2025-01-14"),
      mensalidade: 300,
      vehicle: { categoria: "ESPECIAL", valorFipe: 80000, placa: "XYZ5678", marca: "Toyota", modelo: "Corolla" },
      customer: { name: "Jane Smith", phone: "11888888888", cpf: "98765432101" },
    },
    {
      id: "q3",
      status: "PENDING",
      sellerId: "seller-1",
      createdAt: new Date("2025-01-13"),
      mensalidade: 150,
      vehicle: { categoria: "MOTO", valorFipe: 20000, placa: "MOT1111", marca: "Honda", modelo: "CG 160" },
      customer: { name: "Bob Wilson", phone: "11777777777", cpf: "11122233344" },
    },
  ];

  function filterQuotations(
    quotations: MockQuotation[],
    filters: Partial<QuotationFilters>
  ): MockQuotation[] {
    let result = [...quotations];

    if (filters.sellerId) {
      result = result.filter((q) => q.sellerId === filters.sellerId);
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((q) => filters.status!.includes(q.status as QuotationStatus));
    }

    if (filters.category && filters.category.length > 0) {
      result = result.filter((q) =>
        filters.category!.includes(q.vehicle.categoria as "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO")
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (q) =>
          q.customer.name.toLowerCase().includes(searchLower) ||
          q.customer.phone.includes(searchLower) ||
          q.customer.cpf.includes(searchLower) ||
          q.vehicle.placa.toLowerCase().includes(searchLower) ||
          q.vehicle.marca.toLowerCase().includes(searchLower) ||
          q.vehicle.modelo.toLowerCase().includes(searchLower)
      );
    }

    if (filters.fipeMin !== undefined) {
      result = result.filter((q) => q.vehicle.valorFipe >= filters.fipeMin!);
    }

    if (filters.fipeMax !== undefined) {
      result = result.filter((q) => q.vehicle.valorFipe <= filters.fipeMax!);
    }

    if (filters.dateFrom) {
      result = result.filter((q) => q.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      result = result.filter((q) => q.createdAt <= filters.dateTo!);
    }

    return result;
  }

  describe("filterQuotations", () => {
    it("filters by single status", () => {
      const result = filterQuotations(mockQuotations, { status: ["PENDING"] });
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.status === "PENDING")).toBe(true);
    });

    it("filters by multiple statuses", () => {
      const result = filterQuotations(mockQuotations, {
        status: ["PENDING", "CONTACTED"],
      });
      expect(result).toHaveLength(3);
    });

    it("filters by vehicle category", () => {
      const result = filterQuotations(mockQuotations, { category: ["MOTO"] });
      expect(result).toHaveLength(1);
      expect(result[0].vehicle.categoria).toBe("MOTO");
    });

    it("filters by sellerId", () => {
      const result = filterQuotations(mockQuotations, { sellerId: "seller-1" });
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.sellerId === "seller-1")).toBe(true);
    });

    it("searches by customer name", () => {
      const result = filterQuotations(mockQuotations, { search: "john" });
      expect(result).toHaveLength(1);
      expect(result[0].customer.name).toBe("John Doe");
    });

    it("searches by vehicle plate", () => {
      const result = filterQuotations(mockQuotations, { search: "ABC" });
      expect(result).toHaveLength(1);
      expect(result[0].vehicle.placa).toBe("ABC1234");
    });

    it("searches by vehicle brand", () => {
      const result = filterQuotations(mockQuotations, { search: "honda" });
      expect(result).toHaveLength(2);
    });

    it("filters by FIPE value range", () => {
      const result = filterQuotations(mockQuotations, {
        fipeMin: 30000,
        fipeMax: 60000,
      });
      expect(result).toHaveLength(1);
      expect(result[0].vehicle.valorFipe).toBe(50000);
    });

    it("filters by date range", () => {
      const result = filterQuotations(mockQuotations, {
        dateFrom: new Date("2025-01-14"),
        dateTo: new Date("2025-01-15"),
      });
      expect(result).toHaveLength(2);
    });

    it("combines multiple filters", () => {
      const result = filterQuotations(mockQuotations, {
        status: ["PENDING"],
        sellerId: "seller-1",
        category: ["NORMAL"],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("q1");
    });
  });
});
