import { describe, it, expect } from "vitest";
import { resolveRate, type RatePlanForPricing } from "@/lib/pricing";

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
