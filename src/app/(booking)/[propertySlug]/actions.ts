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
import { revalidatePath } from "next/cache";
import { generateConfirmationCode } from "@/lib/confirmation-code";
import { createReservationSchema } from "@/lib/validators";
import { resolveRate } from "@/lib/pricing";
import { generateManageToken, buildManageUrl } from "@/lib/cancellation";
import { checkBookingRules } from "@/lib/availability";
import {
  createPaymentIntent,
  createSetupIntent,
  stripe as getStripe,
} from "@/lib/payments";
import { sendBookingConfirmation } from "@/lib/email";

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

export type PaymentIntentResult =
  | {
      type: "payment";
      clientSecret: string;
      paymentIntentId: string;
      chargedAmountCents: number;
      paymentType: "deposit" | "full_payment";
      reservationCode: string;
    }
  | {
      type: "setup";
      clientSecret: string;
      setupIntentId: string;
      customerId: string;
      totalCents: number;
      reservationCode: string;
      scheduledChargeDate: string;
    }
  | { error: string };

export async function createPaymentIntentForBooking(
  propertySlug: string,
  params: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    guestEmail?: string;
    guestName?: string;
  }
): Promise<PaymentIntentResult> {
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

  // Pre-generate reservation code — stored in intent metadata for anti-tamper check
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

  const metadata = {
    reservation_code: reservationCode,
    property_id: property.id,
    room_type_id: params.roomTypeId,
  };

  // Scheduled mode: if check-in is far enough away, save card instead of charging now
  if (property.paymentMode === "scheduled") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const checkInDate = new Date(params.checkIn + "T00:00:00Z");
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const threshold = property.scheduledChargeThresholdDays ?? 7;

    if (daysUntilCheckIn > threshold) {
      try {
        const si = await createSetupIntent(
          params.guestEmail ?? "",
          params.guestName ?? "",
          metadata
        );
        const chargeDate = new Date(checkInDate);
        chargeDate.setUTCDate(chargeDate.getUTCDate() - threshold);
        return {
          type: "setup",
          clientSecret: si.clientSecret,
          setupIntentId: si.setupIntentId,
          customerId: si.customerId,
          totalCents,
          reservationCode,
          scheduledChargeDate: chargeDate.toISOString().slice(0, 10),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not set up payment.";
        return { error: message };
      }
    }
  }

  // Standard flow: immediate PaymentIntent
  try {
    const result = await createPaymentIntent({
      amountCents: totalCents,
      currency: property.currency,
      paymentMode:
        property.paymentMode === "scheduled"
          ? "full_at_booking"
          : property.paymentMode,
      depositPercentage: property.depositPercentage,
      metadata,
    });

    return {
      type: "payment",
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      chargedAmountCents: result.chargedAmountCents,
      paymentType: result.paymentType,
      reservationCode,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not set up payment.";
    return { error: message };
  }
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
  const setupIntentId = String(formData.get("setupIntentId") ?? "");
  const stripeCustomerId = String(formData.get("stripeCustomerId") ?? "");
  const reservationCode = String(formData.get("reservationCode") ?? "");
  const isSetupFlow = !!setupIntentId;

  if (!reservationCode || (!paymentIntentId && !setupIntentId)) {
    return "Payment information is missing. Please restart the booking.";
  }

  // Verify payment/setup intent
  let stripeMetadata: Record<string, string> = {};
  let stripePaymentMethodId: string | undefined;
  let stripeChargedAmountCents = 0;
  let stripePaymentStatus = "";

  let stripeCustomerIdFromStripe: string | undefined;

  if (isSetupFlow) {
    let si;
    try {
      si = await getStripe().setupIntents.retrieve(setupIntentId);
    } catch {
      return "Could not verify payment setup. Please try again.";
    }
    if (si.status !== "succeeded") {
      return "Card setup was not completed. Please try again.";
    }
    stripeMetadata = (si.metadata as Record<string, string>) ?? {};
    stripePaymentMethodId = typeof si.payment_method === "string"
      ? si.payment_method
      : si.payment_method?.id;
    // Prefer customerId from form (no-redirect flow); fall back to what Stripe has on the SI
    stripeCustomerIdFromStripe = stripeCustomerId || (
      typeof si.customer === "string" ? si.customer : si.customer?.id
    ) || undefined;
  } else {
    let pi;
    try {
      pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
    } catch {
      return "Could not verify payment. Please try again.";
    }
    if (pi.status !== "succeeded" && pi.status !== "requires_capture") {
      return "Payment was not authorized. Please try again.";
    }
    stripeMetadata = (pi.metadata as Record<string, string>) ?? {};
    stripeChargedAmountCents = pi.amount;
    stripePaymentStatus = pi.status;
  }

  if (stripeMetadata?.reservation_code !== reservationCode) {
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

  // Check booking rules
  const rulesResult = await checkBookingRules(
    data.propertyId,
    data.roomTypeId,
    data.checkIn,
    data.checkOut
  );
  if (!rulesResult.valid) {
    return rulesResult.violations[0] ?? "Booking not allowed for these dates.";
  }

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
    const manageToken = generateManageToken();
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
        manageToken,
      })
      .returning({ id: reservations.id, code: reservations.confirmationCode });

    // Create reservation_room
    await db.insert(reservationRooms).values({
      reservationId: reservation.id,
      roomTypeId: data.roomTypeId,
      ratePerNightCents,
    });

    // Insert payment record
    if (isSetupFlow) {
      // Scheduled flow: save card, charge later
      const property2 = await db.query.properties.findFirst({
        where: eq(properties.slug, propertySlug),
      });
      const threshold = property2?.scheduledChargeThresholdDays ?? 7;
      const checkInDate = new Date(data.checkIn + "T00:00:00Z");
      const scheduledChargeAt = new Date(checkInDate);
      scheduledChargeAt.setUTCDate(scheduledChargeAt.getUTCDate() - threshold);

      await db.insert(payments).values({
        reservationId: reservation.id,
        propertyId: data.propertyId,
        stripeSetupIntentId: setupIntentId,
        stripePaymentMethodId: stripePaymentMethodId,
        stripeCustomerId: stripeCustomerIdFromStripe ?? null,
        type: "full_payment",
        amountCents: totalCents,
        currency: property2?.currency ?? "EUR",
        status: "pending",
        scheduledChargeAt,
      });
    } else {
      const paymentStatus =
        stripePaymentStatus === "succeeded" ? "captured" : "requires_capture";
      const paymentType =
        (stripeMetadata?.payment_type as "deposit" | "full_payment") ?? "full_payment";

      await db.insert(payments).values({
        reservationId: reservation.id,
        propertyId: data.propertyId,
        stripePaymentIntentId: paymentIntentId,
        type: paymentType,
        amountCents: stripeChargedAmountCents,
        currency: "EUR",
        status: paymentStatus,
        capturedAt: stripePaymentStatus === "succeeded" ? new Date() : null,
      });
    }

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
    const propertyForEmail = await db.query.properties.findFirst({
      where: eq(properties.slug, propertySlug),
    });
    if (propertyForEmail) {
      void sendBookingConfirmation({
        reservationId: reservation.id,
        propertyId: data.propertyId,
        guestEmail: data.email.toLowerCase(),
        guestFirstName: data.firstName,
        confirmationCode: reservationCode,
        propertyName: propertyForEmail.name,
        propertyAddress: [propertyForEmail.address, propertyForEmail.city, propertyForEmail.country]
          .filter(Boolean)
          .join(", "),
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        nights: nights.length,
        roomTypeName: roomTypeData.name,
        totalCents,
        currency: propertyForEmail.currency,
        amountPaidCents: isSetupFlow ? 0 : stripeChargedAmountCents,
        paymentType: isSetupFlow
          ? "full_payment"
          : ((stripeMetadata?.payment_type as "deposit" | "full_payment") ?? "full_payment"),
        checkInTime: propertyForEmail.checkInTime ?? undefined,
        manageUrl: buildManageUrl(reservationCode, manageToken),
      });
    }

    revalidatePath("/dashboard");
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
