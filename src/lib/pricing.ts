/**
 * Pricing engine — resolves the effective nightly rate for a given date.
 *
 * Resolution order (handled by this function):
 *   1. Highest-priority matching seasonal rate plan
 *   2. Base rate (fallback)
 *
 * NOTE: The caller (availability engine) is responsible for checking
 * inventory.rate_override_cents BEFORE calling resolveRate — that takes
 * precedence over everything here.
 *
 * TODO: length_of_stay and occupancy rate plan types are not yet implemented.
 * To add them, resolveRate() will need additional params: `nights: number`
 * and `occupancy: number`. See CLAUDE.md schema for rate_plans.type enum.
 */

export type RatePlanForPricing = {
  id: string;
  type: "seasonal" | "length_of_stay" | "occupancy";
  dateStart: string | null; // YYYY-MM-DD
  dateEnd: string | null;   // YYYY-MM-DD
  rateCents: number;
  priority: number;
  status: "active" | "inactive";
};

/**
 * Resolves the effective rate (in cents) for a single date.
 *
 * @param baseRateCents  The room type's base nightly rate (fallback)
 * @param date           Date string in YYYY-MM-DD format
 * @param ratePlans      All rate plans for this room type (any status)
 * @returns              Effective rate in cents
 */
export function resolveRate(
  baseRateCents: number,
  date: string,
  ratePlans: RatePlanForPricing[]
): number {
  const applicable = ratePlans
    .filter(
      (p) =>
        p.status === "active" &&
        p.type === "seasonal" &&
        p.dateStart !== null &&
        p.dateEnd !== null &&
        date >= p.dateStart! &&
        date <= p.dateEnd!
    )
    .sort((a, b) => b.priority - a.priority); // highest priority first

  if (applicable.length > 0) {
    return applicable[0].rateCents;
  }

  return baseRateCents;
}
