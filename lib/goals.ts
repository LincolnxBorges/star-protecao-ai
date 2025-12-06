/**
 * Goals Context Module
 *
 * Business logic for managing seller monthly goals.
 * Following Constitution Principle I: Context-Oriented Architecture
 */

import { db } from "@/lib/db";
import { sellers, sellerGoals, quotations } from "@/lib/schema";
import { eq, and, count, gte, lte, desc } from "drizzle-orm";

// ===========================================
// Types
// ===========================================

export interface SellerWithGoal {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "VACATION";
  goal: {
    id: string;
    targetAccepted: number;
    currentAccepted: number;
    percentage: number;
  } | null;
}

export interface GoalInput {
  sellerId: string;
  month: number;
  year: number;
  targetAccepted: number;
}

// ===========================================
// Helper Functions
// ===========================================

function getMonthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

// ===========================================
// Goal Management Functions
// ===========================================

/**
 * Get all active sellers with their current month goals
 */
export async function getSellersWithGoals(
  month: number,
  year: number
): Promise<SellerWithGoal[]> {
  const range = getMonthRange(month, year);

  // Get all active sellers
  const allSellers = await db
    .select({
      id: sellers.id,
      name: sellers.name,
      email: sellers.email,
      status: sellers.status,
    })
    .from(sellers)
    .where(eq(sellers.status, "ACTIVE"))
    .orderBy(sellers.name);

  // Get goals for the month
  const goals = await db
    .select()
    .from(sellerGoals)
    .where(
      and(
        eq(sellerGoals.month, month),
        eq(sellerGoals.year, year)
      )
    );

  // Get accepted counts for each seller
  const acceptedCounts = await db
    .select({
      sellerId: quotations.sellerId,
      count: count(),
    })
    .from(quotations)
    .where(
      and(
        eq(quotations.status, "ACCEPTED"),
        gte(quotations.acceptedAt, range.start),
        lte(quotations.acceptedAt, range.end)
      )
    )
    .groupBy(quotations.sellerId);

  // Build the result
  return allSellers.map((seller) => {
    const goal = goals.find((g) => g.sellerId === seller.id);
    const accepted = acceptedCounts.find((a) => a.sellerId === seller.id);
    const currentAccepted = accepted?.count ?? 0;

    return {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      status: seller.status as "ACTIVE" | "INACTIVE" | "VACATION",
      goal: goal
        ? {
            id: goal.id,
            targetAccepted: goal.targetAccepted,
            currentAccepted,
            percentage: goal.targetAccepted > 0
              ? Math.min(Math.round((currentAccepted / goal.targetAccepted) * 100), 100)
              : 0,
          }
        : null,
    };
  });
}

/**
 * Set or update a goal for a seller
 */
export async function setGoal(input: GoalInput): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if goal already exists
    const [existing] = await db
      .select()
      .from(sellerGoals)
      .where(
        and(
          eq(sellerGoals.sellerId, input.sellerId),
          eq(sellerGoals.month, input.month),
          eq(sellerGoals.year, input.year)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing goal
      await db
        .update(sellerGoals)
        .set({ targetAccepted: input.targetAccepted })
        .where(eq(sellerGoals.id, existing.id));
    } else {
      // Insert new goal
      await db.insert(sellerGoals).values({
        sellerId: input.sellerId,
        month: input.month,
        year: input.year,
        targetAccepted: input.targetAccepted,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error setting goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao definir meta",
    };
  }
}

/**
 * Remove a goal for a seller
 */
export async function removeGoal(
  sellerId: string,
  month: number,
  year: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(sellerGoals)
      .where(
        and(
          eq(sellerGoals.sellerId, sellerId),
          eq(sellerGoals.month, month),
          eq(sellerGoals.year, year)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error removing goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao remover meta",
    };
  }
}

/**
 * Get goal history for a seller
 */
export async function getGoalHistory(sellerId: string, limit: number = 12) {
  return db
    .select()
    .from(sellerGoals)
    .where(eq(sellerGoals.sellerId, sellerId))
    .orderBy(desc(sellerGoals.year), desc(sellerGoals.month))
    .limit(limit);
}
