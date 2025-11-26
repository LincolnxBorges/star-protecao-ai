import "dotenv/config";
import { db } from "../lib/db";
import { sellers, user } from "../lib/schema";
import { eq } from "drizzle-orm";

// ===========================================
// CREATE ADMIN & SELLER USERS via Better Auth API
// ===========================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function signUp(email: string, password: string, name: string) {
  const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sign up failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function createUsers() {
  console.log("👥 Creating admin and seller users via Better Auth API...\n");
  console.log(`Using API: ${BASE_URL}\n`);

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
    try {
      // Check if seller already exists
      const existingSeller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.email, userData.email))
        .limit(1);

      if (existingSeller.length > 0) {
        console.log(`  ⏭️  Seller already exists: ${userData.email}`);
        continue;
      }

      // Sign up via Better Auth API
      console.log(`  Creating user: ${userData.email}...`);
      const result = await signUp(userData.email, userData.password, userData.name);

      if (result.user) {
        // Create seller record linked to the user
        await db.insert(sellers).values({
          userId: result.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: true,
        });

        console.log(`  ✓ Created ${userData.role}: ${userData.email}`);
      }
    } catch (error) {
      // User might already exist in auth but not in sellers
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        // Check if seller record exists
        const existingSeller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.email, userData.email))
          .limit(1);

        if (existingSeller.length === 0) {
          await db.insert(sellers).values({
            userId: existingUser[0].id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            isActive: true,
          });
          console.log(`  ✓ Created seller record for existing user: ${userData.email}`);
        } else {
          console.log(`  ⏭️  User already exists: ${userData.email}`);
        }
      } else {
        console.error(`  ❌ Failed to create ${userData.email}:`, error);
      }
    }
  }

  // Summary
  console.log("\n📋 Summary:");
  console.log("  Admin login: admin@starprotecao.com.br / admin123");
  console.log("  Seller 1 login: vendedor1@starprotecao.com.br / vendedor123");
  console.log("  Seller 2 login: vendedor2@starprotecao.com.br / vendedor123");

  console.log("\n✅ Users creation completed!");
}

createUsers()
  .catch((err) => {
    console.error("❌ User creation failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
