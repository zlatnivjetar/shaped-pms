import { db } from "@/db";
import { reservations, inventory } from "@/db/schema";
import { eq, and, count, sum, notInArray, desc, sql, gte, lt } from "drizzle-orm";

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function occupancyPct(booked: string | null, total: string | null) {
  const t = Number(total ?? 0);
  return t > 0 ? Math.round((Number(booked ?? 0) / t) * 100) : 0;
}

export async function getDashboardKPIs(propertyId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const in7Days = addDays(7);
  const in30Days = addDays(30);

  const [arrivalsResult, departuresResult, inHouseResult, occ7Result, occ30Result] =
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
        .select({ booked: sum(inventory.bookedUnits), total: sum(inventory.totalUnits) })
        .from(inventory)
        .where(
          and(
            eq(inventory.propertyId, propertyId),
            gte(inventory.date, today),
            lt(inventory.date, in7Days)
          )
        ),
      db
        .select({ booked: sum(inventory.bookedUnits), total: sum(inventory.totalUnits) })
        .from(inventory)
        .where(
          and(
            eq(inventory.propertyId, propertyId),
            gte(inventory.date, today),
            lt(inventory.date, in30Days)
          )
        ),
    ]);

  return {
    arrivals: Number(arrivalsResult[0]?.count ?? 0),
    departures: Number(departuresResult[0]?.count ?? 0),
    inHouse: Number(inHouseResult[0]?.count ?? 0),
    occupancy7Days: occupancyPct(occ7Result[0]?.booked, occ7Result[0]?.total),
    occupancy30Days: occupancyPct(occ30Result[0]?.booked, occ30Result[0]?.total),
  };
}

export async function getRecentActivity(propertyId: string) {
  return db.query.reservations.findMany({
    where: eq(reservations.propertyId, propertyId),
    with: { guest: true },
    orderBy: [desc(reservations.updatedAt)],
    limit: 10,
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
