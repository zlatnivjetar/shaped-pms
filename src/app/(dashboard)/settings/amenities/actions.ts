"use server";

import { db } from "@/db";
import { amenities, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const amenitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens"
    ),
  icon: z.string().min(1, "Icon is required"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type AmenityFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function getPropertyId(): Promise<string> {
  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .limit(1);
  if (!property) throw new Error("No property found");
  return property.id;
}

export async function createAmenity(
  prevState: AmenityFormState,
  formData: FormData
): Promise<AmenityFormState> {
  const parsed = amenitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    icon: formData.get("icon"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const propertyId = await getPropertyId();

  try {
    await db.insert(amenities).values({ ...parsed.data, propertyId });
  } catch {
    return { error: "An amenity with that slug already exists." };
  }

  revalidatePath("/settings/amenities");
  return { success: true };
}

export async function updateAmenity(
  amenityId: string,
  prevState: AmenityFormState,
  formData: FormData
): Promise<AmenityFormState> {
  const parsed = amenitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    icon: formData.get("icon"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db
    .update(amenities)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(amenities.id, amenityId));

  revalidatePath("/settings/amenities");
  return { success: true };
}

export async function deleteAmenity(amenityId: string): Promise<void> {
  await db.delete(amenities).where(eq(amenities.id, amenityId));
  revalidatePath("/settings/amenities");
  revalidatePath("/settings/room-types");
}
