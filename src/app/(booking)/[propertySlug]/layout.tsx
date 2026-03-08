import { db } from "@/db";
import {
  properties,
  roomTypes,
  amenities,
  roomTypeAmenities,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildLodgingBusinessJsonLd } from "@/lib/jsonld";
import { headers } from "next/headers";

interface Props {
  children: React.ReactNode;
  params: Promise<{ propertySlug: string }>;
}

export default async function PropertyBookingLayout({ children, params }: Props) {
  const { propertySlug } = await params;

  const property = await db.query.properties.findFirst({
    where: and(
      eq(properties.slug, propertySlug),
      eq(properties.status, "active")
    ),
  });

  if (!property) {
    return <>{children}</>;
  }

  const activeRoomTypes = await db.query.roomTypes.findMany({
    where: and(
      eq(roomTypes.propertyId, property.id),
      eq(roomTypes.status, "active")
    ),
  });

  // Fetch amenities for all active room types
  let propertyAmenities: { name: string }[] = [];
  if (activeRoomTypes.length > 0) {
    const rtIds = activeRoomTypes.map((rt) => rt.id);
    const links = await db
      .select({ amenityId: roomTypeAmenities.amenityId })
      .from(roomTypeAmenities)
      .where(inArray(roomTypeAmenities.roomTypeId, rtIds));

    const uniqueAmenityIds = [...new Set(links.map((l) => l.amenityId))];
    if (uniqueAmenityIds.length > 0) {
      propertyAmenities = await db
        .select({ name: amenities.name })
        .from(amenities)
        .where(inArray(amenities.id, uniqueAmenityIds));
    }
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${proto}://${host}`;

  const jsonLd = buildLodgingBusinessJsonLd(
    property,
    activeRoomTypes,
    propertyAmenities,
    baseUrl
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
