import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  guests,
  reservations,
  reservationRooms,
  inventory,
  roomTypes,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { apiResponse, apiError, getAuthenticatedProperty } from "@/lib/api-utils";
import { apiReservationSchema } from "@/lib/validators";
import { checkAvailability } from "@/lib/availability";
import { generateConfirmationCode } from "@/lib/confirmation-code";
import { sendBookingConfirmation } from "@/lib/email";

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

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const parsed = apiReservationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid request body.", 400);
  }

  const data = parsed.data;

  // Auth check — property resolved from slug + API key
  const authResult = await getAuthenticatedProperty(req, data.propertySlug);
  if ("error" in authResult) return authResult.error;
  const { property } = authResult;

  // Validate dates
  if (data.checkIn >= data.checkOut) {
    return apiError("checkOut must be after checkIn.", 400);
  }

  // Verify room type belongs to property
  const roomType = await db.query.roomTypes.findFirst({
    where: and(
      eq(roomTypes.id, data.roomTypeId),
      eq(roomTypes.propertyId, property.id)
    ),
  });
  if (!roomType) {
    return apiError("Room type not found.", 404);
  }

  // Check availability and calculate total
  const availability = await checkAvailability(
    property.id,
    data.roomTypeId,
    data.checkIn,
    data.checkOut
  );

  if (availability.available < 1) {
    return apiError("No availability for the requested dates.", 409);
  }

  const totalCents = availability.nightly.reduce((sum, n) => sum + n.rateCents, 0);
  const ratePerNightCents = availability.nightly[0]?.rateCents ?? roomType.baseRateCents;
  const nights = buildNightList(data.checkIn, data.checkOut);

  // Generate confirmation code (unique)
  let confirmationCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateConfirmationCode();
    const existing = await db.query.reservations.findFirst({
      where: eq(reservations.confirmationCode, candidate),
    });
    if (!existing) {
      confirmationCode = candidate;
      break;
    }
  }
  if (!confirmationCode) {
    return apiError("Could not generate confirmation code.", 500);
  }

  // Lock inventory — conditional UPDATE, same pattern as booking engine
  const updatedRows = await db
    .update(inventory)
    .set({
      bookedUnits: sql`${inventory.bookedUnits} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.propertyId, property.id),
        eq(inventory.roomTypeId, data.roomTypeId),
        inArray(inventory.date, nights),
        sql`(${inventory.totalUnits} - ${inventory.bookedUnits} - ${inventory.blockedUnits}) >= 1`
      )
    )
    .returning({ date: inventory.date });

  if (updatedRows.length !== nights.length) {
    // Rollback any partial updates
    const updatedDates = updatedRows.map((r) => r.date);
    if (updatedDates.length > 0) {
      await db
        .update(inventory)
        .set({
          bookedUnits: sql`${inventory.bookedUnits} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventory.propertyId, property.id),
            eq(inventory.roomTypeId, data.roomTypeId),
            inArray(inventory.date, updatedDates)
          )
        );
    }
    return apiError("Room no longer available for one or more nights.", 409);
  }

  try {
    // Upsert guest
    const [guest] = await db
      .insert(guests)
      .values({
        propertyId: property.id,
        email: data.guest.email.toLowerCase(),
        firstName: data.guest.firstName,
        lastName: data.guest.lastName,
        phone: data.guest.phone,
      })
      .onConflictDoUpdate({
        target: [guests.propertyId, guests.email],
        set: {
          firstName: data.guest.firstName,
          lastName: data.guest.lastName,
          phone: data.guest.phone,
          updatedAt: new Date(),
        },
      })
      .returning({ id: guests.id });

    // Create reservation
    const [reservation] = await db
      .insert(reservations)
      .values({
        propertyId: property.id,
        guestId: guest.id,
        confirmationCode,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        nights: nights.length,
        adults: data.adults,
        children: data.children,
        status: "confirmed",
        channel: data.channel,
        totalCents,
        currency: property.currency,
        specialRequests: data.specialRequests,
      })
      .returning({ id: reservations.id });

    // Create reservation_rooms
    await db.insert(reservationRooms).values({
      reservationId: reservation.id,
      roomTypeId: data.roomTypeId,
      ratePerNightCents,
    });

    // Update guest stats
    await db
      .update(guests)
      .set({
        totalStays: sql`${guests.totalStays} + 1`,
        totalSpentCents: sql`${guests.totalSpentCents} + ${totalCents}`,
        updatedAt: new Date(),
      })
      .where(eq(guests.id, guest.id));

    // Fire-and-forget confirmation email
    // NOTE: API bookings have no Stripe payment so amountPaidCents = 0
    void sendBookingConfirmation({
      reservationId: reservation.id,
      propertyId: property.id,
      guestEmail: data.guest.email.toLowerCase(),
      guestFirstName: data.guest.firstName,
      confirmationCode,
      propertyName: property.name,
      propertyAddress: [property.address, property.city, property.country]
        .filter(Boolean)
        .join(", "),
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: nights.length,
      roomTypeName: roomType.name,
      totalCents,
      currency: property.currency,
      amountPaidCents: 0,
      paymentType: "full_payment",
      checkInTime: property.checkInTime ?? undefined,
    });

    // TODO: push confirmed reservation to channel manager webhook

    return apiResponse(
      {
        confirmationCode,
        reservationId: reservation.id,
        totalCents,
        currency: property.currency,
        nights: nights.length,
      },
      201
    );
  } catch {
    // Rollback inventory on unexpected error
    await db
      .update(inventory)
      .set({
        bookedUnits: sql`${inventory.bookedUnits} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.propertyId, property.id),
          eq(inventory.roomTypeId, data.roomTypeId),
          inArray(inventory.date, nights)
        )
      );

    return apiError("An unexpected error occurred.", 500);
  }
}
