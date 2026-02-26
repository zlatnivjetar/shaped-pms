import { NextRequest } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiResponse, apiError, getAuthenticatedProperty } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ confirmationCode: string }> }
) {
  const { confirmationCode } = await params;

  // We need the property slug to auth — extract from query param or look up reservation first
  // Strategy: find the reservation, then verify the API key belongs to that property
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.confirmationCode, confirmationCode),
    with: {
      guest: true,
      reservationRooms: {
        with: { roomType: true },
      },
      property: true,
    },
  });

  if (!reservation) {
    return apiError("Reservation not found.", 404);
  }

  // Auth against the property that owns this reservation
  const authResult = await getAuthenticatedProperty(req, reservation.property.slug);
  if ("error" in authResult) return authResult.error;

  return apiResponse({
    id: reservation.id,
    confirmationCode: reservation.confirmationCode,
    status: reservation.status,
    channel: reservation.channel,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    nights: reservation.nights,
    adults: reservation.adults,
    children: reservation.children,
    totalCents: reservation.totalCents,
    currency: reservation.currency,
    specialRequests: reservation.specialRequests,
    cancelledAt: reservation.cancelledAt,
    cancellationReason: reservation.cancellationReason,
    createdAt: reservation.createdAt,
    guest: {
      id: reservation.guest.id,
      firstName: reservation.guest.firstName,
      lastName: reservation.guest.lastName,
      email: reservation.guest.email,
      phone: reservation.guest.phone,
    },
    rooms: reservation.reservationRooms.map((rr) => ({
      roomTypeId: rr.roomTypeId,
      roomTypeName: rr.roomType.name,
      ratePerNightCents: rr.ratePerNightCents,
    })),
  });
}
