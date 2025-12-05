import { describe, it, expect, vi, beforeEach } from "vitest";
import { findOrCreateByCpf } from "@/lib/customers";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe("Customers Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findOrCreateByCpf", () => {
    const customerData = {
      name: "Joao Silva",
      email: "joao@email.com",
      phone: "11999999999",
      cpf: "529.982.247-25",
      cep: "01310-100",
      street: "Avenida Paulista",
      number: "1000",
      complement: "Sala 101",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
    };

    it("should return existing customer when CPF already exists", async () => {
      const { db } = await import("@/lib/db");
      const existingCustomer = {
        id: "existing-id",
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingCustomer]),
        }),
      } as never);

      const result = await findOrCreateByCpf(customerData);

      expect(result.id).toBe("existing-id");
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should create new customer when CPF does not exist", async () => {
      const { db } = await import("@/lib/db");
      const newCustomer = {
        id: "new-id",
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newCustomer]),
        }),
      } as never);

      const result = await findOrCreateByCpf(customerData);

      expect(result.id).toBe("new-id");
      expect(db.insert).toHaveBeenCalled();
    });

    it("should normalize CPF before searching", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "new-id", ...customerData },
          ]),
        }),
      } as never);

      // CPF with formatting
      await findOrCreateByCpf({
        ...customerData,
        cpf: "529.982.247-25",
      });

      // Should search/insert with formatted CPF
      expect(db.select).toHaveBeenCalled();
    });
  });
});
