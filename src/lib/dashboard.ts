import { db } from "@/db";
import { reservations, rooms } from "@/db/schema";
import { eq, and, count, sum, notInArray, desc, sql } from "drizzle-orm";

export async function getDashboardKPIs(propertyId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const [arrivalsResult, departuresResult, inHouseResult, totalRoomsResult] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.propertyId, propertyId),
            eq(reservations.checkIn, today),
            eq(reservations.status, "confirmed")
          )
        ),
      db
        .select({ count: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.propertyId, propertyId),
            eq(reservations.checkOut, today),
            eq(reservations.status, "checked_in")
          )
        ),
      db
        .select({ count: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.propertyId, propertyId),
            eq(reservations.status, "checked_in")
          )
        ),
      db
        .select({ count: count() })
        .from(rooms)
        .where(eq(rooms.propertyId, propertyId)),
    ]);

  const arrivals = arrivalsResult[0]?.count ?? 0;
  const departures = departuresResult[0]?.count ?? 0;
  const inHouse = inHouseResult[0]?.count ?? 0;
  const totalRooms = totalRoomsResult[0]?.count ?? 0;
  const occupancyPct =
    totalRooms > 0 ? Math.round((Number(inHouse) / Number(totalRooms)) * 100) : 0;

  return {
    arrivals: Number(arrivals),
    departures: Number(departures),
    inHouse: Number(inHouse),
    occupancyPct,
  };
}

export async function getRecentBookings(propertyId: string) {
  return db.query.reservations.findMany({
    where: eq(reservations.propertyId, propertyId),
    with: { guest: true },
    orderBy: [desc(reservations.createdAt)],
    limit: 8,
  });
}

export async function getRevenueMetrics(propertyId: string) {
  const [thisMonthResult, lastMonthResult] = await Promise.all([
    db
      .select({ total: sum(reservations.totalCents) })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          notInArray(reservations.status, ["cancelled", "no_show"]),
          sql`DATE_TRUNC('month', ${reservations.checkIn}::timestamp) = DATE_TRUNC('month', CURRENT_DATE)`
        )
      ),
    db
      .select({ total: sum(reservations.totalCents) })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          notInArray(reservations.status, ["cancelled", "no_show"]),
          sql`DATE_TRUNC('month', ${reservations.checkIn}::timestamp) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`
        )
      ),
  ]);

  return {
    thisMonthCents: Number(thisMonthResult[0]?.total ?? 0),
    lastMonthCents: Number(lastMonthResult[0]?.total ?? 0),
  };
}
