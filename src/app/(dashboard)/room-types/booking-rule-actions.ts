"use server";

import { db } from "@/db";
import { bookingRules, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6];

const bookingRuleSchema = z.object({
  minNights: z.coerce.number().int().min(1).optional().or(z.literal("")),
  maxNights: z.coerce.number().int().min(1).optional().or(z.literal("")),
  dateStart: z.string().optional().or(z.literal("")),
  dateEnd: z.string().optional().or(z.literal("")),
  allowedCheckInDays: z
    .array(z.coerce.number().int().refine((d) => DAY_VALUES.includes(d)))
    .optional(),
  allowedCheckOutDays: z
    .array(z.coerce.number().int().refine((d) => DAY_VALUES.includes(d)))
    .optional(),
});

export type BookingRuleFormState = {
  success?: boolean;
  error?: string;
};

async function getPropertyId(): Promise<string> {
  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .limit(1);
  if (!property) throw new Error("No property found");
  return property.id;
}

export async function createBookingRule(
  roomTypeId: string,
  prevState: BookingRuleFormState,
  formData: FormData
): Promise<BookingRuleFormState> {
  const raw = {
    minNights: formData.get("minNights") || undefined,
    maxNights: formData.get("maxNights") || undefined,
    dateStart: formData.get("dateStart") || undefined,
    dateEnd: formData.get("dateEnd") || undefined,
    allowedCheckInDays: formData.getAll("allowedCheckInDays"),
    allowedCheckOutDays: formData.getAll("allowedCheckOutDays"),
  };

  const parsed = bookingRuleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid rule data. Please check your inputs." };
  }

  const data = parsed.data;
  const propertyId = await getPropertyId();

  const minNights =
    data.minNights !== "" && data.minNights !== undefined
      ? Number(data.minNights)
      : null;
  const maxNights =
    data.maxNights !== "" && data.maxNights !== undefined
      ? Number(data.maxNights)
      : null;

  if (minNights !== null && maxNights !== null && minNights > maxNights) {
    return { error: "Minimum nights cannot exceed maximum nights." };
  }

  await db.insert(bookingRules).values({
    propertyId,
    roomTypeId,
    minNights,
    maxNights,
    dateStart: data.dateStart || null,
    dateEnd: data.dateEnd || null,
    allowedCheckInDays:
      data.allowedCheckInDays && data.allowedCheckInDays.length > 0
        ? (data.allowedCheckInDays as number[])
        : null,
    allowedCheckOutDays:
      data.allowedCheckOutDays && data.allowedCheckOutDays.length > 0
        ? (data.allowedCheckOutDays as number[])
        : null,
  });

  revalidatePath("/settings/room-types");
  return { success: true };
}

export async function deleteBookingRule(ruleId: string): Promise<void> {
  await db.delete(bookingRules).where(eq(bookingRules.id, ruleId));
  revalidatePath("/settings/room-types");
}
