"use server";

import { db } from "@/db";
import { reservations, inventory, payments } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { calculateRefundAmount } from "@/lib/cancellation";
import { refundPayment, cancelPaymentIntent } from "@/lib/payments";
import { sendCancellationConfirmation } from "@/lib/email";

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

export async function guestCancelReservation(
  confirmationCode: string,
  token: string,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  // Re-fetch + re-validate token (never trust client)
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.confirmationCode, confirmationCode),
    with: {
      property: true,
      guest: true,
      reservationRooms: true,
      payments: true,
    },
  });

  if (!reservation) {
    return { error: "Booking not found." };
  }

  if (!token || reservation.manageToken !== token) {
    return { error: "Invalid or expired link." };
  }

  if (reservation.status !== "confirmed") {
    return {
      error: "This booking cannot be cancelled. Current status: " + reservation.status,
    };
  }

  const { property, guest, reservationRooms } = reservation;
  if (!property || !guest) {
    return { error: "Booking data is incomplete." };
  }

  // Find captured payment (if any)
  const capturedPayment = reservation.payments.find(
    (p) => p.status === "captured"
  );
  const requiresCapturePayment = reservation.payments.find(
    (p) => p.status === "requires_capture"
  );

  const paidCents = capturedPayment?.amountCents ?? 0;
  const checkInDate = new Date(reservation.checkIn + "T00:00:00Z");

  // Calculate refund based on policy
  const { refundCents, refundNote } = calculateRefundAmount(
    property.cancellationPolicy,
    property.cancellationDeadlineDays,
    checkInDate,
    paidCents,
    property.currency
  );

  // Inventory rollback for each room type
  for (const rr of reservationRooms) {
    const nights = buildNightList(reservation.checkIn, reservation.checkOut);
    if (nights.length > 0) {
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
  }

  // Handle Stripe refund / cancellation
  if (capturedPayment) {
    if (refundCents > 0 && capturedPayment.stripePaymentIntentId) {
      const result = await refundPayment(
        capturedPayment.stripePaymentIntentId,
        refundCents
      );
      if (!result.success) {
        return { error: result.error ?? "Refund failed. Please contact the property." };
      }
    }
    await db
      .update(payments)
      .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, capturedPayment.id));
  } else if (requiresCapturePayment?.stripePaymentIntentId) {
    // Deposit not yet captured — void it
    await cancelPaymentIntent(requiresCapturePayment.stripePaymentIntentId);
    await db
      .update(payments)
      .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, requiresCapturePayment.id));
  }

  // Handle scheduled payment (pending, card saved) — just cancel without Stripe call
  const pendingScheduledPayment = reservation.payments.find(
    (p) => p.status === "pending" && p.stripeSetupIntentId
  );
  if (pendingScheduledPayment) {
    await db
      .update(payments)
      .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, pendingScheduledPayment.id));
  }

  // Update reservation
  await db
    .update(reservations)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason ?? "Guest self-service cancellation",
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, reservation.id));

  // Fire-and-forget cancellation email
  void sendCancellationConfirmation({
    reservationId: reservation.id,
    propertyId: reservation.propertyId,
    guestEmail: guest.email,
    guestFirstName: guest.firstName,
    confirmationCode: reservation.confirmationCode,
    propertyName: property.name,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    cancellationReason: reason,
    refundNote,
  });

  return { success: true };
}
