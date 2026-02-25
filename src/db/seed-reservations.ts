/**
 * Seed test guests + reservations for Preelook Apartments.
 * Safe to run multiple times — checks for existing reservation codes before inserting.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, and, inArray, sql } from "drizzle-orm";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

function nights(checkIn: string, checkOut: string): string[] {
  const list: string[] = [];
  const cur = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (cur < end) {
    list.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return list;
}

async function incrementInventory(
  propertyId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string
) {
  const dates = nights(checkIn, checkOut);
  if (!dates.length) return;
  await db
    .update(schema.inventory)
    .set({
      bookedUnits: sql`${schema.inventory.bookedUnits} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.inventory.propertyId, propertyId),
        eq(schema.inventory.roomTypeId, roomTypeId),
        inArray(schema.inventory.date, dates)
      )
    );
}

async function seedReservations() {
  console.log("🌱 Seeding test reservations...");

  // Look up property
  const [property] = await db.select().from(schema.properties).limit(1);
  if (!property) {
    console.error("No property found. Run db:seed first.");
    process.exit(1);
  }
  console.log(`  Property: ${property.name}`);

  // Look up room types
  const allRoomTypes = await db
    .select()
    .from(schema.roomTypes)
    .where(eq(schema.roomTypes.propertyId, property.id));

  const rtBySlug = Object.fromEntries(allRoomTypes.map((rt) => [rt.slug, rt]));
  const studio = rtBySlug["studio"];
  const oneBed = rtBySlug["one-bedroom"];
  const twoBed = rtBySlug["two-bedroom"];
  const penthouse = rtBySlug["penthouse"];

  if (!studio || !oneBed || !twoBed || !penthouse) {
    console.error("Room types not found. Run db:seed first.");
    process.exit(1);
  }

  // ── Test Guests ────────────────────────────────────────────────────────────

  const guestData = [
    {
      email: "ana.horvat@example.com",
      firstName: "Ana",
      lastName: "Horvat",
      phone: "+385 91 234 5678",
      country: "HR",
    },
    {
      email: "marco.rossi@example.com",
      firstName: "Marco",
      lastName: "Rossi",
      phone: "+39 02 1234 5678",
      country: "IT",
    },
    {
      email: "sophie.mueller@example.com",
      firstName: "Sophie",
      lastName: "Müller",
      phone: "+49 89 123456",
      country: "DE",
    },
    {
      email: "james.wright@example.com",
      firstName: "James",
      lastName: "Wright",
      phone: "+44 20 7946 0958",
      country: "GB",
    },
    {
      email: "elena.petrov@example.com",
      firstName: "Elena",
      lastName: "Petrov",
      phone: "+385 98 765 4321",
      country: "HR",
    },
  ];

  const insertedGuests: typeof schema.guests.$inferSelect[] = [];
  for (const g of guestData) {
    const [guest] = await db
      .insert(schema.guests)
      .values({ ...g, propertyId: property.id })
      .onConflictDoUpdate({
        target: [schema.guests.propertyId, schema.guests.email],
        set: { firstName: g.firstName, lastName: g.lastName, updatedAt: new Date() },
      })
      .returning();
    insertedGuests.push(guest);
  }
  console.log(`  ✓ Guests: ${insertedGuests.length} guests upserted`);

  const [ana, marco, sophie, james, elena] = insertedGuests;

  // ── Test Reservations ─────────────────────────────────────────────────────
  // Today: 2026-02-25

  type ReservationSeed = {
    code: string;
    guestId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    status: (typeof schema.reservations.$inferInsert)["status"];
    channel: (typeof schema.reservations.$inferInsert)["channel"];
    totalCents: number;
    specialRequests?: string;
    cancellationReason?: string;
  };

  const reservationData: ReservationSeed[] = [
    // Past stays — checked out
    {
      code: "SHP-HORVAT",
      guestId: ana.id,
      roomTypeId: studio.id,
      checkIn: "2026-02-05",
      checkOut: "2026-02-08",
      adults: 2,
      children: 0,
      status: "checked_out",
      channel: "direct",
      totalCents: 22500, // 3 × €75
      specialRequests: "Late check-out if possible.",
    },
    {
      code: "SHP-ROSSI1",
      guestId: marco.id,
      roomTypeId: oneBed.id,
      checkIn: "2026-01-15",
      checkOut: "2026-01-22",
      adults: 2,
      children: 1,
      status: "checked_out",
      channel: "booking_com",
      totalCents: 73500, // 7 × €105
    },
    {
      code: "SHP-MUELR1",
      guestId: sophie.id,
      roomTypeId: penthouse.id,
      checkIn: "2026-02-10",
      checkOut: "2026-02-14",
      adults: 2,
      children: 0,
      status: "checked_out",
      channel: "airbnb",
      totalCents: 88000, // 4 × €220
      specialRequests: "Anniversary trip — champagne on arrival if possible.",
    },

    // Current stay — checked in
    {
      code: "SHP-WRIGHT",
      guestId: james.id,
      roomTypeId: twoBed.id,
      checkIn: "2026-02-23",
      checkOut: "2026-03-02",
      adults: 3,
      children: 2,
      status: "checked_in",
      channel: "direct",
      totalCents: 105000, // 7 × €150
      specialRequests: "Extra towels and a cot for infant.",
    },

    // Upcoming — confirmed
    {
      code: "SHP-PETRO1",
      guestId: elena.id,
      roomTypeId: studio.id,
      checkIn: "2026-03-10",
      checkOut: "2026-03-15",
      adults: 1,
      children: 0,
      status: "confirmed",
      channel: "direct",
      totalCents: 37500, // 5 × €75
    },
    {
      code: "SHP-ROSSI2",
      guestId: marco.id,
      roomTypeId: oneBed.id,
      checkIn: "2026-04-20",
      checkOut: "2026-04-27",
      adults: 2,
      children: 0,
      status: "confirmed",
      channel: "expedia",
      totalCents: 84000, // 7 × €120 (spring rate)
    },

    // Cancelled
    {
      code: "SHP-CANCEL",
      guestId: sophie.id,
      roomTypeId: twoBed.id,
      checkIn: "2026-03-20",
      checkOut: "2026-03-25",
      adults: 4,
      children: 0,
      status: "cancelled",
      channel: "booking_com",
      totalCents: 75000, // 5 × €150
      cancellationReason: "Cancelled by guest — change of travel plans.",
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const res of reservationData) {
    // Skip if already exists
    const existing = await db.query.reservations.findFirst({
      where: eq(schema.reservations.confirmationCode, res.code),
    });
    if (existing) {
      skipped++;
      continue;
    }

    const nightCount = nights(res.checkIn, res.checkOut).length;
    const ratePerNight = Math.round(res.totalCents / nightCount);

    const [reservation] = await db
      .insert(schema.reservations)
      .values({
        propertyId: property.id,
        guestId: res.guestId,
        confirmationCode: res.code,
        checkIn: res.checkIn,
        checkOut: res.checkOut,
        nights: nightCount,
        adults: res.adults,
        children: res.children,
        status: res.status,
        channel: res.channel,
        totalCents: res.totalCents,
        currency: "EUR",
        specialRequests: res.specialRequests,
        cancellationReason: res.cancellationReason,
        cancelledAt: res.status === "cancelled" ? new Date() : undefined,
      })
      .returning();

    await db.insert(schema.reservationRooms).values({
      reservationId: reservation.id,
      roomTypeId: res.roomTypeId,
      ratePerNightCents: ratePerNight,
    });

    // Update inventory for active reservations (not cancelled)
    if (res.status !== "cancelled") {
      await incrementInventory(
        property.id,
        res.roomTypeId,
        res.checkIn,
        res.checkOut
      );
    }

    created++;
  }

  // Update guest stats
  for (const g of insertedGuests) {
    const guestReservations = await db.query.reservations.findMany({
      where: and(
        eq(schema.reservations.guestId, g.id),
        eq(schema.reservations.propertyId, property.id)
      ),
    });

    const activeStays = guestReservations.filter(
      (r) =>
        r.status === "confirmed" ||
        r.status === "checked_in" ||
        r.status === "checked_out"
    );

    const totalSpent = activeStays.reduce((sum, r) => sum + r.totalCents, 0);

    await db
      .update(schema.guests)
      .set({
        totalStays: activeStays.length,
        totalSpentCents: totalSpent,
        updatedAt: new Date(),
      })
      .where(eq(schema.guests.id, g.id));
  }

  console.log(
    `  ✓ Reservations: ${created} created, ${skipped} already existed`
  );
  console.log("\n✅ Reservation seed complete!");
}

seedReservations().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
