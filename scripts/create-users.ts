import "dotenv/config";
import { db } from "../lib/db";
import { user, account, sellers } from "../lib/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// ===========================================
// CREATE ADMIN & SELLER USERS
// ===========================================

// Hash password using bcrypt-compatible format for Better Auth
// Better Auth uses the Web Crypto API with PBKDF2 or bcrypt
// We'll use the same format Better Auth expects
async function hashPassword(password: string): Promise<string> {
  // Better Auth uses a specific hash format
  // Format: $algorithm$params$salt$hash
  // We'll use scrypt with the format Better Auth expects
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  // Better Auth format: base64(salt):base64(hash)
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

async function createUsers() {
  console.log("👥 Creating admin and seller users...\n");

  const usersToCreate = [
    {
      name: "Admin Star Proteção",
      email: "admin@starprotecao.com.br",
      password: "admin123",
      role: "ADMIN" as const,
    },
    {
      name: "Vendedor 1",
      email: "vendedor1@starprotecao.com.br",
      password: "vendedor123",
      role: "SELLER" as const,
    },
    {
      name: "Vendedor 2",
      email: "vendedor2@starprotecao.com.br",
      password: "vendedor123",
      role: "SELLER" as const,
    },
  ];

  for (const userData of usersToCreate) {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`  ⏭️  User already exists: ${userData.email}`);
      console.log(`      Deleting and recreating...`);
      // Delete existing user data to recreate with correct password
      const existingUserId = existingUser[0].id;
      await db.delete(sellers).where(eq(sellers.userId, existingUserId));
      await db.delete(account).where(eq(account.userId, existingUserId));
      await db.delete(user).where(eq(user.id, existingUserId));
    }

    // Create user
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(userData.password);

    await db.insert(user).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      emailVerified: true,
    });

    // Create account with password (credential provider)
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    // Create seller record
    await db.insert(sellers).values({
      userId: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
    });

    console.log(`  ✓ Created ${userData.role}: ${userData.email}`);
  }

  // Summary
  console.log("\n📋 Summary:");
  console.log("  Admin login: admin@starprotecao.com.br / admin123");
  console.log("  Seller 1 login: vendedor1@starprotecao.com.br / vendedor123");
  console.log("  Seller 2 login: vendedor2@starprotecao.com.br / vendedor123");

  console.log("\n✅ Users created successfully!");
}

createUsers()
  .catch((err) => {
    console.error("❌ User creation failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
