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
  paymentMode: z.enum(["full_at_booking", "deposit_at_booking", "scheduled"]),
  scheduledChargeThresholdDays: z.coerce.number().int().min(1).max(365).optional(),
  cancellationPolicy: z.enum(["flexible", "moderate", "strict"]),
  cancellationDeadlineDays: z.coerce.number().int().min(1).max(365),
  // M16 branding fields
  tagline: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  mapsUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  latitude: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(-90).max(90).optional()
  ),
  longitude: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(-180).max(180).optional()
  ),
  checkInInstructions: z.string().optional(),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
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
    scheduledChargeThresholdDays: formData.get("scheduledChargeThresholdDays") || undefined,
    cancellationPolicy: formData.get("cancellationPolicy"),
    cancellationDeadlineDays: formData.get("cancellationDeadlineDays"),
    tagline: formData.get("tagline"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    logoUrl: formData.get("logoUrl"),
    mapsUrl: formData.get("mapsUrl"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    checkInInstructions: formData.get("checkInInstructions"),
    websiteUrl: formData.get("websiteUrl"),
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
      scheduledChargeThresholdDays: data.scheduledChargeThresholdDays ?? 7,
      cancellationPolicy: data.cancellationPolicy,
      cancellationDeadlineDays: data.cancellationDeadlineDays,
      tagline: data.tagline || null,
      phone: data.phone || null,
      email: data.email || null,
      logoUrl: data.logoUrl || null,
      mapsUrl: data.mapsUrl || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      checkInInstructions: data.checkInInstructions || null,
      websiteUrl: data.websiteUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propertyId));

  revalidatePath("/settings/property");
  revalidatePath("/dashboard");

  return { success: true };
}
