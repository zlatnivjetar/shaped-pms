import { describe, it, expect } from "vitest";
import { resolveRate, type RatePlanForPricing, type DiscountForPricing } from "@/lib/pricing";

const BASE_RATE = 10000; // €100/night

function plan(overrides: Partial<RatePlanForPricing> = {}): RatePlanForPricing {
  return {
    id: "p1",
    type: "seasonal",
    dateStart: "2026-06-01",
    dateEnd: "2026-08-31",
    rateCents: 15000,
    priority: 0,
    status: "active",
    ...overrides,
  };
}

describe("resolveRate", () => {
  it("returns base rate when no rate plans", () => {
    expect(resolveRate(BASE_RATE, "2026-03-15", [])).toBe(BASE_RATE);
  });

  it("returns base rate when no plans match the date", () => {
    const plans = [plan({ dateStart: "2026-06-01", dateEnd: "2026-08-31" })];
    expect(resolveRate(BASE_RATE, "2026-05-31", plans)).toBe(BASE_RATE);
    expect(resolveRate(BASE_RATE, "2026-09-01", plans)).toBe(BASE_RATE);
  });

  it("applies a matching seasonal rate plan", () => {
    const plans = [plan({ rateCents: 15000 })];
    expect(resolveRate(BASE_RATE, "2026-07-15", plans)).toBe(15000);
  });

  it("applies plan on exact boundary dates", () => {
    const plans = [plan({ dateStart: "2026-06-01", dateEnd: "2026-08-31" })];
    expect(resolveRate(BASE_RATE, "2026-06-01", plans)).toBe(15000);
    expect(resolveRate(BASE_RATE, "2026-08-31", plans)).toBe(15000);
  });

  it("ignores inactive plans", () => {
    const plans = [plan({ status: "inactive", rateCents: 15000 })];
    expect(resolveRate(BASE_RATE, "2026-07-15", plans)).toBe(BASE_RATE);
  });

  it("ignores length_of_stay and occupancy plan types (not yet implemented)", () => {
    const plans = [
      plan({ type: "length_of_stay", rateCents: 5000 }),
      plan({ type: "occupancy", rateCents: 5000 }),
    ];
    expect(resolveRate(BASE_RATE, "2026-07-15", plans)).toBe(BASE_RATE);
  });

  it("selects highest-priority plan when multiple plans overlap", () => {
    const plans = [
      plan({ id: "low", priority: 0, rateCents: 12000 }),
      plan({ id: "high", priority: 10, rateCents: 18000 }),
      plan({ id: "mid", priority: 5, rateCents: 15000 }),
    ];
    expect(resolveRate(BASE_RATE, "2026-07-15", plans)).toBe(18000);
  });

  it("handles zero-cent rate plan (valid override)", () => {
    const plans = [plan({ rateCents: 0, priority: 1 })];
    expect(resolveRate(BASE_RATE, "2026-07-15", plans)).toBe(0);
  });

  it("handles plans with null date boundaries as non-matching", () => {
    const plans = [plan({ dateStart: null, dateEnd: null })];
    expect(resolveRate(BASE_RATE, "2026-07-15", plans)).toBe(BASE_RATE);
  });
});

// ─── Discount tests ───────────────────────────────────────────────────────────

function discount(overrides: Partial<DiscountForPricing> = {}): DiscountForPricing {
  return {
    percentage: 10,
    dateStart: null,
    dateEnd: null,
    status: "active",
    ...overrides,
  };
}

describe("resolveRate with discounts", () => {
  it("no discount when discounts array is empty", () => {
    expect(resolveRate(BASE_RATE, "2026-07-15", [], [])).toBe(BASE_RATE);
  });

  it("applies a percentage discount to the base rate", () => {
    const result = resolveRate(BASE_RATE, "2026-07-15", [], [discount({ percentage: 10 })]);
    expect(result).toBe(9000); // 10000 * 0.90
  });

  it("applies a percentage discount to a matching rate plan", () => {
    const plans = [plan({ rateCents: 15000 })]; // summer plan
    const result = resolveRate(BASE_RATE, "2026-07-15", plans, [discount({ percentage: 20 })]);
    expect(result).toBe(12000); // 15000 * 0.80
  });

  it("ignores inactive discounts", () => {
    const result = resolveRate(BASE_RATE, "2026-07-15", [], [discount({ status: "inactive" })]);
    expect(result).toBe(BASE_RATE);
  });

  it("ignores discounts outside their date range", () => {
    const d = discount({ dateStart: "2026-08-01", dateEnd: "2026-08-31" });
    expect(resolveRate(BASE_RATE, "2026-07-15", [], [d])).toBe(BASE_RATE);
    expect(resolveRate(BASE_RATE, "2026-08-15", [], [d])).toBe(9000);
  });

  it("uses the highest discount when multiple apply", () => {
    const discounts = [
      discount({ percentage: 10 }),
      discount({ percentage: 25 }),
      discount({ percentage: 15 }),
    ];
    const result = resolveRate(BASE_RATE, "2026-07-15", [], discounts);
    expect(result).toBe(7500); // 10000 * 0.75
  });

  it("rounds discounted rate to nearest cent", () => {
    // 10000 * (1 - 33/100) = 6700 (exact)
    const result = resolveRate(10000, "2026-07-15", [], [discount({ percentage: 33 })]);
    expect(result).toBe(6700);
  });

  it("discount applies on boundary dates", () => {
    const d = discount({ dateStart: "2026-07-01", dateEnd: "2026-07-31", percentage: 10 });
    expect(resolveRate(BASE_RATE, "2026-07-01", [], [d])).toBe(9000);
    expect(resolveRate(BASE_RATE, "2026-07-31", [], [d])).toBe(9000);
    expect(resolveRate(BASE_RATE, "2026-06-30", [], [d])).toBe(BASE_RATE);
    expect(resolveRate(BASE_RATE, "2026-08-01", [], [d])).toBe(BASE_RATE);
  });
});
