import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, reviews } from "@/db/schema";
import { eq, and, avg, count } from "drizzle-orm";
import { apiResponse, apiError } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const property = await db.query.properties.findFirst({
    where: eq(properties.slug, slug),
  });

  if (!property) {
    return apiError("Property not found.", 404);
  }

  const [ratingResult] = await db
    .select({
      averageRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(
      and(eq(reviews.propertyId, property.id), eq(reviews.status, "published"))
    );

  return apiResponse({
    id: property.id,
    name: property.name,
    slug: property.slug,
    description: property.description,
    address: property.address,
    city: property.city,
    country: property.country,
    currency: property.currency,
    checkInTime: property.checkInTime,
    checkOutTime: property.checkOutTime,
    averageRating: ratingResult?.averageRating
      ? parseFloat(String(ratingResult.averageRating))
      : null,
    reviewCount: Number(ratingResult?.reviewCount ?? 0),
  });
}
