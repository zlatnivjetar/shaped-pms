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
  discounts as discountsTable,
} from "@/db/schema";
import { eq, and, inArray, sql, or, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateConfirmationCode } from "@/lib/confirmation-code";
import { createReservationSchema } from "@/lib/validators";
import { resolveRate } from "@/lib/pricing";
import type { DiscountForPricing } from "@/lib/pricing";
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

async function fetchDiscountsForRoomType(
  propertyId: string,
  roomTypeId: string
): Promise<DiscountForPricing[]> {
  const rows = await db
    .select()
    .from(discountsTable)
    .where(
      and(
        eq(discountsTable.propertyId, propertyId),
        eq(discountsTable.status, "active"),
        or(
          isNull(discountsTable.roomTypeId),
          eq(discountsTable.roomTypeId, roomTypeId)
        )
      )
    );
  return rows.map((d) => ({
    percentage: d.percentage,
    dateStart: d.dateStart,
    dateEnd: d.dateEnd,
    status: d.status,
  }));
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
    guestEmail: string;
    guestFirstName: string;
    guestLastName: string;
  }
): Promise<PaymentIntentResult> {
  // Load property
  const property = await db.query.properties.findFirst({
    where: eq(properties.slug, propertySlug),
  });
  if (!property) return { error: "Property not found." };

  const nights = buildNightList(params.checkIn, params.checkOut);
  if (nights.length === 0) return { error: "Invalid dates." };

  // Load room type + rate plans + discounts
  const [roomTypeData, activePlans, activeDiscounts] = await Promise.all([
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
    fetchDiscountsForRoomType(property.id, params.roomTypeId),
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
      sum + resolveRate(roomTypeData.baseRateCents, date, plansForPricing, activeDiscounts),
    0
  );

  // Pre-generate reservation code
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

  // Upsert guest record
  const [guest] = await db
    .insert(guests)
    .values({
      propertyId: property.id,
      email: params.guestEmail.toLowerCase(),
      firstName: params.guestFirstName,
      lastName: params.guestLastName,
    })
    .onConflictDoUpdate({
      target: [guests.propertyId, guests.email],
      set: {
        firstName: params.guestFirstName,
        lastName: params.guestLastName,
        updatedAt: new Date(),
      },
    })
    .returning({ id: guests.id });

  // Atomically lock inventory for all nights
  const lockedRows = await db
    .update(inventory)
    .set({
      bookedUnits: sql`${inventory.bookedUnits} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.propertyId, property.id),
        eq(inventory.roomTypeId, params.roomTypeId),
        inArray(inventory.date, nights),
        sql`(${inventory.totalUnits} - ${inventory.bookedUnits} - ${inventory.blockedUnits}) >= 1`
      )
    )
    .returning({ date: inventory.date });

  if (lockedRows.length !== nights.length) {
    // Partial lock — rollback what we managed to lock
    if (lockedRows.length > 0) {
      await db
        .update(inventory)
        .set({ bookedUnits: sql`${inventory.bookedUnits} - 1`, updatedAt: new Date() })
        .where(
          and(
            eq(inventory.propertyId, property.id),
            eq(inventory.roomTypeId, params.roomTypeId),
            inArray(inventory.date, lockedRows.map((r) => r.date))
          )
        );
    }
    return { error: "This room is no longer available for your selected dates." };
  }

  // Create pending reservation (M14: tracked for abandoned cleanup)
  const manageToken = generateManageToken();
  const [pendingReservation] = await db
    .insert(reservations)
    .values({
      propertyId: property.id,
      guestId: guest.id,
      confirmationCode: reservationCode,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights: nights.length,
      adults: params.adults,
      children: params.children,
      status: "pending",
      channel: "direct",
      totalCents,
      currency: property.currency,
      manageToken,
      checkoutStartedAt: new Date(),
    })
    .returning({ id: reservations.id });

  // Insert reservation_room now so the abandoned cron can roll back inventory
  const ratePerNightCentsForRoom = resolveRate(
    roomTypeData.baseRateCents,
    nights[0],
    plansForPricing,
    activeDiscounts
  );
  await db.insert(reservationRooms).values({
    reservationId: pendingReservation.id,
    roomTypeId: params.roomTypeId,
    ratePerNightCents: ratePerNightCentsForRoom,
  });

  const metadata = {
    reservation_code: reservationCode,
    property_id: property.id,
    room_type_id: params.roomTypeId,
  };

  const guestFullName = `${params.guestFirstName} ${params.guestLastName}`;

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
          params.guestEmail,
          guestFullName,
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
        // Rollback pending reservation and inventory on Stripe failure
        await db
          .update(reservations)
          .set({ status: "cancelled", cancelledAt: new Date(), cancellationReason: "payment_setup_failed", updatedAt: new Date() })
          .where(eq(reservations.id, pendingReservation.id));
        await db
          .update(inventory)
          .set({ bookedUnits: sql`${inventory.bookedUnits} - 1`, updatedAt: new Date() })
          .where(
            and(
              eq(inventory.propertyId, property.id),
              eq(inventory.roomTypeId, params.roomTypeId),
              inArray(inventory.date, nights)
            )
          );
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
    // Rollback pending reservation and inventory on Stripe failure
    await db
      .update(reservations)
      .set({ status: "cancelled", cancelledAt: new Date(), cancellationReason: "payment_setup_failed", updatedAt: new Date() })
      .where(eq(reservations.id, pendingReservation.id));
    await db
      .update(inventory)
      .set({ bookedUnits: sql`${inventory.bookedUnits} - 1`, updatedAt: new Date() })
      .where(
        and(
          eq(inventory.propertyId, property.id),
          eq(inventory.roomTypeId, params.roomTypeId),
          inArray(inventory.date, nights)
        )
      );
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

  // Find the pending reservation created by createPaymentIntentForBooking
  const pendingReservation = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.confirmationCode, reservationCode),
      eq(reservations.status, "pending")
    ),
  });

  if (!pendingReservation) {
    return "Reservation not found. Please restart the booking.";
  }

  const nights = buildNightList(data.checkIn, data.checkOut);
  if (nights.length === 0) {
    return "Invalid dates selected.";
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

  // Check booking rules (safety check)
  const rulesResult = await checkBookingRules(
    data.propertyId,
    data.roomTypeId,
    data.checkIn,
    data.checkOut
  );
  if (!rulesResult.valid) {
    return rulesResult.violations[0] ?? "Booking not allowed for these dates.";
  }

  // Fetch room type + rate plans + discounts to compute nightly totals
  const [roomTypeData, activePlans, activeDiscounts] = await Promise.all([
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
    fetchDiscountsForRoomType(data.propertyId, data.roomTypeId),
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
    rateCents: resolveRate(roomTypeData.baseRateCents, date, plansForPricing, activeDiscounts),
  }));
  const totalCents = nightlyRates.reduce((sum, n) => sum + n.rateCents, 0);

  try {
    // Update guest with full details (phone, special requests)
    await db
      .update(guests)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        updatedAt: new Date(),
      })
      .where(eq(guests.id, pendingReservation.guestId));

    // Update reservation with full details + confirm it
    await db
      .update(reservations)
      .set({
        totalCents,
        specialRequests: data.specialRequests,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, pendingReservation.id));

    // Insert payment record
    if (isSetupFlow) {
      const property2 = await db.query.properties.findFirst({
        where: eq(properties.slug, propertySlug),
      });
      const threshold = property2?.scheduledChargeThresholdDays ?? 7;
      const checkInDate = new Date(data.checkIn + "T00:00:00Z");
      const scheduledChargeAt = new Date(checkInDate);
      scheduledChargeAt.setUTCDate(scheduledChargeAt.getUTCDate() - threshold);

      await db.insert(payments).values({
        reservationId: pendingReservation.id,
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
        reservationId: pendingReservation.id,
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
      .where(eq(guests.id, pendingReservation.guestId));

    // Confirm the reservation (final status update)
    await db
      .update(reservations)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(reservations.id, pendingReservation.id));

    // Fire-and-forget confirmation email
    const propertyForEmail = await db.query.properties.findFirst({
      where: eq(properties.slug, propertySlug),
    });
    if (propertyForEmail) {
      void sendBookingConfirmation({
        reservationId: pendingReservation.id,
        propertyId: data.propertyId,
        guestEmail: data.email.toLowerCase(),
        guestFirstName: data.firstName,
        confirmationCode: reservationCode,
        propertyName: propertyForEmail.name,
        propertyAddress: [propertyForEmail.address, propertyForEmail.city, propertyForEmail.country]
          .filter(Boolean)
          .join(", "),
        propertyPhone: propertyForEmail.phone ?? undefined,
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
        manageUrl: buildManageUrl(reservationCode, pendingReservation.manageToken ?? ""),
      });
    }

    revalidatePath("/dashboard");
    redirect(`/${propertySlug}?step=complete&code=${reservationCode}`);
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" ||
        (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }

    // Cancel pending reservation and rollback inventory
    await db
      .update(reservations)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: "error",
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, pendingReservation.id));

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
