"use server";

import { db } from "@/db";
import {
  reservations,
  inventory,
  payments,
  reviewTokens,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  capturePaymentIntent,
  refundPayment,
  cancelPaymentIntent,
} from "@/lib/payments";
import {
  sendCancellationConfirmation,
  sendPostStay,
} from "@/lib/email";
import {
  generateReviewToken,
  getReviewTokenExpiry,
  buildReviewUrl,
} from "@/lib/reviews";
import { formatCurrency } from "@/components/emails/shared";

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

async function rollbackInventory(
  propertyId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string
) {
  const nights = buildNightList(checkIn, checkOut);
  if (nights.length === 0) return;

  await db
    .update(inventory)
    .set({
      bookedUnits: sql`GREATEST(0, ${inventory.bookedUnits} - 1)`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.propertyId, propertyId),
        eq(inventory.roomTypeId, roomTypeId),
        inArray(inventory.date, nights)
      )
    );
}

export async function confirmReservation(id: string) {
  await db
    .update(reservations)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(reservations.id, id));
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
}

export async function checkInReservation(id: string) {
  await db
    .update(reservations)
    .set({ status: "checked_in", updatedAt: new Date() })
    .where(eq(reservations.id, id));
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
}

export async function checkOutReservation(id: string) {
  await db
    .update(reservations)
    .set({ status: "checked_out", updatedAt: new Date() })
    .where(eq(reservations.id, id));

  // Generate review token + send post-stay email
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: {
      guest: true,
      reservationRooms: { with: { roomType: true }, limit: 1 },
      property: true,
    },
  });

  if (reservation?.guest && reservation.property) {
    const token = generateReviewToken();
    const [tokenRow] = await db
      .insert(reviewTokens)
      .values({
        reservationId: id,
        propertyId: reservation.propertyId,
        token,
        expiresAt: getReviewTokenExpiry(),
      })
      .returning({ id: reviewTokens.id });

    if (tokenRow) {
      void sendPostStay({
        reservationId: id,
        propertyId: reservation.propertyId,
        guestEmail: reservation.guest.email,
        guestFirstName: reservation.guest.firstName,
        propertyName: reservation.property.name,
        checkOut: reservation.checkOut,
        reviewUrl: buildReviewUrl(token),
        confirmationCode: reservation.confirmationCode,
      });
    }
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
}

export async function cancelReservation(
  id: string,
  reason?: string
): Promise<void> {
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: { reservationRooms: true, guest: true, property: true },
  });
  if (!reservation) return;

  // Rollback inventory for each booked room type
  for (const rr of reservation.reservationRooms) {
    await rollbackInventory(
      reservation.propertyId,
      rr.roomTypeId,
      reservation.checkIn,
      reservation.checkOut
    );
  }

  // Handle payment refund / cancellation
  const payment = await db.query.payments.findFirst({
    where: eq(payments.reservationId, id),
  });

  let refundNote: string | undefined;
  if (payment) {
    if (payment.status === "captured") {
      await refundPayment(payment.stripePaymentIntentId);
      await db
        .update(payments)
        .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
        .where(eq(payments.id, payment.id));
      refundNote = `A refund of ${formatCurrency(payment.amountCents, payment.currency)} has been initiated to your original payment method.`;
    } else if (payment.status === "requires_capture") {
      await cancelPaymentIntent(payment.stripePaymentIntentId);
      await db
        .update(payments)
        .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
        .where(eq(payments.id, payment.id));
    }
  }

  await db
    .update(reservations)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason ?? null,
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
      cancellationReason: reason,
      refundNote,
    });
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
}

export async function markNoShow(id: string): Promise<void> {
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: { reservationRooms: true },
  });
  if (!reservation) return;

  for (const rr of reservation.reservationRooms) {
    await rollbackInventory(
      reservation.propertyId,
      rr.roomTypeId,
      reservation.checkIn,
      reservation.checkOut
    );
  }

  await db
    .update(reservations)
    .set({ status: "no_show", updatedAt: new Date() })
    .where(eq(reservations.id, id));

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
}

export async function capturePaymentAction(
  paymentId: string,
  stripePaymentIntentId: string,
  reservationId: string
): Promise<{ error?: string }> {
  const result = await capturePaymentIntent(stripePaymentIntentId);
  if (!result.success) {
    return { error: result.error ?? "Capture failed." };
  }
  await db
    .update(payments)
    .set({ status: "captured", capturedAt: new Date(), updatedAt: new Date() })
    .where(eq(payments.id, paymentId));

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  return {};
}

export async function refundPaymentAction(
  paymentId: string,
  stripePaymentIntentId: string,
  reservationId: string,
  amountCents?: number
): Promise<{ error?: string }> {
  const result = await refundPayment(stripePaymentIntentId, amountCents);
  if (!result.success) {
    return { error: result.error ?? "Refund failed." };
  }
  await db
    .update(payments)
    .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
    .where(eq(payments.id, paymentId));

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  return {};
}
