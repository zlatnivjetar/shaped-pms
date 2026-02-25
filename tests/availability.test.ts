import { describe, it, expect } from "vitest";
import { computeNightly, computeAvailabilityResult } from "@/lib/availability";
import type { RatePlanForPricing } from "@/lib/pricing";

const BASE_RATE = 10000; // €100/night
const SUMMER_RATE = 15000; // €150/night

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inv(date: string, total: number, booked = 0, blocked = 0, override: number | null = null) {
  return { date, totalUnits: total, bookedUnits: booked, blockedUnits: blocked, rateOverrideCents: override };
}

function plan(overrides: Partial<RatePlanForPricing> = {}): RatePlanForPricing {
  return {
    id: "p1",
    type: "seasonal",
    dateStart: "2026-06-01",
    dateEnd: "2026-08-31",
    rateCents: SUMMER_RATE,
    priority: 0,
    status: "active",
    ...overrides,
  };
}

function nights(from: string, to: string): string[] {
  const result: string[] = [];
  const current = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (current < end) {
    result.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

// ─── computeNightly ───────────────────────────────────────────────────────────

describe("computeNightly", () => {
  it("single-night stay — full availability", () => {
    const rows = [inv("2026-03-10", 5)];
    const result = computeNightly(["2026-03-10"], rows, [], BASE_RATE);
    expect(result).toHaveLength(1);
    expect(result[0].available).toBe(5);
    expect(result[0].rateCents).toBe(BASE_RATE);
  });

  it("single-night stay — returns base rate when no plans match", () => {
    const result = computeNightly(["2026-03-10"], [inv("2026-03-10", 3)], [plan()], BASE_RATE);
    expect(result[0].rateCents).toBe(BASE_RATE);
  });

  it("single-night stay — applies matching seasonal rate", () => {
    const result = computeNightly(["2026-07-10"], [inv("2026-07-10", 3)], [plan()], BASE_RATE);
    expect(result[0].rateCents).toBe(SUMMER_RATE);
  });

  it("fully booked — available = 0", () => {
    const rows = [inv("2026-07-15", 3, 3)]; // 3 booked of 3
    const result = computeNightly(["2026-07-15"], rows, [], BASE_RATE);
    expect(result[0].available).toBe(0);
  });

  it("blocked rooms reduce availability", () => {
    const rows = [inv("2026-07-15", 5, 2, 1)]; // 2 booked, 1 blocked of 5
    const result = computeNightly(["2026-07-15"], rows, [], BASE_RATE);
    expect(result[0].available).toBe(2);
  });

  it("rate override takes precedence over rate plans and base rate", () => {
    const rows = [inv("2026-07-15", 3, 0, 0, 9900)]; // override: €99
    const result = computeNightly(["2026-07-15"], rows, [plan()], BASE_RATE);
    expect(result[0].rateCents).toBe(9900);
  });

  it("rate override of 0 is respected (not treated as null)", () => {
    const rows = [inv("2026-07-15", 3, 0, 0, 0)];
    const result = computeNightly(["2026-07-15"], rows, [plan()], BASE_RATE);
    expect(result[0].rateCents).toBe(0);
  });

  it("missing inventory row yields 0 availability", () => {
    const result = computeNightly(["2026-03-10"], [], [], BASE_RATE);
    expect(result[0].available).toBe(0);
  });

  it("30-night stay — computes correct count and rates per night", () => {
    const nightList = nights("2026-06-01", "2026-07-01"); // 30 nights
    expect(nightList).toHaveLength(30);
    const rows = nightList.map((d) => inv(d, 4));
    const result = computeNightly(nightList, rows, [plan()], BASE_RATE);
    expect(result).toHaveLength(30);
    result.forEach((n) => {
      expect(n.available).toBe(4);
      expect(n.rateCents).toBe(SUMMER_RATE); // all within Jun 1 – Aug 31
    });
  });

  it("30-night stay spanning season boundary — correct rate per side", () => {
    const nightList = nights("2026-05-17", "2026-06-16"); // 30 nights
    const rows = nightList.map((d) => inv(d, 3));
    const result = computeNightly(nightList, rows, [plan()], BASE_RATE);
    // May 17–31 = base rate, Jun 1–15 = summer rate
    const mayNights = result.filter((n) => n.date < "2026-06-01");
    const junNights = result.filter((n) => n.date >= "2026-06-01");
    mayNights.forEach((n) => expect(n.rateCents).toBe(BASE_RATE));
    junNights.forEach((n) => expect(n.rateCents).toBe(SUMMER_RATE));
  });
});

// ─── computeAvailabilityResult ────────────────────────────────────────────────

describe("computeAvailabilityResult", () => {
  it("returns minimum available across all nights", () => {
    const nightly = [
      { date: "2026-06-01", available: 5, totalUnits: 5, rateCents: 10000 },
      { date: "2026-06-02", available: 2, totalUnits: 5, rateCents: 10000 }, // bottleneck
      { date: "2026-06-03", available: 4, totalUnits: 5, rateCents: 10000 },
    ];
    const { available } = computeAvailabilityResult(nightly);
    expect(available).toBe(2);
  });

  it("returns 0 when fully booked on any night", () => {
    const nightly = [
      { date: "2026-06-01", available: 3, totalUnits: 3, rateCents: 10000 },
      { date: "2026-06-02", available: 0, totalUnits: 3, rateCents: 10000 },
    ];
    const { available } = computeAvailabilityResult(nightly);
    expect(available).toBe(0);
  });

  it("returns correct nights count", () => {
    const nightly = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-06-0${i + 1}`,
      available: 3,
      totalUnits: 3,
      rateCents: 10000,
    }));
    const { nights } = computeAvailabilityResult(nightly);
    expect(nights).toBe(7);
  });

  it("handles empty nightly array", () => {
    const result = computeAvailabilityResult([]);
    expect(result.available).toBe(0);
    expect(result.nights).toBe(0);
  });
});
