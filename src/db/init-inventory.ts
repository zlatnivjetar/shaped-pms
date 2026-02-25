/**
 * Inventory backfill script.
 *
 * Run with: npm run db:init-inventory
 *
 * Initializes (or re-syncs) a rolling 365-day inventory window for all
 * room types across all properties. Safe to run multiple times — uses
 * upsert logic that never touches booked_units or blocked_units.
 *
 * Use cases:
 *  - First-time setup after deploying Milestone 2
 *  - Recovering from schema changes
 *  - Extending inventory window after prolonged inactivity
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, and, count } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function initInventory() {
  console.log("📦 Initializing inventory...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const properties = await db.select().from(schema.properties);

  for (const property of properties) {
    const roomTypeRows = await db
      .select()
      .from(schema.roomTypes)
      .where(eq(schema.roomTypes.propertyId, property.id));

    console.log(`\nProperty: ${property.name} — ${roomTypeRows.length} room type(s)`);

    for (const rt of roomTypeRows) {
      const [countResult] = await db
        .select({ count: count() })
        .from(schema.rooms)
        .where(
          and(
            eq(schema.rooms.propertyId, property.id),
            eq(schema.rooms.roomTypeId, rt.id)
          )
        );
      const totalUnits = Number(countResult?.count ?? 0);

      const BATCH_SIZE = 100;
      for (let i = 0; i < dates.length; i += BATCH_SIZE) {
        const batch = dates.slice(i, i + BATCH_SIZE).map((date) => ({
          propertyId: property.id,
          roomTypeId: rt.id,
          date,
          totalUnits,
        }));
        await db
          .insert(schema.inventory)
          .values(batch)
          .onConflictDoUpdate({
            target: [schema.inventory.propertyId, schema.inventory.roomTypeId, schema.inventory.date],
            set: { totalUnits, updatedAt: new Date() },
          });
      }

      console.log(`  ✓ ${rt.name} — 365 rows (${totalUnits} units/day)`);
    }
  }

  console.log("\n✅ Inventory initialization complete!");
}

initInventory().catch((err) => {
  console.error("Init failed:", err);
  process.exit(1);
});
