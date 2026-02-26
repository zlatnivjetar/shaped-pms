"use server";

import { db } from "@/db";
import {
  guests,
  reservations,
  reservationRooms,
  inventory,
  roomTypes,
  ratePlans,
  properties,
  payments,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateConfirmationCode } from "@/lib/confirmation-code";
import { createReservationSchema } from "@/lib/validators";
import { resolveRate } from "@/lib/pricing";
import {
  createPaymentIntent,
  stripe as getStripe,
} from "@/lib/payments";

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

// ─── createPaymentIntentForBooking ────────────────────────────────────────────

export async function createPaymentIntentForBooking(
  propertySlug: string,
  params: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }
): Promise<
  | {
      clientSecret: string;
      paymentIntentId: string;
      chargedAmountCents: number;
      paymentType: "deposit" | "full_payment";
      reservationCode: string;
    }
  | { error: string }
> {
  // Load property
  const property = await db.query.properties.findFirst({
    where: eq(properties.slug, propertySlug),
  });
  if (!property) return { error: "Property not found." };

  const nights = buildNightList(params.checkIn, params.checkOut);
  if (nights.length === 0) return { error: "Invalid dates." };

  // Load room type + rate plans
  const [roomTypeData, activePlans] = await Promise.all([
    db.query.roomTypes.findFirst({
      where: eq(roomTypes.id, params.roomTypeId),
    }),
    db
      .select()
      .from(ratePlans)
      .where(
        and(
          eq(ratePlans.roomTypeId, params.roomTypeId),
          eq(ratePlans.status, "active")
        )
      ),
  ]);

  if (!roomTypeData) return { error: "Room type not found." };

  const plansForPricing = activePlans.map((p) => ({
    id: p.id,
    type: p.type,
    dateStart: p.dateStart,
    dateEnd: p.dateEnd,
    rateCents: p.rateCents,
    priority: p.priority,
    status: p.status,
  }));

  const totalCents = nights.reduce(
    (sum, date) =>
      sum + resolveRate(roomTypeData.baseRateCents, date, plansForPricing),
    0
  );

  // Pre-generate reservation code — stored in PI metadata for anti-tamper check
  let reservationCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateConfirmationCode();
    const existing = await db.query.reservations.findFirst({
      where: eq(reservations.confirmationCode, candidate),
    });
    if (!existing) {
      reservationCode = candidate;
      break;
    }
  }
  if (!reservationCode) return { error: "Could not generate reservation code." };

  const result = await createPaymentIntent({
    amountCents: totalCents,
    currency: property.currency,
    paymentMode: property.paymentMode,
    depositPercentage: property.depositPercentage,
    metadata: {
      reservation_code: reservationCode,
      property_id: property.id,
      room_type_id: params.roomTypeId,
    },
  });

  return {
    clientSecret: result.clientSecret,
    paymentIntentId: result.paymentIntentId,
    chargedAmountCents: result.chargedAmountCents,
    paymentType: result.paymentType,
    reservationCode,
  };
}

// ─── createReservation ────────────────────────────────────────────────────────

export async function createReservation(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const raw = {
    propertyId: formData.get("propertyId"),
    roomTypeId: formData.get("roomTypeId"),
    propertySlug: formData.get("propertySlug"),
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    adults: formData.get("adults"),
    children: formData.get("children"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    specialRequests: formData.get("specialRequests") || undefined,
  };

  const parsed = createReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return "Invalid booking data. Please check your details and try again.";
  }

  const data = parsed.data;
  const propertySlug = String(formData.get("propertySlug") ?? "");
  const paymentIntentId = String(formData.get("paymentIntentId") ?? "");
  const reservationCode = String(formData.get("reservationCode") ?? "");

  if (!paymentIntentId || !reservationCode) {
    return "Payment information is missing. Please restart the booking.";
  }

  // Verify payment intent
  let pi;
  try {
    pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
  } catch {
    return "Could not verify payment. Please try again.";
  }

  if (pi.status !== "succeeded" && pi.status !== "requires_capture") {
    return "Payment was not authorized. Please try again.";
  }

  if (pi.metadata?.reservation_code !== reservationCode) {
    return "Payment verification failed. Please restart the booking.";
  }

  const nights = buildNightList(data.checkIn, data.checkOut);

  if (nights.length === 0) {
    return "Invalid dates selected.";
  }

  // Fetch room type + rate plans to compute nightly totals
  const [roomTypeData, activePlans] = await Promise.all([
    db.query.roomTypes.findFirst({ where: eq(roomTypes.id, data.roomTypeId) }),
    db
      .select()
      .from(ratePlans)
      .where(
        and(
          eq(ratePlans.roomTypeId, data.roomTypeId),
          eq(ratePlans.status, "active")
        )
      ),
  ]);

  if (!roomTypeData) return "Room type not found.";

  const plansForPricing = activePlans.map((p) => ({
    id: p.id,
    type: p.type,
    dateStart: p.dateStart,
    dateEnd: p.dateEnd,
    rateCents: p.rateCents,
    priority: p.priority,
    status: p.status,
  }));

  const nightlyRates = nights.map((date) => ({
    date,
    rateCents: resolveRate(roomTypeData.baseRateCents, date, plansForPricing),
  }));
  const totalCents = nightlyRates.reduce((sum, n) => sum + n.rateCents, 0);
  const ratePerNightCents = nightlyRates[0]?.rateCents ?? roomTypeData.baseRateCents;

  // Pre-check availability
  const inventoryCheck = await db
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.propertyId, data.propertyId),
        eq(inventory.roomTypeId, data.roomTypeId),
        inArray(inventory.date, nights)
      )
    );

  for (const night of nights) {
    const row = inventoryCheck.find((r) => r.date === night);
    const avail = row
      ? row.totalUnits - row.bookedUnits - row.blockedUnits
      : 0;
    if (avail < 1) {
      return "Sorry, this room type is no longer available for your selected dates. Please go back and choose different dates or a different room.";
    }
  }

  // Atomic conditional UPDATE — prevents double-booking
  const updatedRows = await db
    .update(inventory)
    .set({
      bookedUnits: sql`${inventory.bookedUnits} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.propertyId, data.propertyId),
        eq(inventory.roomTypeId, data.roomTypeId),
        inArray(inventory.date, nights),
        sql`(${inventory.totalUnits} - ${inventory.bookedUnits} - ${inventory.blockedUnits}) >= 1`
      )
    )
    .returning({ date: inventory.date });

  if (updatedRows.length !== nights.length) {
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
            eq(inventory.propertyId, data.propertyId),
            eq(inventory.roomTypeId, data.roomTypeId),
            inArray(inventory.date, updatedDates)
          )
        );
    }
    return "Sorry, this room was just booked by someone else. Please go back and select different dates.";
  }

  try {
    // Upsert guest
    const [guest] = await db
      .insert(guests)
      .values({
        propertyId: data.propertyId,
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      })
      .onConflictDoUpdate({
        target: [guests.propertyId, guests.email],
        set: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          updatedAt: new Date(),
        },
      })
      .returning({ id: guests.id });

    // Create reservation using the pre-generated code from PI metadata
    const [reservation] = await db
      .insert(reservations)
      .values({
        propertyId: data.propertyId,
        guestId: guest.id,
        confirmationCode: reservationCode,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        nights: nights.length,
        adults: data.adults,
        children: data.children,
        status: "confirmed",
        channel: "direct",
        totalCents,
        currency: "EUR",
        specialRequests: data.specialRequests,
      })
      .returning({ id: reservations.id, code: reservations.confirmationCode });

    // Create reservation_room
    await db.insert(reservationRooms).values({
      reservationId: reservation.id,
      roomTypeId: data.roomTypeId,
      ratePerNightCents,
    });

    // Insert payment record
    const paymentStatus =
      pi.status === "succeeded" ? "captured" : "requires_capture";
    const paymentType =
      (pi.metadata?.payment_type as "deposit" | "full_payment") ?? "full_payment";

    await db.insert(payments).values({
      reservationId: reservation.id,
      propertyId: data.propertyId,
      stripePaymentIntentId: paymentIntentId,
      type: paymentType,
      amountCents: pi.amount,
      currency: pi.currency.toUpperCase(),
      status: paymentStatus,
      capturedAt: pi.status === "succeeded" ? new Date() : null,
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

    redirect(`/${propertySlug}?step=complete&code=${reservation.code}`);
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" ||
        (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }

    // Rollback inventory on any other error
    await db
      .update(inventory)
      .set({
        bookedUnits: sql`${inventory.bookedUnits} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.propertyId, data.propertyId),
          eq(inventory.roomTypeId, data.roomTypeId),
          inArray(inventory.date, nights)
        )
      );

    return "An unexpected error occurred. Please try again.";
  }
}
