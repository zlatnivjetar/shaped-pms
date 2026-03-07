/**
 * Pricing engine — resolves the effective nightly rate for a given date.
 *
 * Resolution order (handled by this function):
 *   1. Highest-priority matching seasonal rate plan
 *   2. Base rate (fallback)
 *   3. Percentage discount applied on top (if any active discount matches the date)
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

export type DiscountForPricing = {
  percentage: number; // 1–100
  dateStart: string | null; // YYYY-MM-DD
  dateEnd: string | null;   // YYYY-MM-DD
  status: "active" | "inactive";
};

/**
 * Returns the best (highest) discount percentage that applies to a given date.
 * Returns 0 if no discount applies.
 */
function resolveDiscountPct(
  date: string,
  discounts: DiscountForPricing[]
): number {
  return discounts
    .filter(
      (d) =>
        d.status === "active" &&
        (d.dateStart === null || date >= d.dateStart) &&
        (d.dateEnd === null || date <= d.dateEnd)
    )
    .reduce((max, d) => Math.max(max, d.percentage), 0);
}

/**
 * Resolves the effective rate (in cents) for a single date.
 *
 * @param baseRateCents  The room type's base nightly rate (fallback)
 * @param date           Date string in YYYY-MM-DD format
 * @param ratePlans      All rate plans for this room type (any status)
 * @param discounts      Active discounts pre-filtered for this room type
 * @returns              Effective rate in cents (after discount if applicable)
 */
export function resolveRate(
  baseRateCents: number,
  date: string,
  ratePlans: RatePlanForPricing[],
  discounts: DiscountForPricing[] = []
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

  const rate =
    applicable.length > 0 ? applicable[0].rateCents : baseRateCents;

  const discountPct = resolveDiscountPct(date, discounts);
  if (discountPct > 0) {
    return Math.round(rate * (1 - discountPct / 100));
  }

  return rate;
}

/**
 * Returns the undiscounted rate for a date (ignores discounts).
 * Used to compute originalTotalCents for display.
 */
export function resolveRateWithoutDiscount(
  baseRateCents: number,
  date: string,
  ratePlans: RatePlanForPricing[]
): number {
  return resolveRate(baseRateCents, date, ratePlans, []);
}
