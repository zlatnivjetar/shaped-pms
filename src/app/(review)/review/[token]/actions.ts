"use server";

import { db } from "@/db";
import { reviewTokens, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function submitReview(
  token: string,
  data: { rating: number; title?: string; body: string }
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5." };
  }
  if (!data.body || data.body.trim().length < 10) {
    return {
      success: false,
      error: "Review must be at least 10 characters.",
    };
  }

  // Load token
  const tokenRow = await db.query.reviewTokens.findFirst({
    where: eq(reviewTokens.token, token),
    with: {
      reservation: {
        with: {
          guest: true,
          property: true,
        },
      },
    },
  });

  if (!tokenRow) {
    return { success: false, error: "Invalid review link." };
  }
  if (tokenRow.usedAt) {
    return { success: false, error: "This review link has already been used." };
  }
  if (new Date(tokenRow.expiresAt) < new Date()) {
    return { success: false, error: "This review link has expired." };
  }

  const reservation = tokenRow.reservation;
  if (!reservation || !reservation.guest) {
    return { success: false, error: "Reservation not found." };
  }

  // Insert review
  await db.insert(reviews).values({
    propertyId: tokenRow.propertyId,
    reservationId: tokenRow.reservationId,
    guestId: reservation.guestId,
    reviewTokenId: tokenRow.id,
    rating: data.rating,
    title: data.title?.trim() || null,
    body: data.body.trim(),
    stayDateStart: reservation.checkIn,
    stayDateEnd: reservation.checkOut,
    status: "pending",
  });

  // Mark token as used
  await db
    .update(reviewTokens)
    .set({ usedAt: new Date() })
    .where(eq(reviewTokens.id, tokenRow.id));

  return { success: true };
}
