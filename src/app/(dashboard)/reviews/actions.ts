"use server";

import { db } from "@/db";
import { properties, reviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeOtaRating } from "@/lib/reviews";

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

const OtaReviewSchema = z.object({
  reviewer_name: z.string().min(1),
  rating: z.number().positive(),
  title: z.string().optional(),
  body: z.string().min(1),
  stay_date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stay_date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  external_id: z.string().min(1),
  source: z.enum(["booking_com", "google", "tripadvisor", "airbnb", "expedia"]),
  source_url: z.string().url().optional(),
});

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export async function importOtaReviews(
  rawJson: string
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    result.errors.push("No property found");
    return result;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    result.errors.push("Invalid JSON");
    return result;
  }

  if (!Array.isArray(parsed)) {
    result.errors.push("JSON must be an array of review objects");
    return result;
  }

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const validation = OtaReviewSchema.safeParse(item);
    if (!validation.success) {
      result.errors.push(
        `Row ${i + 1}: ${validation.error.issues.map((e) => e.message).join(", ")}`
      );
      continue;
    }

    const data = validation.data;

    // Check for duplicate by external_id
    const existing = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.propertyId, property.id),
        eq(reviews.externalId, data.external_id)
      ),
      columns: { id: true },
    });

    if (existing) {
      result.skipped++;
      continue;
    }

    const normalizedRating = normalizeOtaRating(data.rating, data.source);

    await db.insert(reviews).values({
      propertyId: property.id,
      rating: normalizedRating,
      title: data.title ?? null,
      body: data.body,
      reviewerName: data.reviewer_name,
      stayDateStart: data.stay_date_start,
      stayDateEnd: data.stay_date_end,
      status: "published",
      source: data.source,
      externalId: data.external_id,
      sourceUrl: data.source_url ?? null,
      sourceRatingRaw: data.rating,
    });

    result.imported++;
  }

  if (result.imported > 0) revalidatePath("/reviews");
  return result;
}
