import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiResponse, apiError } from "@/lib/api-utils";
import { searchParamsSchema } from "@/lib/validators";
import { getAvailableRoomTypes } from "@/lib/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const parsed = searchParamsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid request body.", 400);
  }

  const { checkIn, checkOut, adults, children } = parsed.data;

  if (checkIn >= checkOut) {
    return apiError("checkOut must be after checkIn.", 400);
  }

  const property = await db.query.properties.findFirst({
    where: eq(properties.slug, slug),
  });

  if (!property) {
    return apiError("Property not found.", 404);
  }

  const roomTypes = await getAvailableRoomTypes(property.id, checkIn, checkOut);

  return apiResponse({
    checkIn,
    checkOut,
    adults,
    children,
    roomTypes: roomTypes.map((rt) => ({
      roomTypeId: rt.roomTypeId,
      name: rt.name,
      slug: rt.slug,
      description: rt.description,
      baseOccupancy: rt.baseOccupancy,
      maxOccupancy: rt.maxOccupancy,
      available: rt.available,
      ratePerNightCents: rt.ratePerNightCents,
      totalCents: rt.totalCents,
      nights: rt.nights,
    })),
  });
}
