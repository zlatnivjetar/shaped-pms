import { randomBytes } from "crypto";
import { formatCurrency } from "@/components/emails/shared";

export function generateManageToken(): string {
  return randomBytes(24).toString("hex"); // 48-char hex, URL-safe
}

export function buildManageUrl(
  confirmationCode: string,
  token: string
): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://shaped-pms.vercel.app";
  return `${base}/manage/${confirmationCode}?token=${token}`;
}

export function calculateRefundAmount(
  policy: "flexible" | "moderate" | "strict",
  deadlineDays: number,
  checkIn: Date,
  paidCents: number,
  currency: string = "EUR"
): { refundCents: number; refundNote: string } {
  if (policy === "strict") {
    return {
      refundCents: 0,
      refundNote: "No refund per strict cancellation policy.",
    };
  }

  const now = new Date();
  // Strip time — compare calendar days in UTC
  const todayMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const checkInMs = Date.UTC(
    checkIn.getUTCFullYear(),
    checkIn.getUTCMonth(),
    checkIn.getUTCDate()
  );
  const daysUntilCheckIn = Math.floor(
    (checkInMs - todayMs) / (1000 * 60 * 60 * 24)
  );

  const beforeDeadline = daysUntilCheckIn >= deadlineDays;

  if (policy === "flexible") {
    if (beforeDeadline) {
      return {
        refundCents: paidCents,
        refundNote: `Full refund of ${formatCurrency(paidCents, currency)} has been initiated to your original payment method.`,
      };
    }
    return {
      refundCents: 0,
      refundNote: `No refund — cancellation was made less than ${deadlineDays} day${deadlineDays !== 1 ? "s" : ""} before check-in.`,
    };
  }

  // moderate
  if (beforeDeadline) {
    const halfCents = Math.floor(paidCents / 2);
    return {
      refundCents: halfCents,
      refundNote: `50% refund of ${formatCurrency(halfCents, currency)} has been initiated to your original payment method.`,
    };
  }
  return {
    refundCents: 0,
    refundNote: `No refund — cancellation was made less than ${deadlineDays} day${deadlineDays !== 1 ? "s" : ""} before check-in.`,
  };
}
