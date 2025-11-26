/**
 * Blacklist Context
 * @module lib/blacklist
 */

import { db } from "@/lib/db";
import { blacklist } from "@/lib/schema";
import { eq, and, or, isNull } from "drizzle-orm";

// ===========================================
// Types
// ===========================================

export interface BlacklistCheckResult {
  blacklisted: boolean;
  motivo?: string;
}

export interface BlacklistItem {
  id: string;
  marca: string;
  modelo: string | null;
  motivo: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

// ===========================================
// Blacklist Check
// ===========================================

export async function isBlacklisted(
  marca: string,
  modelo: string
): Promise<BlacklistCheckResult> {
  const normalizedMarca = marca.toUpperCase();
  const normalizedModelo = modelo.toUpperCase();

  // Check for:
  // 1. Exact match of brand + model
  // 2. Brand-level block (model = null)
  const results = await db
    .select()
    .from(blacklist)
    .where(
      and(
        eq(blacklist.isActive, true),
        eq(blacklist.marca, normalizedMarca),
        or(
          isNull(blacklist.modelo), // Brand-level block
          eq(blacklist.modelo, normalizedModelo) // Specific model block
        )
      )
    );

  if (results.length > 0) {
    // Prefer the more specific match (with model) if both exist
    const specificMatch = results.find((r) => r.modelo !== null);
    const match = specificMatch || results[0];

    return {
      blacklisted: true,
      motivo: match.motivo || "Nao trabalhamos com este veiculo",
    };
  }

  return { blacklisted: false };
}

// ===========================================
// Blacklist CRUD
// ===========================================

export async function listBlacklist(
  activeOnly = true
): Promise<BlacklistItem[]> {
  if (activeOnly) {
    return db
      .select()
      .from(blacklist)
      .where(eq(blacklist.isActive, true));
  }

  return db.select().from(blacklist);
}

export async function addToBlacklist(
  marca: string,
  modelo?: string | null,
  motivo?: string
): Promise<BlacklistItem> {
  const [item] = await db
    .insert(blacklist)
    .values({
      marca: marca.toUpperCase(),
      modelo: modelo?.toUpperCase() || null,
      motivo: motivo || "Nao trabalhamos com este veiculo",
    })
    .returning();

  return item;
}

export async function removeFromBlacklist(id: string): Promise<BlacklistItem> {
  const [item] = await db
    .update(blacklist)
    .set({ isActive: false })
    .where(eq(blacklist.id, id))
    .returning();

  return item;
}
