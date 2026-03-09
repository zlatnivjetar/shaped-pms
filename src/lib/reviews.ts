import { randomBytes } from "crypto";
import type { ReviewSource } from "@/db/schema";

export function generateReviewToken(): string {
  return randomBytes(24).toString("hex"); // 48-char hex, URL-safe
}

export function getReviewTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export function buildReviewUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://shaped-pms.vercel.app";
  return `${base}/review/${token}`;
}

// Normalize a raw OTA rating to the 1–5 integer scale used in the reviews table.
// Booking.com uses 0–10; all others use 1–5.
export function normalizeOtaRating(
  rawRating: number,
  source: ReviewSource
): number {
  let normalized: number;
  if (source === "booking_com") {
    normalized = rawRating / 2;
  } else {
    normalized = rawRating;
  }
  return Math.min(5, Math.max(1, Math.round(normalized)));
}

export const SOURCE_LABELS: Record<ReviewSource, string> = {
  direct: "Direct",
  booking_com: "Booking.com",
  google: "Google",
  tripadvisor: "TripAdvisor",
  airbnb: "Airbnb",
  expedia: "Expedia",
};
