/**
 * Seed demo users for Preelook Apartments.
 * Creates an owner account and a front-desk account.
 * Safe to run multiple times — skips if emails already exist.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { generateRandomString } from "better-auth/crypto";
import * as schema from "./schema";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

const DEMO_USERS = [
  {
    name: "Demo Owner",
    email: "owner@demo.shaped.so",
    password: "owner1234",
    role: "owner" as const,
  },
  {
    name: "Demo Front Desk",
    email: "frontdesk@demo.shaped.so",
    password: "frontdesk1234",
    role: "front_desk" as const,
  },
];

async function seedUsers() {
  console.log("🌱 Seeding demo users...\n");

  const [property] = await db.select().from(schema.properties).limit(1);
  if (!property) {
    console.error("No property found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  for (const demo of DEMO_USERS) {
    const existing = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, demo.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭ ${demo.email} already exists, skipping.`);
      continue;
    }

    const userId = generateRandomString(32);
    const accountId = generateRandomString(32);
    const hashedPassword = await hashPassword(demo.password);

    await db.insert(schema.user).values({
      id: userId,
      name: demo.name,
      email: demo.email,
      emailVerified: true,
      role: demo.role,
      propertyId: property.id,
    });

    await db.insert(schema.account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    console.log(`  ✓ ${demo.role}: ${demo.email} / ${demo.password}`);
  }

  console.log("\n✅ Demo users ready.");
}

seedUsers().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
