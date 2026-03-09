import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatEmailDate } from "@/components/emails/shared";
import { calculateRefundAmount } from "@/lib/cancellation";
import GuestCancelButton from "./cancel-button";

interface Props {
  params: Promise<{ confirmationCode: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ManageBookingPage({
  params,
  searchParams,
}: Props) {
  const { confirmationCode } = await params;
  const { token } = await searchParams;

  // Always query — but only expose data if token matches
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.confirmationCode, confirmationCode),
    with: {
      property: true,
      guest: true,
      reservationRooms: { with: { roomType: true } },
      payments: true,
    },
  });

  // Invalid token or reservation not found — show error without exposing data
  if (!reservation || !token || reservation.manageToken !== token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-8 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl font-semibold text-stone-800">
            Invalid link
          </h1>
          <p className="text-stone-500">
            This link is invalid or has expired. Please check your confirmation
            email for the correct manage link.
          </p>
        </div>
      </main>
    );
  }

  const { property, guest, reservationRooms, payments } = reservation;
  if (!property || !guest) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-stone-800">
            Something went wrong
          </h1>
          <p className="text-stone-500">Please contact the property directly.</p>
        </div>
      </main>
    );
  }

  const roomTypeName =
    reservationRooms[0]?.roomType?.name ?? "Accommodation";

  const capturedPayment = payments.find((p) => p.status === "captured");
  const paidCents = capturedPayment?.amountCents ?? 0;
  const currency = property.currency;

  // Compute refund preview for confirmed reservations
  let refundPreview: { refundCents: number; refundNote: string } | null = null;
  if (reservation.status === "confirmed") {
    const checkInDate = new Date(reservation.checkIn + "T00:00:00Z");
    refundPreview = calculateRefundAmount(
      property.cancellationPolicy,
      property.cancellationDeadlineDays,
      checkInDate,
      paidCents,
      currency
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    checked_out: "Checked Out",
    cancelled: "Cancelled",
    no_show: "No Show",
  };

  const policyLabel: Record<string, string> = {
    flexible: "Flexible",
    moderate: "Moderate",
    strict: "Strict",
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-[#1E3A8A]">
            {property.city}
            {property.country ? `, ${property.country}` : ""}
          </p>
          <h1 className="text-xl font-semibold text-stone-900 font-[family-name:--font-playfair]">
            {property.name}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        {/* Booking summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-800">
              Your Booking
            </h2>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                reservation.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : reservation.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-stone-100 text-stone-600"
              }`}
            >
              {statusLabel[reservation.status] ?? reservation.status}
            </span>
          </div>

          <div className="text-center py-2">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
              Confirmation Code
            </p>
            <p className="text-2xl font-[family-name:--font-playfair] font-semibold tracking-widest text-stone-900">
              {reservation.confirmationCode}
            </p>
          </div>

          <div className="border-t border-stone-100 pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                Check-in
              </p>
              <p className="font-medium text-stone-800">
                {formatEmailDate(reservation.checkIn)}
              </p>
              {property.checkInTime && (
                <p className="text-stone-500 text-xs">
                  from {property.checkInTime}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                Check-out
              </p>
              <p className="font-medium text-stone-800">
                {formatEmailDate(reservation.checkOut)}
              </p>
              {property.checkOutTime && (
                <p className="text-stone-500 text-xs">
                  by {property.checkOutTime}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Room</span>
              <span className="font-medium text-stone-800">{roomTypeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Duration</span>
              <span className="font-medium text-stone-800">
                {reservation.nights} night
                {reservation.nights !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Guests</span>
              <span className="font-medium text-stone-800">
                {reservation.adults} adult
                {reservation.adults !== 1 ? "s" : ""}
                {reservation.children > 0
                  ? `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}`
                  : ""}
              </span>
            </div>
            {paidCents > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-500">Amount paid</span>
                <span className="font-medium text-stone-800">
                  {new Intl.NumberFormat("en-EU", {
                    style: "currency",
                    currency,
                  }).format(paidCents / 100)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation section — only for confirmed reservations */}
        {reservation.status === "confirmed" && refundPreview && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-stone-800">
              Cancellation Policy
            </h2>
            <div className="text-sm space-y-2 text-stone-600">
              <div className="flex justify-between">
                <span>Policy</span>
                <span className="font-medium text-stone-800">
                  {policyLabel[property.cancellationPolicy]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Free cancellation deadline</span>
                <span className="font-medium text-stone-800">
                  {property.cancellationDeadlineDays} day
                  {property.cancellationDeadlineDays !== 1 ? "s" : ""} before
                  check-in
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 text-sm">
              <p className="font-medium text-stone-700 mb-1">
                If you cancel now:
              </p>
              <p className="text-stone-600">{refundPreview.refundNote}</p>
            </div>

            <GuestCancelButton
              confirmationCode={confirmationCode}
              token={token}
            />
          </div>
        )}

        {/* Already cancelled state */}
        {reservation.status === "cancelled" && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 text-center space-y-2">
            <p className="text-stone-500 text-sm">
              This booking was cancelled
              {reservation.cancelledAt
                ? ` on ${new Date(reservation.cancelledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
                : ""}
              .
            </p>
            {reservation.cancellationReason && (
              <p className="text-stone-400 text-xs">
                Reason: {reservation.cancellationReason}
              </p>
            )}
          </div>
        )}

        {/* Other terminal states */}
        {(reservation.status === "checked_in" ||
          reservation.status === "checked_out" ||
          reservation.status === "no_show") && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 text-center">
            <p className="text-stone-500 text-sm">
              {reservation.status === "checked_in"
                ? "You're currently checked in. Please contact the property for any changes."
                : "This booking has been completed. Thank you for staying with us!"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
