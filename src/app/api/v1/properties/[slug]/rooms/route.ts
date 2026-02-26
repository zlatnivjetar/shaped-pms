import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, roomTypes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
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

  const types = await db
    .select()
    .from(roomTypes)
    .where(
      and(eq(roomTypes.propertyId, property.id), eq(roomTypes.status, "active"))
    )
    .orderBy(asc(roomTypes.sortOrder));

  return apiResponse(
    types.map((rt) => ({
      id: rt.id,
      name: rt.name,
      slug: rt.slug,
      description: rt.description,
      baseOccupancy: rt.baseOccupancy,
      maxOccupancy: rt.maxOccupancy,
      baseRateCents: rt.baseRateCents,
      status: rt.status,
    }))
  );
}
