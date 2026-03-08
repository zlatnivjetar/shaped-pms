import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, inventory } from "@/db/schema";
import { eq, and, lt, isNotNull, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reservations stuck in "pending" for longer than this are considered abandoned
const ABANDONED_THRESHOLD_MINUTES = 15;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - ABANDONED_THRESHOLD_MINUTES);

  // Find all pending reservations older than the threshold
  const abandoned = await db.query.reservations.findMany({
    where: and(
      eq(reservations.status, "pending"),
      isNotNull(reservations.checkoutStartedAt),
      lt(reservations.checkoutStartedAt, cutoff)
    ),
    with: {
      reservationRooms: true,
    },
  });

  if (abandoned.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  let cleaned = 0;

  for (const res of abandoned) {
    // Cancel the reservation
    await db
      .update(reservations)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: "abandoned",
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, res.id));

    // Rollback inventory for each reservation room
    for (const rr of res.reservationRooms) {
      const nights = buildNightList(res.checkIn, res.checkOut);
      if (nights.length > 0) {
        await db
          .update(inventory)
          .set({
            bookedUnits: sql`GREATEST(${inventory.bookedUnits} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventory.propertyId, res.propertyId),
              eq(inventory.roomTypeId, rr.roomTypeId),
              inArray(inventory.date, nights)
            )
          );
      }
    }

    cleaned++;
  }

  return NextResponse.json({ cleaned });
}

function buildNightList(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const current = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (current < end) {
    nights.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return nights;
}
