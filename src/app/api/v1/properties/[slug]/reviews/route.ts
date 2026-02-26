import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, reviews, guests } from "@/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
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

  const [reviewRows, statsRow] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        stayDateStart: reviews.stayDateStart,
        stayDateEnd: reviews.stayDateEnd,
        propertyResponse: reviews.propertyResponse,
        propertyRespondedAt: reviews.propertyRespondedAt,
        createdAt: reviews.createdAt,
        guestFirstName: guests.firstName,
        guestLastName: guests.lastName,
      })
      .from(reviews)
      .innerJoin(guests, eq(reviews.guestId, guests.id))
      .where(
        and(
          eq(reviews.propertyId, property.id),
          eq(reviews.status, "published")
        )
      )
      .orderBy(desc(reviews.createdAt)),
    db
      .select({
        averageRating: avg(reviews.rating),
        totalCount: count(reviews.id),
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.propertyId, property.id),
          eq(reviews.status, "published")
        )
      ),
  ]);

  const stats = statsRow[0];

  return apiResponse({
    reviews: reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      stayDateStart: r.stayDateStart,
      stayDateEnd: r.stayDateEnd,
      propertyResponse: r.propertyResponse,
      propertyRespondedAt: r.propertyRespondedAt,
      createdAt: r.createdAt,
      guest: {
        firstName: r.guestFirstName,
        lastName: r.guestLastName,
      },
    })),
    averageRating: stats?.averageRating
      ? parseFloat(String(stats.averageRating))
      : null,
    totalCount: Number(stats?.totalCount ?? 0),
  });
}
