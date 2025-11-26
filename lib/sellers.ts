/**
 * Sellers Context
 * @module lib/sellers
 */

import { db } from "@/lib/db";
import { sellers, quotations } from "@/lib/schema";
import { eq, asc, sql } from "drizzle-orm";

// ===========================================
// Types
// ===========================================

export interface Seller {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean | null;
  role: "SELLER" | "ADMIN";
  lastAssignmentAt: Date | null;
  assignmentCount: number | null;
  createdAt: Date | null;
}

export interface CreateSellerData {
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  role?: "SELLER" | "ADMIN";
}

// ===========================================
// Seller Queries
// ===========================================

export async function getSellerById(id: string): Promise<Seller | null> {
  const results = await db.select().from(sellers).where(eq(sellers.id, id));

  return results[0] || null;
}

export async function getSellerByUserId(
  userId: string
): Promise<Seller | null> {
  const results = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, userId));

  return results[0] || null;
}

export async function listActiveSellers(): Promise<Seller[]> {
  return db
    .select()
    .from(sellers)
    .where(eq(sellers.isActive, true))
    .orderBy(asc(sellers.name));
}

// ===========================================
// Seller CRUD
// ===========================================

export async function createSeller(data: CreateSellerData): Promise<Seller> {
  const [seller] = await db
    .insert(sellers)
    .values({
      userId: data.userId || null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role || "SELLER",
    })
    .returning();

  return seller;
}

export async function updateSeller(
  id: string,
  data: Partial<Omit<CreateSellerData, "userId">>
): Promise<Seller | null> {
  const [updated] = await db
    .update(sellers)
    .set(data)
    .where(eq(sellers.id, id))
    .returning();

  return updated || null;
}

export async function deactivateSeller(id: string): Promise<Seller | null> {
  const [updated] = await db
    .update(sellers)
    .set({ isActive: false })
    .where(eq(sellers.id, id))
    .returning();

  return updated || null;
}

export async function activateSeller(id: string): Promise<Seller | null> {
  const [updated] = await db
    .update(sellers)
    .set({ isActive: true })
    .where(eq(sellers.id, id))
    .returning();

  return updated || null;
}

// ===========================================
// Round-Robin Assignment
// ===========================================

/**
 * Get the next seller to assign using round-robin algorithm.
 * Selects the active seller with the oldest lastAssignmentAt (or null = never assigned).
 * Uses createdAt as tiebreaker.
 *
 * @returns The next seller to assign, or null if no active sellers exist
 */
export async function getNextActiveSeller(): Promise<Seller | null> {
  // Query active sellers ordered by:
  // 1. lastAssignmentAt NULLS FIRST (never assigned get priority)
  // 2. lastAssignmentAt ASC (oldest first)
  // 3. createdAt ASC (tiebreaker)
  const results = await db
    .select()
    .from(sellers)
    .where(eq(sellers.isActive, true))
    .orderBy(
      sql`${sellers.lastAssignmentAt} ASC NULLS FIRST`,
      asc(sellers.createdAt)
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Assign a seller to a quotation and update the seller's assignment tracking.
 *
 * @param quotationId - The ID of the quotation to assign
 * @returns The assigned seller, or null if no active sellers or quotation not found
 */
export async function assignSellerToQuotation(
  quotationId: string
): Promise<Seller | null> {
  // Get the next seller in round-robin order
  const seller = await getNextActiveSeller();

  if (!seller) {
    console.warn("No active sellers available for assignment");
    return null;
  }

  // Update the quotation with the seller ID
  const [updatedQuotation] = await db
    .update(quotations)
    .set({ sellerId: seller.id })
    .where(eq(quotations.id, quotationId))
    .returning();

  if (!updatedQuotation) {
    console.warn(`Quotation ${quotationId} not found for assignment`);
    return null;
  }

  // Update the seller's assignment tracking
  await db
    .update(sellers)
    .set({
      lastAssignmentAt: new Date(),
      assignmentCount: (seller.assignmentCount || 0) + 1,
    })
    .where(eq(sellers.id, seller.id));

  return seller;
}

// ===========================================
// Statistics
// ===========================================

export async function getSellerStats(sellerId: string): Promise<{
  totalQuotations: number;
  pendingQuotations: number;
  acceptedQuotations: number;
}> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${quotations.status} = 'PENDING')`,
      accepted: sql<number>`count(*) filter (where ${quotations.status} = 'ACCEPTED')`,
    })
    .from(quotations)
    .where(eq(quotations.sellerId, sellerId));

  return {
    totalQuotations: Number(stats?.total || 0),
    pendingQuotations: Number(stats?.pending || 0),
    acceptedQuotations: Number(stats?.accepted || 0),
  };
}
