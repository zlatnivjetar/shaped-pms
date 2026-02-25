/**
 * Availability engine — pure functions, no side effects.
 *
 * These functions query the database and return structured availability data.
 * They are safe to call from server components and server actions.
 */

import { db } from "@/db";
import { inventory, ratePlans, roomTypes } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { resolveRate, type RatePlanForPricing } from "./pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NightlyAvailability = {
  date: string;       // YYYY-MM-DD
  available: number;  // total_units - booked_units - blocked_units
  totalUnits: number;
  rateCents: number;  // effective rate for that night
};

export type AvailabilityResult = {
  available: number;           // min available units across all nights
  nights: number;
  nightly: NightlyAvailability[];
};

export type CalendarDayData = {
  date: string;
  available: number;
  totalUnits: number;
  rateCents: number;
};

export type CalendarRoomTypeData = {
  roomTypeId: string;
  roomTypeName: string;
  baseRateCents: number;
  dates: CalendarDayData[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns an array of YYYY-MM-DD strings from startDate to endDate (both inclusive).
 */
function buildDateList(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Returns an array of YYYY-MM-DD strings from startDate (inclusive) to endDate (exclusive).
 * Used for night ranges where checkout day is not a chargeable night.
 */
function buildNightList(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (current < end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

// ─── Pure computation (exported for testing) ─────────────────────────────────

type InventoryRow = {
  date: string;
  totalUnits: number;
  bookedUnits: number;
  blockedUnits: number;
  rateOverrideCents: number | null;
};

/**
 * Computes per-night availability and rates from raw data.
 * Pure function — no DB calls, fully testable.
 */
export function computeNightly(
  nights: string[],
  inventoryRows: InventoryRow[],
  ratePlans: RatePlanForPricing[],
  baseRateCents: number
): NightlyAvailability[] {
  const inventoryByDate = new Map(inventoryRows.map((r) => [r.date, r]));

  return nights.map((date) => {
    const row = inventoryByDate.get(date);
    const totalUnits = row?.totalUnits ?? 0;
    const available = row
      ? row.totalUnits - row.bookedUnits - row.blockedUnits
      : 0;
    const rateCents =
      row?.rateOverrideCents !== null && row?.rateOverrideCents !== undefined
        ? row.rateOverrideCents
        : resolveRate(baseRateCents, date, ratePlans);

    return { date, available, totalUnits, rateCents };
  });
}

/**
 * Computes the final availability result from nightly data.
 * Pure function — no DB calls, fully testable.
 */
export function computeAvailabilityResult(
  nightly: NightlyAvailability[]
): Omit<AvailabilityResult, "nightly"> {
  if (nightly.length === 0) return { available: 0, nights: 0 };
  const minAvailable = nightly.reduce(
    (min, n) => Math.min(min, n.available),
    Infinity
  );
  return {
    available: isFinite(minAvailable) ? minAvailable : 0,
    nights: nightly.length,
  };
}

// ─── checkAvailability ────────────────────────────────────────────────────────

/**
 * Checks availability for a specific room type across a date range.
 *
 * @param propertyId  Property UUID
 * @param roomTypeId  Room type UUID
 * @param checkIn     Arrival date (YYYY-MM-DD, inclusive)
 * @param checkOut    Departure date (YYYY-MM-DD, exclusive — not a chargeable night)
 * @returns           Available unit count (minimum across all nights) + per-night detail
 */
export async function checkAvailability(
  propertyId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): Promise<AvailabilityResult> {
  const nights = buildNightList(checkIn, checkOut);

  if (nights.length === 0) {
    return { available: 0, nights: 0, nightly: [] };
  }

  const [inventoryRows, activePlans, [roomType]] = await Promise.all([
    db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.propertyId, propertyId),
          eq(inventory.roomTypeId, roomTypeId),
          gte(inventory.date, checkIn),
          lte(inventory.date, nights[nights.length - 1])
        )
      ),
    db
      .select()
      .from(ratePlans)
      .where(
        and(
          eq(ratePlans.propertyId, propertyId),
          eq(ratePlans.roomTypeId, roomTypeId),
          eq(ratePlans.status, "active")
        )
      ),
    db
      .select({ baseRateCents: roomTypes.baseRateCents })
      .from(roomTypes)
      .where(eq(roomTypes.id, roomTypeId)),
  ]);

  const baseRate = roomType?.baseRateCents ?? 0;
  const plansForPricing: RatePlanForPricing[] = activePlans.map((p) => ({
    id: p.id,
    type: p.type,
    dateStart: p.dateStart,
    dateEnd: p.dateEnd,
    rateCents: p.rateCents,
    priority: p.priority,
    status: p.status,
  }));

  const nightly = computeNightly(nights, inventoryRows, plansForPricing, baseRate);
  const { available } = computeAvailabilityResult(nightly);

  return { available, nights: nightly.length, nightly };
}

// ─── getCalendarAvailability ──────────────────────────────────────────────────

/**
 * Returns availability data for all room types in a property across a date range.
 * Used to render the availability calendar.
 *
 * @param propertyId  Property UUID
 * @param startDate   First date to include (YYYY-MM-DD, inclusive)
 * @param endDate     Last date to include (YYYY-MM-DD, inclusive)
 * @returns           Per-room-type, per-date availability and rate data
 */
export async function getCalendarAvailability(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<CalendarRoomTypeData[]> {
  const [allRoomTypes, inventoryRows, allRatePlans] = await Promise.all([
    db
      .select()
      .from(roomTypes)
      .where(
        and(eq(roomTypes.propertyId, propertyId), eq(roomTypes.status, "active"))
      ),
    db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.propertyId, propertyId),
          gte(inventory.date, startDate),
          lte(inventory.date, endDate)
        )
      ),
    db
      .select()
      .from(ratePlans)
      .where(
        and(
          eq(ratePlans.propertyId, propertyId),
          eq(ratePlans.status, "active")
        )
      ),
  ]);

  return allRoomTypes.map((rt) => {
    const rtInventory = inventoryRows.filter((r) => r.roomTypeId === rt.id);
    const rtPlans: RatePlanForPricing[] = allRatePlans
      .filter((p) => p.roomTypeId === rt.id)
      .map((p) => ({
        id: p.id,
        type: p.type,
        dateStart: p.dateStart,
        dateEnd: p.dateEnd,
        rateCents: p.rateCents,
        priority: p.priority,
        status: p.status,
      }));

    const dateDates = buildDateList(startDate, endDate);
    const dateCells = computeNightly(dateDates, rtInventory, rtPlans, rt.baseRateCents);

    return {
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      baseRateCents: rt.baseRateCents,
      dates: dateCells,
    };
  });
}

