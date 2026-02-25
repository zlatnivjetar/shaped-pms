"use server";

import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updatePropertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  timezone: z.string().min(1),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  depositPercentage: z.coerce.number().int().min(0).max(100),
  paymentMode: z.enum(["full_at_booking", "deposit_at_booking"]),
});

export type UpdatePropertyState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProperty(
  propertyId: string,
  prevState: UpdatePropertyState,
  formData: FormData
): Promise<UpdatePropertyState> {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    checkInTime: formData.get("checkInTime"),
    checkOutTime: formData.get("checkOutTime"),
    depositPercentage: formData.get("depositPercentage"),
    paymentMode: formData.get("paymentMode"),
  };

  const parsed = updatePropertySchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  await db
    .update(properties)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
      currency: data.currency,
      timezone: data.timezone,
      checkInTime: data.checkInTime || null,
      checkOutTime: data.checkOutTime || null,
      depositPercentage: data.depositPercentage,
      paymentMode: data.paymentMode,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propertyId));

  revalidatePath("/settings/property");
  revalidatePath("/dashboard");

  return { success: true };
}
