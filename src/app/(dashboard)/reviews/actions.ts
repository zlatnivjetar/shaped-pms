"use server";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function publishReview(id: string): Promise<void> {
  await db
    .update(reviews)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(reviews.id, id));
  revalidatePath("/reviews");
}

export async function hideReview(id: string): Promise<void> {
  await db
    .update(reviews)
    .set({ status: "hidden", updatedAt: new Date() })
    .where(eq(reviews.id, id));
  revalidatePath("/reviews");
}

export async function respondToReview(
  id: string,
  response: string
): Promise<void> {
  await db
    .update(reviews)
    .set({
      propertyResponse: response.trim(),
      propertyRespondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, id));
  revalidatePath("/reviews");
}
