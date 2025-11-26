import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isBlacklisted,
  listBlacklist,
  addToBlacklist,
  removeFromBlacklist,
} from "@/lib/blacklist";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe("Blacklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isBlacklisted", () => {
    it("should return blacklisted=true for blocked brand (model=null in DB)", async () => {
      const { db } = await import("@/lib/db");

      // Mock a brand-level block (modelo = null means entire brand blocked)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { marca: "BMW", modelo: null, motivo: "Nao trabalhamos com esta marca" },
          ]),
        }),
      } as never);

      const result = await isBlacklisted("BMW", "X5");

      expect(result.blacklisted).toBe(true);
      expect(result.motivo).toBe("Nao trabalhamos com esta marca");
    });

    it("should return blacklisted=true for specific blocked model", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { marca: "FORD", modelo: "FOCUS", motivo: "Nao trabalhamos com este modelo" },
          ]),
        }),
      } as never);

      const result = await isBlacklisted("FORD", "FOCUS");

      expect(result.blacklisted).toBe(true);
      expect(result.motivo).toBe("Nao trabalhamos com este modelo");
    });

    it("should return blacklisted=false for allowed vehicles", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const result = await isBlacklisted("TOYOTA", "COROLLA");

      expect(result.blacklisted).toBe(false);
      expect(result.motivo).toBeUndefined();
    });

    it("should handle case-insensitive brand matching", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { marca: "BMW", modelo: null, motivo: "Nao trabalhamos com esta marca" },
          ]),
        }),
      } as never);

      const result = await isBlacklisted("bmw", "X5");

      expect(result.blacklisted).toBe(true);
    });
  });

  // ===========================================
  // Phase 8: CRUD Tests (T084)
  // ===========================================

  describe("listBlacklist", () => {
    it("should list all active blacklist items by default", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "1",
              marca: "BMW",
              modelo: null,
              motivo: "Nao trabalhamos com esta marca",
              isActive: true,
              createdAt: new Date(),
            },
            {
              id: "2",
              marca: "FORD",
              modelo: "FOCUS",
              motivo: "Nao trabalhamos com este modelo",
              isActive: true,
              createdAt: new Date(),
            },
          ]),
        }),
      } as never);

      const result = await listBlacklist();

      expect(result).toHaveLength(2);
      expect(result[0].marca).toBe("BMW");
      expect(result[1].modelo).toBe("FOCUS");
    });

    it("should include inactive items when activeOnly is false", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockResolvedValue([
          {
            id: "1",
            marca: "BMW",
            modelo: null,
            motivo: "Nao trabalhamos com esta marca",
            isActive: true,
            createdAt: new Date(),
          },
          {
            id: "2",
            marca: "AUDI",
            modelo: null,
            motivo: "Nao trabalhamos com esta marca",
            isActive: false,
            createdAt: new Date(),
          },
        ]),
      } as never);

      const result = await listBlacklist(false);

      expect(result).toHaveLength(2);
    });
  });

  describe("addToBlacklist", () => {
    it("should add a brand to blacklist (model=null)", async () => {
      const { db } = await import("@/lib/db");

      const newItem = {
        id: "new-id",
        marca: "PORSCHE",
        modelo: null,
        motivo: "Nao trabalhamos com esta marca",
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newItem]),
        }),
      } as never);

      const result = await addToBlacklist("porsche");

      expect(result.marca).toBe("PORSCHE");
      expect(result.modelo).toBeNull();
    });

    it("should add a specific model to blacklist", async () => {
      const { db } = await import("@/lib/db");

      const newItem = {
        id: "new-id",
        marca: "HONDA",
        modelo: "CIVIC",
        motivo: "Modelo com alto indice de sinistro",
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newItem]),
        }),
      } as never);

      const result = await addToBlacklist(
        "honda",
        "civic",
        "Modelo com alto indice de sinistro"
      );

      expect(result.marca).toBe("HONDA");
      expect(result.modelo).toBe("CIVIC");
      expect(result.motivo).toBe("Modelo com alto indice de sinistro");
    });

    it("should normalize marca and modelo to uppercase", async () => {
      const { db } = await import("@/lib/db");

      const newItem = {
        id: "new-id",
        marca: "TOYOTA",
        modelo: "HILUX",
        motivo: "Nao trabalhamos com este veiculo",
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newItem]),
        }),
      } as never);

      const result = await addToBlacklist("toyota", "hilux");

      expect(result.marca).toBe("TOYOTA");
      expect(result.modelo).toBe("HILUX");
    });
  });

  describe("removeFromBlacklist", () => {
    it("should soft delete (deactivate) a blacklist item", async () => {
      const { db } = await import("@/lib/db");

      const deletedItem = {
        id: "to-delete-id",
        marca: "BMW",
        modelo: null,
        motivo: "Nao trabalhamos com esta marca",
        isActive: false,
        createdAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deletedItem]),
          }),
        }),
      } as never);

      const result = await removeFromBlacklist("to-delete-id");

      expect(result.isActive).toBe(false);
    });
  });
});
