import { NextRequest } from "next/server";
import { db } from "@/db";
import { reservations, inventory } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { apiResponse, apiError, getAuthenticatedProperty } from "@/lib/api-utils";
import { sendCancellationConfirmation } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildNightList(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const current = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (current < end) {
    nights.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return nights;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { reason?: string } = {};
  try {
    const raw = await req.json();
    if (typeof raw === "object" && raw !== null) {
      body = raw as { reason?: string };
    }
  } catch {
    // body is optional — proceed with empty object
  }

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: {
      reservationRooms: true,
      guest: true,
      property: true,
    },
  });

  if (!reservation) {
    return apiError("Reservation not found.", 404);
  }

  // Auth against the property that owns this reservation
  const authResult = await getAuthenticatedProperty(req, reservation.property.slug);
  if ("error" in authResult) return authResult.error;

  if (reservation.status === "cancelled") {
    return apiError("Reservation is already cancelled.", 409);
  }

  if (
    reservation.status === "checked_out" ||
    reservation.status === "no_show"
  ) {
    return apiError(
      `Cannot cancel a reservation with status '${reservation.status}'.`,
      409
    );
  }

  // Rollback inventory for each booked room type
  for (const rr of reservation.reservationRooms) {
    const nights = buildNightList(reservation.checkIn, reservation.checkOut);
    if (nights.length === 0) continue;

    await db
      .update(inventory)
      .set({
        bookedUnits: sql`GREATEST(0, ${inventory.bookedUnits} - 1)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.propertyId, reservation.propertyId),
          eq(inventory.roomTypeId, rr.roomTypeId),
          inArray(inventory.date, nights)
        )
      );
  }

  const cancelledAt = new Date();

  await db
    .update(reservations)
    .set({
      status: "cancelled",
      cancelledAt,
      cancellationReason: body.reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, id));

  // Fire-and-forget cancellation email
  if (reservation.guest && reservation.property) {
    void sendCancellationConfirmation({
      reservationId: id,
      propertyId: reservation.propertyId,
      guestEmail: reservation.guest.email,
      guestFirstName: reservation.guest.firstName,
      confirmationCode: reservation.confirmationCode,
      propertyName: reservation.property.name,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      cancellationReason: body.reason,
    });
  }

  return apiResponse({
    status: "cancelled",
    cancelledAt: cancelledAt.toISOString(),
  });
}
