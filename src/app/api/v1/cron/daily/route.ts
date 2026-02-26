import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, reviewTokens } from "@/db/schema";
import { eq, and, inArray, isNull, gt } from "drizzle-orm";
import { sendPreArrival, sendReviewRequest } from "@/lib/email";
import { buildReviewUrl } from "@/lib/reviews";

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
      checkIn: res.checkIn,
      checkInTime: res.property.checkInTime ?? undefined,
      roomTypeName,
      confirmationCode: res.confirmationCode,
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

  return NextResponse.json({
    processed: {
      preArrival: preArrivalCount,
      reviewRequests: reviewRequestCount,
    },
  });
}
