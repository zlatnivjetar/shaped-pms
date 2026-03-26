import { cache } from "react";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  properties,
  reservations,
  reviews,
  roomTypeAmenities,
  roomTypes,
} from "@/db/schema";
import type {
  BookingAvailabilityData,
  BookingAvailabilityParams,
  BookingCompletedReservation,
  BookingShellData,
} from "@/lib/booking-contracts";
import { getAvailableRoomTypes } from "@/lib/availability";

export const getBookingShellData = cache(
  async (propertySlug: string): Promise<BookingShellData | null> => {
    const property = await db.query.properties.findFirst({
      where: and(
        eq(properties.slug, propertySlug),
        eq(properties.status, "active"),
      ),
    });

    if (!property) {
      return null;
    }

    const activeRoomTypes = await db.query.roomTypes.findMany({
      where: and(
        eq(roomTypes.propertyId, property.id),
        eq(roomTypes.status, "active"),
      ),
      orderBy: [roomTypes.sortOrder, roomTypes.name],
    });

    const roomTypeIds = activeRoomTypes.map((roomType) => roomType.id);
    const [amenityLinks, publishedReviews, reviewOverview] =
      await Promise.all([
        roomTypeIds.length > 0
          ? db.query.roomTypeAmenities.findMany({
              where: inArray(roomTypeAmenities.roomTypeId, roomTypeIds),
              with: {
                amenity: true,
              },
            })
          : Promise.resolve([]),
        db.query.reviews.findMany({
          where: and(
            eq(reviews.propertyId, property.id),
            eq(reviews.status, "published"),
          ),
          orderBy: [desc(reviews.createdAt)],
          with: { guest: true },
          limit: 5,
        }),
        db
          .select({
            averageRating: sql<string | null>`avg(${reviews.rating})`,
            reviewCount: sql<number>`count(*)`,
          })
          .from(reviews)
          .where(
            and(
              eq(reviews.propertyId, property.id),
              eq(reviews.status, "published"),
            ),
          ),
      ]);

    const amenitiesByRoomType: BookingShellData["amenitiesByRoomType"] = {};
    const propertyAmenitiesMap = new Map<string, { name: string }>();

    for (const link of amenityLinks) {
      const list = amenitiesByRoomType[link.roomTypeId] ?? [];
      list.push({
        id: link.amenity.id,
        name: link.amenity.name,
        icon: link.amenity.icon,
      });
      amenitiesByRoomType[link.roomTypeId] = list;
      propertyAmenitiesMap.set(link.amenity.id, { name: link.amenity.name });
    }

    const overview = reviewOverview[0];

    return {
      property,
      activeRoomTypes,
      amenitiesByRoomType,
      publishedReviews,
      avgRating: overview?.averageRating ? Number(overview.averageRating) : null,
      reviewCount: Number(overview?.reviewCount ?? 0),
      propertyAmenities: [...propertyAmenitiesMap.values()],
    };
  },
);

export async function getBookingAvailabilityData(
  propertyId: string,
  params: Omit<BookingAvailabilityParams, "slug">,
): Promise<BookingAvailabilityData> {
  const roomTypesData = await getAvailableRoomTypes(
    propertyId,
    params.checkIn,
    params.checkOut,
  );

  return {
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
    roomTypes: roomTypesData,
  };
}

export async function getCompletedBookingReservation(
  propertyId: string,
  code?: string,
): Promise<BookingCompletedReservation> {
  if (!code) {
    return null;
  }

  const reservation =
    (await db.query.reservations.findFirst({
      where: and(
        eq(reservations.confirmationCode, code),
        eq(reservations.propertyId, propertyId),
      ),
      with: {
        guest: true,
        reservationRooms: {
          with: {
            roomType: true,
          },
        },
      },
    })) ?? null;

  if (!reservation) {
    return null;
  }

  return {
    confirmationCode: reservation.confirmationCode,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    nights: reservation.nights,
    adults: reservation.adults,
    children: reservation.children,
    totalCents: reservation.totalCents,
    currency: reservation.currency,
    guest: reservation.guest
      ? {
          firstName: reservation.guest.firstName,
          lastName: reservation.guest.lastName,
          email: reservation.guest.email,
        }
      : null,
    reservationRooms: reservation.reservationRooms.map((room) => ({
      roomType: room.roomType ? { name: room.roomType.name } : null,
    })),
  };
}
