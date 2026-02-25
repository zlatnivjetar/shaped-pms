"use server";

import { db } from "@/db";
import { roomTypes, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roomTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  baseOccupancy: z.coerce.number().int().min(1),
  maxOccupancy: z.coerce.number().int().min(1),
  baseRateCents: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type RoomTypeFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function getPropertyId(): Promise<string> {
  const [property] = await db.select({ id: properties.id }).from(properties).limit(1);
  if (!property) throw new Error("No property found");
  return property.id;
}

export async function createRoomType(
  prevState: RoomTypeFormState,
  formData: FormData
): Promise<RoomTypeFormState> {
  const parsed = roomTypeSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    baseOccupancy: formData.get("baseOccupancy"),
    maxOccupancy: formData.get("maxOccupancy"),
    baseRateCents: formData.get("baseRateCents"),
    sortOrder: formData.get("sortOrder"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const propertyId = await getPropertyId();

  await db.insert(roomTypes).values({
    ...parsed.data,
    description: parsed.data.description || null,
    propertyId,
  });

  revalidatePath("/settings/room-types");
  revalidatePath("/settings/rooms");
  return { success: true };
}

export async function updateRoomType(
  roomTypeId: string,
  prevState: RoomTypeFormState,
  formData: FormData
): Promise<RoomTypeFormState> {
  const parsed = roomTypeSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    baseOccupancy: formData.get("baseOccupancy"),
    maxOccupancy: formData.get("maxOccupancy"),
    baseRateCents: formData.get("baseRateCents"),
    sortOrder: formData.get("sortOrder"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(roomTypes)
    .set({ ...parsed.data, description: parsed.data.description || null, updatedAt: new Date() })
    .where(eq(roomTypes.id, roomTypeId));

  revalidatePath("/settings/room-types");
  revalidatePath("/settings/rooms");
  return { success: true };
}

export async function deleteRoomType(roomTypeId: string): Promise<void> {
  await db.delete(roomTypes).where(eq(roomTypes.id, roomTypeId));
  revalidatePath("/settings/room-types");
  revalidatePath("/settings/rooms");
}
