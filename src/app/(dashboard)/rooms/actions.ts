"use server";

import { db } from "@/db";
import { rooms, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  floor: z.string().optional(),
  status: z.enum(["available", "maintenance", "out_of_service"]).default("available"),
});

export type RoomFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function getPropertyId(): Promise<string> {
  const [property] = await db.select({ id: properties.id }).from(properties).limit(1);
  if (!property) throw new Error("No property found");
  return property.id;
}

export async function addRoom(
  roomTypeId: string,
  prevState: RoomFormState,
  formData: FormData
): Promise<RoomFormState> {
  const parsed = addRoomSchema.safeParse({
    roomNumber: formData.get("roomNumber"),
    floor: formData.get("floor"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const propertyId = await getPropertyId();

  await db.insert(rooms).values({
    propertyId,
    roomTypeId,
    roomNumber: parsed.data.roomNumber,
    floor: parsed.data.floor || null,
    status: parsed.data.status,
  });

  revalidatePath("/rooms");
  return { success: true };
}

export async function updateRoomStatus(
  roomId: string,
  status: "available" | "maintenance" | "out_of_service"
): Promise<void> {
  await db
    .update(rooms)
    .set({ status, updatedAt: new Date() })
    .where(eq(rooms.id, roomId));
  revalidatePath("/rooms");
}

export async function deleteRoom(roomId: string): Promise<void> {
  await db.delete(rooms).where(eq(rooms.id, roomId));
  revalidatePath("/rooms");
}
