import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, reviewTokens, payments, scheduledChargeLog } from "@/db/schema";
import { eq, and, inArray, isNull, gt, lte, lt, isNotNull } from "drizzle-orm";
import { sendPreArrival, sendReviewRequest } from "@/lib/email";
import { buildReviewUrl } from "@/lib/reviews";
import { chargeWithSavedMethod } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTomorrow(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getTwoDaysAgo(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = getTomorrow();
  const twoDaysAgo = getTwoDaysAgo();
  const now = new Date();

  let preArrivalCount = 0;
  let reviewRequestCount = 0;

  // ─── Pre-arrival job ─────────────────────────────────────────────────────

  const checkInReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.checkIn, tomorrow),
      inArray(reservations.status, ["confirmed", "checked_in"])
    ),
    with: {
      guest: true,
      property: true,
      reservationRooms: { with: { roomType: true }, limit: 1 },
      emailLogs: true,
    },
  });

  for (const res of checkInReservations) {
    // Skip if already sent a pre_arrival email for this reservation
    const alreadySent = res.emailLogs.some((l) => l.type === "pre_arrival");
    if (alreadySent) continue;
    if (!res.guest || !res.property) continue;

    const roomTypeName =
      res.reservationRooms[0]?.roomType?.name ?? "your room";

    await sendPreArrival({
      reservationId: res.id,
      propertyId: res.propertyId,
      guestEmail: res.guest.email,
      guestFirstName: res.guest.firstName,
      propertyName: res.property.name,
      propertyAddress: [
        res.property.address,
        res.property.city,
        res.property.country,
      ]
        .filter(Boolean)
        .join(", "),
      propertyPhone: res.property.phone ?? undefined,
      checkIn: res.checkIn,
      checkInTime: res.property.checkInTime ?? undefined,
      roomTypeName,
      confirmationCode: res.confirmationCode,
      checkInInstructions: res.property.checkInInstructions ?? undefined,
    });

    preArrivalCount++;
  }

  // ─── Review request job ───────────────────────────────────────────────────

  const pendingTokens = await db.query.reviewTokens.findMany({
    where: and(
      isNull(reviewTokens.usedAt),
      gt(reviewTokens.expiresAt, now)
    ),
    with: {
      reservation: {
        with: {
          guest: true,
          property: true,
          emailLogs: true,
        },
      },
    },
  });

  for (const tokenRow of pendingTokens) {
    const res = tokenRow.reservation;
    if (!res) continue;
    if (res.status !== "checked_out") continue;
    if (res.checkOut > twoDaysAgo) continue; // not yet 2 days ago
    if (!res.guest || !res.property) continue;

    // Skip if already sent review_request for this reservation
    const alreadySent = res.emailLogs.some((l) => l.type === "review_request");
    if (alreadySent) continue;

    await sendReviewRequest({
      reservationId: res.id,
      propertyId: res.propertyId,
      guestEmail: res.guest.email,
      guestFirstName: res.guest.firstName,
      propertyName: res.property.name,
      reviewUrl: buildReviewUrl(tokenRow.token),
    });

    reviewRequestCount++;
  }

  // ─── Scheduled charges job ────────────────────────────────────────────────

  let scheduledChargeCount = 0;
  let scheduledChargeFailCount = 0;

  const duePayments = await db.query.payments.findMany({
    where: and(
      isNotNull(payments.scheduledChargeAt),
      lte(payments.scheduledChargeAt, now),
      eq(payments.status, "pending"),
      lt(payments.chargeAttempts, 3),
      isNotNull(payments.stripePaymentMethodId),
      isNotNull(payments.stripeCustomerId)
    ),
    with: {
      reservation: {
        with: { guest: true, property: true },
      },
    },
  });

  for (const payment of duePayments) {
    if (!payment.stripePaymentMethodId || !payment.stripeCustomerId) continue;

    const result = await chargeWithSavedMethod(
      payment.stripeCustomerId,
      payment.stripePaymentMethodId,
      payment.amountCents,
      payment.currency,
      payment.reservationId
    );

    if (result.success) {
      await db
        .update(payments)
        .set({
          status: "captured",
          capturedAt: now,
          stripePaymentIntentId: result.paymentIntentId ?? null,
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id));

      await db.insert(scheduledChargeLog).values({
        paymentId: payment.id,
        status: "succeeded",
      });

      scheduledChargeCount++;
    } else {
      const newAttempts = payment.chargeAttempts + 1;
      const backoffDays = Math.pow(2, newAttempts);
      const nextChargeAt = new Date(now);
      nextChargeAt.setUTCDate(nextChargeAt.getUTCDate() + backoffDays);

      await db
        .update(payments)
        .set({
          chargeAttempts: newAttempts,
          scheduledChargeAt: newAttempts < 3 ? nextChargeAt : null,
          status: newAttempts >= 3 ? "failed" : "pending",
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id));

      await db.insert(scheduledChargeLog).values({
        paymentId: payment.id,
        status: "failed",
        errorMessage: result.error ?? "Unknown error",
      });

      scheduledChargeFailCount++;
    }
  }

  return NextResponse.json({
    processed: {
      preArrival: preArrivalCount,
      reviewRequests: reviewRequestCount,
      scheduledCharges: scheduledChargeCount,
      scheduledChargeFails: scheduledChargeFailCount,
    },
  });
}
