import { Resend } from "resend";
import { render } from "@react-email/components";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import BookingConfirmation from "@/components/emails/booking-confirmation";
import PreArrival from "@/components/emails/pre-arrival";
import PostStay from "@/components/emails/post-stay";
import ReviewRequest from "@/components/emails/review-request";
import Cancellation from "@/components/emails/cancellation";

// ─── Lazy Resend singleton ─────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL ?? "Preelook Apartments <hello@preelook.com>"
  );
}

// ─── Internal send + log ───────────────────────────────────────────────────

interface SendAndLogParams {
  reservationId: string;
  propertyId: string;
  type:
    | "confirmation"
    | "pre_arrival"
    | "post_stay"
    | "review_request"
    | "cancellation";
  to: string;
  subject: string;
  react: React.ReactElement;
}

async function sendAndLog(params: SendAndLogParams): Promise<boolean> {
  const now = new Date();
  let status: "sent" | "failed" = "failed";

  try {
    const html = await render(params.react);
    await getResend().emails.send({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html,
    });
    status = "sent";
    return true;
  } catch (err) {
    console.error(`[email] Failed to send ${params.type}:`, err);
    return false;
  } finally {
    try {
      await db.insert(emailLogs).values({
        reservationId: params.reservationId,
        propertyId: params.propertyId,
        type: params.type,
        recipientEmail: params.to,
        subject: params.subject,
        status,
        sentAt: now,
      });
    } catch (logErr) {
      console.error("[email] Failed to write email log:", logErr);
    }
  }
}

// ─── Named email senders ───────────────────────────────────────────────────

export async function sendBookingConfirmation(params: {
  reservationId: string;
  propertyId: string;
  guestEmail: string;
  guestFirstName: string;
  confirmationCode: string;
  propertyName: string;
  propertyAddress?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomTypeName: string;
  totalCents: number;
  currency: string;
  amountPaidCents: number;
  paymentType: "deposit" | "full_payment";
  checkInTime?: string;
}): Promise<boolean> {
  // Guard: only send if no prior confirmation log for this reservation
  const existing = await db.query.emailLogs.findFirst({
    where: and(
      eq(emailLogs.reservationId, params.reservationId),
      eq(emailLogs.type, "confirmation")
    ),
  });
  if (existing) return false;

  return sendAndLog({
    reservationId: params.reservationId,
    propertyId: params.propertyId,
    type: "confirmation",
    to: params.guestEmail,
    subject: `Booking confirmed: ${params.confirmationCode} · ${params.propertyName}`,
    react: BookingConfirmation({
      guestFirstName: params.guestFirstName,
      confirmationCode: params.confirmationCode,
      propertyName: params.propertyName,
      propertyAddress: params.propertyAddress,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights: params.nights,
      roomTypeName: params.roomTypeName,
      totalCents: params.totalCents,
      currency: params.currency,
      amountPaidCents: params.amountPaidCents,
      paymentType: params.paymentType,
      checkInTime: params.checkInTime,
    }),
  });
}

export async function sendCancellationConfirmation(params: {
  reservationId: string;
  propertyId: string;
  guestEmail: string;
  guestFirstName: string;
  confirmationCode: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  cancellationReason?: string;
  refundNote?: string;
}): Promise<boolean> {
  return sendAndLog({
    reservationId: params.reservationId,
    propertyId: params.propertyId,
    type: "cancellation",
    to: params.guestEmail,
    subject: `Booking cancelled: ${params.confirmationCode} · ${params.propertyName}`,
    react: Cancellation({
      guestFirstName: params.guestFirstName,
      confirmationCode: params.confirmationCode,
      propertyName: params.propertyName,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      cancellationReason: params.cancellationReason,
      refundNote: params.refundNote,
    }),
  });
}

export async function sendPreArrival(params: {
  reservationId: string;
  propertyId: string;
  guestEmail: string;
  guestFirstName: string;
  propertyName: string;
  propertyAddress?: string;
  checkIn: string;
  checkInTime?: string;
  roomTypeName: string;
  confirmationCode: string;
}): Promise<boolean> {
  return sendAndLog({
    reservationId: params.reservationId,
    propertyId: params.propertyId,
    type: "pre_arrival",
    to: params.guestEmail,
    subject: `Your check-in tomorrow at ${params.propertyName}`,
    react: PreArrival({
      guestFirstName: params.guestFirstName,
      propertyName: params.propertyName,
      propertyAddress: params.propertyAddress,
      checkIn: params.checkIn,
      checkInTime: params.checkInTime,
      roomTypeName: params.roomTypeName,
      confirmationCode: params.confirmationCode,
    }),
  });
}

export async function sendPostStay(params: {
  reservationId: string;
  propertyId: string;
  guestEmail: string;
  guestFirstName: string;
  propertyName: string;
  checkOut: string;
  reviewUrl: string;
  confirmationCode: string;
}): Promise<boolean> {
  return sendAndLog({
    reservationId: params.reservationId,
    propertyId: params.propertyId,
    type: "post_stay",
    to: params.guestEmail,
    subject: `Thank you for staying at ${params.propertyName}`,
    react: PostStay({
      guestFirstName: params.guestFirstName,
      propertyName: params.propertyName,
      checkOut: params.checkOut,
      reviewUrl: params.reviewUrl,
      confirmationCode: params.confirmationCode,
    }),
  });
}

export async function sendReviewRequest(params: {
  reservationId: string;
  propertyId: string;
  guestEmail: string;
  guestFirstName: string;
  propertyName: string;
  reviewUrl: string;
}): Promise<boolean> {
  return sendAndLog({
    reservationId: params.reservationId,
    propertyId: params.propertyId,
    type: "review_request",
    to: params.guestEmail,
    subject: `How was your stay at ${params.propertyName}?`,
    react: ReviewRequest({
      guestFirstName: params.guestFirstName,
      propertyName: params.propertyName,
      reviewUrl: params.reviewUrl,
    }),
  });
}
