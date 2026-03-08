"use server";

import { db } from "@/db";
import { ratePlans, inventory, properties, discounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const ratePlanSchema = z
  .object({
    roomTypeId: z.string().uuid("Select a room type"),
    name: z.string().min(1, "Name is required"),
    dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
    dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
    // Input as euros (e.g. "75.00"), stored as cents
    rateEuros: z.coerce
      .number()
      .min(0, "Rate must be 0 or more"),
    priority: z.coerce.number().int().min(0).default(0),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .refine((d) => d.dateStart <= d.dateEnd, {
    message: "End date must be on or after start date",
    path: ["dateEnd"],
  });

export type RatePlanFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPropertyId(): Promise<string> {
  const [p] = await db.select({ id: properties.id }).from(properties).limit(1);
  if (!p) throw new Error("No property found");
  return p.id;
}

function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

// ─── Rate Plan CRUD ───────────────────────────────────────────────────────────

export async function createRatePlan(
  prevState: RatePlanFormState,
  formData: FormData
): Promise<RatePlanFormState> {
  const parsed = ratePlanSchema.safeParse({
    roomTypeId: formData.get("roomTypeId"),
    name: formData.get("name"),
    dateStart: formData.get("dateStart"),
    dateEnd: formData.get("dateEnd"),
    rateEuros: formData.get("rateEuros"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const propertyId = await getPropertyId();
  const { roomTypeId, name, dateStart, dateEnd, rateEuros, priority, status } =
    parsed.data;

  await db.insert(ratePlans).values({
    propertyId,
    roomTypeId,
    name,
    type: "seasonal",
    dateStart,
    dateEnd,
    rateCents: eurosToCents(rateEuros),
    priority,
    status,
  });

  revalidatePath("/rates");
  return { success: true };
}

export async function updateRatePlan(
  planId: string,
  prevState: RatePlanFormState,
  formData: FormData
): Promise<RatePlanFormState> {
  const parsed = ratePlanSchema.safeParse({
    roomTypeId: formData.get("roomTypeId"),
    name: formData.get("name"),
    dateStart: formData.get("dateStart"),
    dateEnd: formData.get("dateEnd"),
    rateEuros: formData.get("rateEuros"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { roomTypeId, name, dateStart, dateEnd, rateEuros, priority, status } =
    parsed.data;

  await db
    .update(ratePlans)
    .set({
      roomTypeId,
      name,
      dateStart,
      dateEnd,
      rateCents: eurosToCents(rateEuros),
      priority,
      status,
      updatedAt: new Date(),
    })
    .where(eq(ratePlans.id, planId));

  revalidatePath("/rates");
  return { success: true };
}

export async function deleteRatePlan(planId: string): Promise<void> {
  await db.delete(ratePlans).where(eq(ratePlans.id, planId));
  revalidatePath("/rates");
}

// ─── Discount CRUD ────────────────────────────────────────────────────────────

const discountSchema = z
  .object({
    roomTypeId: z.string().uuid().optional().or(z.literal("")).or(z.literal("all")),
    name: z.string().min(1, "Name is required"),
    percentage: z.coerce
      .number()
      .int()
      .min(1, "Percentage must be at least 1")
      .max(100, "Percentage cannot exceed 100"),
    dateStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date")
      .optional()
      .or(z.literal("")),
    dateEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date")
      .optional()
      .or(z.literal("")),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .refine(
    (d) => {
      if (d.dateStart && d.dateEnd) return d.dateStart <= d.dateEnd;
      return true;
    },
    { message: "End date must be on or after start date", path: ["dateEnd"] }
  );

export type DiscountFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createDiscount(
  prevState: DiscountFormState,
  formData: FormData
): Promise<DiscountFormState> {
  const parsed = discountSchema.safeParse({
    roomTypeId: formData.get("roomTypeId"),
    name: formData.get("name"),
    percentage: formData.get("percentage"),
    dateStart: formData.get("dateStart"),
    dateEnd: formData.get("dateEnd"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const propertyId = await getPropertyId();
  const { roomTypeId, name, percentage, dateStart, dateEnd, status } = parsed.data;

  await db.insert(discounts).values({
    propertyId,
    roomTypeId: roomTypeId && roomTypeId !== "all" ? roomTypeId : null,
    name,
    percentage,
    dateStart: dateStart || null,
    dateEnd: dateEnd || null,
    status,
  });

  revalidatePath("/rates");
  return { success: true };
}

export async function updateDiscount(
  discountId: string,
  prevState: DiscountFormState,
  formData: FormData
): Promise<DiscountFormState> {
  const parsed = discountSchema.safeParse({
    roomTypeId: formData.get("roomTypeId"),
    name: formData.get("name"),
    percentage: formData.get("percentage"),
    dateStart: formData.get("dateStart"),
    dateEnd: formData.get("dateEnd"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { roomTypeId, name, percentage, dateStart, dateEnd, status } = parsed.data;

  await db
    .update(discounts)
    .set({
      roomTypeId: roomTypeId && roomTypeId !== "all" ? roomTypeId : null,
      name,
      percentage,
      dateStart: dateStart || null,
      dateEnd: dateEnd || null,
      status,
      updatedAt: new Date(),
    })
    .where(eq(discounts.id, discountId));

  revalidatePath("/rates");
  return { success: true };
}

export async function deleteDiscount(discountId: string): Promise<void> {
  await db.delete(discounts).where(eq(discounts.id, discountId));
  revalidatePath("/rates");
}

// ─── Rate Override ────────────────────────────────────────────────────────────

/**
 * Sets or clears a manual per-date rate override on an inventory row.
 * @param rateCents  Pass null to clear the override (revert to rate plan / base rate).
 */
export async function setRateOverride(
  propertyId: string,
  roomTypeId: string,
  date: string,
  rateCents: number | null
): Promise<void> {
  await db
    .update(inventory)
    .set({ rateOverrideCents: rateCents, updatedAt: new Date() })
    .where(
      and(
        eq(inventory.propertyId, propertyId),
        eq(inventory.roomTypeId, roomTypeId),
        eq(inventory.date, date)
      )
    );

  revalidatePath("/rates");
}
