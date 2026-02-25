"use server";

import { db } from "@/db";
import { ratePlans, inventory, properties } from "@/db/schema";
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
