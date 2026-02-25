import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { randomBytes } from "crypto";
import { eq, and, count } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

function generateApiKey(): string {
  return "sk_" + randomBytes(24).toString("hex");
}

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Property ──────────────────────────────────────────────────────────────

  const [property] = await db
    .insert(schema.properties)
    .values({
      name: "Preelook Apartments",
      slug: "preelook-apartments",
      description:
        "Modern self-catering apartments in the heart of Rijeka, Croatia. Steps from the Korzo promenade, perfect for exploring Kvarner Bay.",
      address: "Ulica Ante Starčevića 12",
      city: "Rijeka",
      country: "HR",
      currency: "EUR",
      timezone: "Europe/Zagreb",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      depositPercentage: 30,
      paymentMode: "deposit_at_booking",
      status: "active",
      apiKey: generateApiKey(),
    })
    .onConflictDoNothing()
    .returning();

  if (!property) {
    console.log("Property already seeded, skipping.");
    return;
  }

  console.log(`  ✓ Property: ${property.name} (id: ${property.id})`);

  // ── Room Types ────────────────────────────────────────────────────────────

  const roomTypeData = [
    {
      name: "Studio Apartment",
      slug: "studio",
      description:
        "Compact and comfortable open-plan studio with a kitchenette, double bed, and city view. Ideal for couples or solo travellers.",
      baseOccupancy: 2,
      maxOccupancy: 2,
      baseRateCents: 7500, // €75/night
      sortOrder: 1,
    },
    {
      name: "One-Bedroom Apartment",
      slug: "one-bedroom",
      description:
        "Spacious one-bedroom apartment with a separate living area, fully equipped kitchen, and balcony. Sleeps up to 3 guests.",
      baseOccupancy: 2,
      maxOccupancy: 3,
      baseRateCents: 10500, // €105/night
      sortOrder: 2,
    },
    {
      name: "Two-Bedroom Apartment",
      slug: "two-bedroom",
      description:
        "Generous two-bedroom apartment perfect for families or groups. Full kitchen, two bathrooms, and a large terrace with sea view.",
      baseOccupancy: 4,
      maxOccupancy: 6,
      baseRateCents: 15000, // €150/night
      sortOrder: 3,
    },
    {
      name: "Penthouse Suite",
      slug: "penthouse",
      description:
        "Premium top-floor penthouse with panoramic views of Rijeka and Kvarner Bay, designer furnishings, and private rooftop terrace.",
      baseOccupancy: 2,
      maxOccupancy: 4,
      baseRateCents: 22000, // €220/night
      sortOrder: 4,
    },
  ];

  const insertedRoomTypes = await db
    .insert(schema.roomTypes)
    .values(roomTypeData.map((rt) => ({ ...rt, propertyId: property.id })))
    .returning();

  for (const rt of insertedRoomTypes) {
    console.log(`  ✓ Room type: ${rt.name} (€${rt.baseRateCents / 100}/night)`);
  }

  const bySlug = Object.fromEntries(insertedRoomTypes.map((rt) => [rt.slug, rt]));

  // ── Rooms ─────────────────────────────────────────────────────────────────

  const roomData: Array<{
    roomTypeSlug: string;
    roomNumber: string;
    floor: string;
  }> = [
    // Studios (floor 1 & 2)
    { roomTypeSlug: "studio", roomNumber: "101", floor: "1" },
    { roomTypeSlug: "studio", roomNumber: "102", floor: "1" },
    { roomTypeSlug: "studio", roomNumber: "103", floor: "1" },
    { roomTypeSlug: "studio", roomNumber: "201", floor: "2" },
    { roomTypeSlug: "studio", roomNumber: "202", floor: "2" },

    // One-bedrooms (floor 2 & 3)
    { roomTypeSlug: "one-bedroom", roomNumber: "203", floor: "2" },
    { roomTypeSlug: "one-bedroom", roomNumber: "301", floor: "3" },
    { roomTypeSlug: "one-bedroom", roomNumber: "302", floor: "3" },
    { roomTypeSlug: "one-bedroom", roomNumber: "303", floor: "3" },

    // Two-bedrooms (floor 4)
    { roomTypeSlug: "two-bedroom", roomNumber: "401", floor: "4" },
    { roomTypeSlug: "two-bedroom", roomNumber: "402", floor: "4" },
    { roomTypeSlug: "two-bedroom", roomNumber: "403", floor: "4" },

    // Penthouse (floor 5)
    { roomTypeSlug: "penthouse", roomNumber: "501", floor: "5" },
  ];

  await db.insert(schema.rooms).values(
    roomData.map((r) => ({
      propertyId: property.id,
      roomTypeId: bySlug[r.roomTypeSlug].id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      status: "available" as const,
    }))
  );

  console.log(`  ✓ Rooms: ${roomData.length} rooms created`);

  // ── Inventory ─────────────────────────────────────────────────────────────

  console.log("\n  Initializing inventory...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inventoryDates = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  for (const rt of insertedRoomTypes) {
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
    for (let i = 0; i < inventoryDates.length; i += BATCH_SIZE) {
      const batch = inventoryDates.slice(i, i + BATCH_SIZE).map((date) => ({
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
    console.log(`  ✓ Inventory: ${rt.name} — 365 days (${totalUnits} units/day)`);
  }

  // ── Rate Plans ────────────────────────────────────────────────────────────

  // Realistic seasonal pricing for Preelook Apartments (Rijeka, Croatia):
  //   Summer high:    Jun 1 – Aug 31   (peak Adriatic season)
  //   Shoulder:       Apr 1 – May 31   (spring)
  //   Shoulder:       Sep 1 – Oct 31   (autumn)
  //   Winter low:     Nov 1 – Mar 31   (off-season, no rate plan → base rate applies)

  type RatePlanSeed = {
    roomTypeSlug: string;
    plans: Array<{
      name: string;
      dateStart: string;
      dateEnd: string;
      rateCents: number;
      priority: number;
    }>;
  };

  const ratePlanData: RatePlanSeed[] = [
    {
      roomTypeSlug: "studio",
      plans: [
        { name: "Studio — Summer 2026", dateStart: "2026-06-01", dateEnd: "2026-08-31", rateCents: 11000, priority: 10 },
        { name: "Studio — Spring 2026", dateStart: "2026-04-01", dateEnd: "2026-05-31", rateCents: 8500, priority: 5 },
        { name: "Studio — Autumn 2026", dateStart: "2026-09-01", dateEnd: "2026-10-31", rateCents: 8500, priority: 5 },
      ],
    },
    {
      roomTypeSlug: "one-bedroom",
      plans: [
        { name: "One-Bedroom — Summer 2026", dateStart: "2026-06-01", dateEnd: "2026-08-31", rateCents: 15000, priority: 10 },
        { name: "One-Bedroom — Spring 2026", dateStart: "2026-04-01", dateEnd: "2026-05-31", rateCents: 12000, priority: 5 },
        { name: "One-Bedroom — Autumn 2026", dateStart: "2026-09-01", dateEnd: "2026-10-31", rateCents: 12000, priority: 5 },
      ],
    },
    {
      roomTypeSlug: "two-bedroom",
      plans: [
        { name: "Two-Bedroom — Summer 2026", dateStart: "2026-06-01", dateEnd: "2026-08-31", rateCents: 22000, priority: 10 },
        { name: "Two-Bedroom — Spring 2026", dateStart: "2026-04-01", dateEnd: "2026-05-31", rateCents: 17500, priority: 5 },
        { name: "Two-Bedroom — Autumn 2026", dateStart: "2026-09-01", dateEnd: "2026-10-31", rateCents: 17500, priority: 5 },
      ],
    },
    {
      roomTypeSlug: "penthouse",
      plans: [
        { name: "Penthouse — Summer 2026", dateStart: "2026-06-01", dateEnd: "2026-08-31", rateCents: 32000, priority: 10 },
        { name: "Penthouse — Spring 2026", dateStart: "2026-04-01", dateEnd: "2026-05-31", rateCents: 26000, priority: 5 },
        { name: "Penthouse — Autumn 2026", dateStart: "2026-09-01", dateEnd: "2026-10-31", rateCents: 26000, priority: 5 },
      ],
    },
  ];

  let totalPlans = 0;
  for (const { roomTypeSlug, plans } of ratePlanData) {
    const rt = bySlug[roomTypeSlug];
    await db.insert(schema.ratePlans).values(
      plans.map((p) => ({
        propertyId: property.id,
        roomTypeId: rt.id,
        name: p.name,
        type: "seasonal" as const,
        dateStart: p.dateStart,
        dateEnd: p.dateEnd,
        rateCents: p.rateCents,
        priority: p.priority,
        status: "active" as const,
      }))
    );
    totalPlans += plans.length;
    console.log(`  ✓ Rate plans: ${rt.name} (${plans.length} plans)`);
  }
  console.log(`  ✓ Total rate plans created: ${totalPlans}`);

  console.log("\n✅ Seed complete!");
  console.log(`\nProperty slug: ${property.slug}`);
  console.log(`API key: ${property.apiKey}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
