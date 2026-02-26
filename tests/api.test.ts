import { describe, it, expect } from "vitest";
import { apiResponse, apiError } from "@/lib/api-utils";
import { apiReservationSchema } from "@/lib/validators";

// ─── apiResponse / apiError ───────────────────────────────────────────────────

describe("apiResponse", () => {
  it("defaults to HTTP 200", async () => {
    const res = apiResponse({ id: "abc" });
    expect(res.status).toBe(200);
  });

  it("accepts a custom status code", async () => {
    const res = apiResponse({ id: "abc" }, 201);
    expect(res.status).toBe(201);
  });

  it("wraps data in { data, meta }", async () => {
    const res = apiResponse({ name: "Preelook" });
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.data).toEqual({ name: "Preelook" });
    expect(body).toHaveProperty("meta.timestamp");
  });

  it("includes a valid ISO timestamp in meta", async () => {
    const before = Date.now();
    const res = apiResponse({});
    const after = Date.now();
    const body = await res.json();
    const ts = new Date(body.meta.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("does not include an error key", async () => {
    const body = await apiResponse({ ok: true }).json();
    expect(body).not.toHaveProperty("error");
  });

  it("serialises arrays correctly", async () => {
    const body = await apiResponse([1, 2, 3]).json();
    expect(body.data).toEqual([1, 2, 3]);
  });
});

describe("apiError", () => {
  it("uses the provided status code", () => {
    expect(apiError("Not found", 404).status).toBe(404);
    expect(apiError("Unauthorized", 401).status).toBe(401);
    expect(apiError("Bad request", 400).status).toBe(400);
    expect(apiError("Conflict", 409).status).toBe(409);
  });

  it("wraps message in { error, meta }", async () => {
    const body = await apiError("Something went wrong", 500).json();
    expect(body.error).toBe("Something went wrong");
    expect(body).toHaveProperty("meta.timestamp");
  });

  it("does not include a data key", async () => {
    const body = await apiError("Nope", 400).json();
    expect(body).not.toHaveProperty("data");
  });
});

// ─── apiReservationSchema ─────────────────────────────────────────────────────

const VALID_INPUT = {
  propertySlug: "preelook-apartments",
  roomTypeId: "550e8400-e29b-41d4-a716-446655440000",
  checkIn: "2026-07-01",
  checkOut: "2026-07-05",
  adults: 2,
  children: 0,
  channel: "booking_com",
  guest: {
    firstName: "Ana",
    lastName: "Kovač",
    email: "ana@example.com",
    phone: "+385911234567",
  },
  specialRequests: "Late check-in please",
};

describe("apiReservationSchema", () => {
  it("accepts a fully valid input", () => {
    const result = apiReservationSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  it("defaults channel to 'direct' when omitted", () => {
    const { channel: _, ...rest } = VALID_INPUT;
    const result = apiReservationSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.channel).toBe("direct");
  });

  it("defaults children to 0 when omitted", () => {
    const { children: _, ...rest } = VALID_INPUT;
    const result = apiReservationSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.children).toBe(0);
  });

  it("allows phone and specialRequests to be omitted", () => {
    const input = {
      ...VALID_INPUT,
      guest: { firstName: "Ana", lastName: "Kovač", email: "ana@example.com" },
      specialRequests: undefined,
    };
    expect(apiReservationSchema.safeParse(input).success).toBe(true);
  });

  it("rejects an invalid roomTypeId (not a UUID)", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, roomTypeId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed checkIn date", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, checkIn: "01-07-2026" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed checkOut date", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, checkOut: "July 5th" });
    expect(result.success).toBe(false);
  });

  it("rejects adults < 1", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, adults: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects adults > 10", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, adults: 11 });
    expect(result.success).toBe(false);
  });

  it("rejects children < 0", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, children: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown channel value", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, channel: "opaque_travel" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid channel values", () => {
    const channels = ["direct", "booking_com", "airbnb", "expedia", "walk_in", "phone"] as const;
    for (const channel of channels) {
      const result = apiReservationSchema.safeParse({ ...VALID_INPUT, channel });
      expect(result.success, `channel '${channel}' should be valid`).toBe(true);
    }
  });

  it("rejects a missing guest object", () => {
    const { guest: _, ...rest } = VALID_INPUT;
    const result = apiReservationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid guest email", () => {
    const result = apiReservationSchema.safeParse({
      ...VALID_INPUT,
      guest: { ...VALID_INPUT.guest, email: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty guest firstName", () => {
    const result = apiReservationSchema.safeParse({
      ...VALID_INPUT,
      guest: { ...VALID_INPUT.guest, firstName: "" },
    });
    expect(result.success).toBe(false);
  });

  it("coerces string adults to number", () => {
    const result = apiReservationSchema.safeParse({ ...VALID_INPUT, adults: "2" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.adults).toBe(2);
  });

  it("rejects missing propertySlug", () => {
    const { propertySlug: _, ...rest } = VALID_INPUT;
    const result = apiReservationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
