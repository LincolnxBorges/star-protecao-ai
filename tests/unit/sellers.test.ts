/**
 * Tests for sellers context - round-robin algorithm
 * @module tests/unit/sellers.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock types for testing
interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  role: "SELLER" | "ADMIN";
  lastAssignmentAt: Date | null;
  assignmentCount: number;
  createdAt: Date;
}

// Pure functions to test the round-robin algorithm logic
function selectNextSeller(sellers: Seller[]): Seller | null {
  // Filter active sellers
  const activeSellers = sellers.filter((s) => s.isActive);

  if (activeSellers.length === 0) {
    return null;
  }

  // Sort by lastAssignmentAt (null first, then oldest first)
  // If lastAssignmentAt is the same, sort by createdAt
  activeSellers.sort((a, b) => {
    // Null values come first (never assigned)
    if (a.lastAssignmentAt === null && b.lastAssignmentAt !== null) return -1;
    if (a.lastAssignmentAt !== null && b.lastAssignmentAt === null) return 1;
    if (a.lastAssignmentAt === null && b.lastAssignmentAt === null) {
      // Both null, sort by createdAt
      return a.createdAt.getTime() - b.createdAt.getTime();
    }

    // Both have dates, sort by date (oldest first)
    const dateCompare =
      a.lastAssignmentAt!.getTime() - b.lastAssignmentAt!.getTime();
    if (dateCompare !== 0) return dateCompare;

    // Same date, sort by createdAt
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return activeSellers[0];
}

function prepareAssignmentUpdate(
  seller: Seller
): Pick<Seller, "lastAssignmentAt" | "assignmentCount"> {
  return {
    lastAssignmentAt: new Date(),
    assignmentCount: seller.assignmentCount + 1,
  };
}

describe("Sellers Context", () => {
  describe("selectNextSeller - round-robin algorithm", () => {
    it("returns null when no sellers exist", () => {
      const result = selectNextSeller([]);
      expect(result).toBeNull();
    });

    it("returns null when all sellers are inactive", () => {
      const sellers: Seller[] = [
        {
          id: "1",
          name: "Seller 1",
          email: "seller1@test.com",
          phone: null,
          isActive: false,
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Seller 2",
          email: "seller2@test.com",
          phone: null,
          isActive: false,
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-02"),
        },
      ];

      const result = selectNextSeller(sellers);
      expect(result).toBeNull();
    });

    it("selects seller with null lastAssignmentAt first (never assigned)", () => {
      const sellers: Seller[] = [
        {
          id: "1",
          name: "Seller 1",
          email: "seller1@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: new Date("2024-01-15"),
          assignmentCount: 5,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Seller 2",
          email: "seller2@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-02"),
        },
      ];

      const result = selectNextSeller(sellers);
      expect(result?.id).toBe("2");
    });

    it("selects seller with oldest lastAssignmentAt", () => {
      const sellers: Seller[] = [
        {
          id: "1",
          name: "Seller 1",
          email: "seller1@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: new Date("2024-01-15T10:00:00Z"),
          assignmentCount: 5,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Seller 2",
          email: "seller2@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: new Date("2024-01-10T10:00:00Z"), // oldest
          assignmentCount: 3,
          createdAt: new Date("2024-01-02"),
        },
        {
          id: "3",
          name: "Seller 3",
          email: "seller3@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: new Date("2024-01-12T10:00:00Z"),
          assignmentCount: 4,
          createdAt: new Date("2024-01-03"),
        },
      ];

      const result = selectNextSeller(sellers);
      expect(result?.id).toBe("2");
    });

    it("uses createdAt as tiebreaker when lastAssignmentAt is equal", () => {
      const sameDate = new Date("2024-01-15T10:00:00Z");
      const sellers: Seller[] = [
        {
          id: "1",
          name: "Seller 1",
          email: "seller1@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: sameDate,
          assignmentCount: 5,
          createdAt: new Date("2024-01-05"), // newer
        },
        {
          id: "2",
          name: "Seller 2",
          email: "seller2@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: sameDate,
          assignmentCount: 5,
          createdAt: new Date("2024-01-01"), // oldest
        },
      ];

      const result = selectNextSeller(sellers);
      expect(result?.id).toBe("2");
    });

    it("excludes inactive sellers from selection", () => {
      const sellers: Seller[] = [
        {
          id: "1",
          name: "Seller 1",
          email: "seller1@test.com",
          phone: null,
          isActive: false, // inactive
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Seller 2",
          email: "seller2@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: new Date("2024-01-15"),
          assignmentCount: 10,
          createdAt: new Date("2024-01-02"),
        },
      ];

      const result = selectNextSeller(sellers);
      expect(result?.id).toBe("2");
    });

    it("includes ADMIN role in round-robin selection", () => {
      const sellers: Seller[] = [
        {
          id: "1",
          name: "Admin",
          email: "admin@test.com",
          phone: null,
          isActive: true,
          role: "ADMIN",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Seller",
          email: "seller@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: new Date("2024-01-15"),
          assignmentCount: 10,
          createdAt: new Date("2024-01-02"),
        },
      ];

      const result = selectNextSeller(sellers);
      expect(result?.id).toBe("1");
      expect(result?.role).toBe("ADMIN");
    });
  });

  describe("prepareAssignmentUpdate", () => {
    it("increments assignment count", () => {
      const seller: Seller = {
        id: "1",
        name: "Seller 1",
        email: "seller1@test.com",
        phone: null,
        isActive: true,
        role: "SELLER",
        lastAssignmentAt: null,
        assignmentCount: 5,
        createdAt: new Date(),
      };

      const update = prepareAssignmentUpdate(seller);
      expect(update.assignmentCount).toBe(6);
    });

    it("sets lastAssignmentAt to current time", () => {
      const before = new Date();

      const seller: Seller = {
        id: "1",
        name: "Seller 1",
        email: "seller1@test.com",
        phone: null,
        isActive: true,
        role: "SELLER",
        lastAssignmentAt: null,
        assignmentCount: 0,
        createdAt: new Date(),
      };

      const update = prepareAssignmentUpdate(seller);
      const after = new Date();

      expect(update.lastAssignmentAt).not.toBeNull();
      expect(update.lastAssignmentAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(update.lastAssignmentAt!.getTime()).toBeLessThanOrEqual(
        after.getTime()
      );
    });
  });

  describe("Round-robin distribution simulation", () => {
    it("distributes evenly across multiple assignments", () => {
      // Simulate 9 assignments across 3 sellers
      let sellers: Seller[] = [
        {
          id: "1",
          name: "Seller 1",
          email: "seller1@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Seller 2",
          email: "seller2@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-02"),
        },
        {
          id: "3",
          name: "Seller 3",
          email: "seller3@test.com",
          phone: null,
          isActive: true,
          role: "SELLER",
          lastAssignmentAt: null,
          assignmentCount: 0,
          createdAt: new Date("2024-01-03"),
        },
      ];

      const assignments: string[] = [];

      for (let i = 0; i < 9; i++) {
        const selected = selectNextSeller(sellers);
        if (selected) {
          assignments.push(selected.id);

          // Update the seller's state
          sellers = sellers.map((s) =>
            s.id === selected.id
              ? {
                  ...s,
                  lastAssignmentAt: new Date(Date.now() + i * 1000), // stagger times
                  assignmentCount: s.assignmentCount + 1,
                }
              : s
          );
        }
      }

      // Each seller should get exactly 3 assignments
      const counts = assignments.reduce(
        (acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(counts["1"]).toBe(3);
      expect(counts["2"]).toBe(3);
      expect(counts["3"]).toBe(3);
    });
  });
});
