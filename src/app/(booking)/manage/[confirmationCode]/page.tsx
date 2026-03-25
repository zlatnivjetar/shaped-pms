import { CircleAlert, Link2Off, ShieldAlert } from "lucide-react";
import { eq } from "drizzle-orm";
import { PublicStateCard } from "@/components/public/public-state-card";
import { DetailRow } from "@/components/ui/detail-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEmailDate } from "@/components/emails/shared";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { calculateRefundAmount } from "@/lib/cancellation";
import { RESERVATION_STATUS_STYLES } from "@/lib/status-styles";
import GuestCancelButton from "./cancel-button";
import { bookingCardClassName } from "@/components/booking/styles";

interface Props {
  params: Promise<{ confirmationCode: string }>;
  searchParams: Promise<{ token?: string }>;
}

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export default async function ManageBookingPage({
  params,
  searchParams,
}: Props) {
  const { confirmationCode } = await params;
  const { token } = await searchParams;

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.confirmationCode, confirmationCode),
    with: {
      property: true,
      guest: true,
      reservationRooms: { with: { roomType: true } },
      payments: true,
    },
  });

  if (!reservation || !token || reservation.manageToken !== token) {
    return (
      <main className="min-h-screen bg-booking-background px-4 py-12">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <PublicStateCard
            icon={Link2Off}
            eyebrow="Manage booking"
            title="Invalid link"
            description="This link is invalid or has expired. Please use the manage link from your confirmation email."
            tone="warning"
            className="bg-booking-card"
            actionHref="/"
            actionLabel="Go home"
          />
        </div>
      </main>
    );
  }

  const { property, guest, reservationRooms, payments } = reservation;

  if (!property || !guest) {
    return (
      <main className="min-h-screen bg-booking-background px-4 py-12">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <PublicStateCard
            icon={ShieldAlert}
            eyebrow="Manage booking"
            title="Something went wrong"
            description="We couldn’t load the details for this booking. Please contact the property directly for help."
            tone="destructive"
            className="bg-booking-card"
            actionHref="/"
            actionLabel="Return home"
          />
        </div>
      </main>
    );
  }

  const roomTypeName = reservationRooms[0]?.roomType?.name ?? "Accommodation";
  const capturedPayment = payments.find((payment) => payment.status === "captured");
  const paidCents = capturedPayment?.amountCents ?? 0;
  const currency = property.currency;

  let refundPreview: { refundCents: number; refundNote: string } | null = null;
  if (reservation.status === "confirmed") {
    const checkInDate = new Date(`${reservation.checkIn}T00:00:00Z`);
    refundPreview = calculateRefundAmount(
      property.cancellationPolicy,
      property.cancellationDeadlineDays,
      checkInDate,
      paidCents,
      currency,
    );
  }

  const policyLabel: Record<string, string> = {
    flexible: "Flexible",
    moderate: "Moderate",
    strict: "Strict",
  };

  return (
    <main className="min-h-screen bg-booking-background">
      <header className="border-b border-border bg-booking-background">
        <div className="mx-auto max-w-lg px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-booking-accent">
            {property.city}
            {property.country ? `, ${property.country}` : ""}
          </p>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {property.name}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <section className={`${bookingCardClassName} space-y-5 p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-booking-accent">
                Manage booking
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Your stay</h2>
            </div>
            <StatusBadge
              status={reservation.status}
              styleMap={RESERVATION_STATUS_STYLES}
              dot
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-4 py-5 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Confirmation code
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.28em] text-foreground">
              {reservation.confirmationCode}
            </p>
          </div>

          <div className="space-y-0.5">
            <DetailRow label="Guest" value={`${guest.firstName} ${guest.lastName}`} />
            <DetailRow label="Email" value={guest.email} />
            <DetailRow label="Room" value={roomTypeName} />
            <DetailRow label="Check-in" value={formatEmailDate(reservation.checkIn)} />
            <DetailRow label="Check-out" value={formatEmailDate(reservation.checkOut)} />
            <DetailRow
              label="Duration"
              value={`${reservation.nights} night${reservation.nights !== 1 ? "s" : ""}`}
            />
            <DetailRow
              label="Guests"
              value={`${reservation.adults} adult${reservation.adults !== 1 ? "s" : ""}${reservation.children > 0 ? `, ${reservation.children} ${reservation.children === 1 ? "child" : "children"}` : ""}`}
            />
            {property.checkInTime && (
              <DetailRow label="Arrival from" value={property.checkInTime} muted />
            )}
            {property.checkOutTime && (
              <DetailRow label="Departure by" value={property.checkOutTime} muted />
            )}
            {paidCents > 0 && (
              <DetailRow
                label="Amount paid"
                value={formatCurrency(paidCents, currency)}
              />
            )}
          </div>
        </section>

        {reservation.status === "confirmed" && refundPreview && (
          <section className={`${bookingCardClassName} space-y-4 p-6`}>
            <div>
              <h2 className="text-base font-semibold text-foreground">Cancellation policy</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the refund available before you cancel this reservation.
              </p>
            </div>

            <div className="space-y-0.5">
              <DetailRow label="Policy" value={policyLabel[property.cancellationPolicy]} />
              <DetailRow
                label="Free cancellation"
                value={`${property.cancellationDeadlineDays} day${property.cancellationDeadlineDays !== 1 ? "s" : ""} before check-in`}
              />
              <DetailRow
                label="Refund now"
                value={formatCurrency(refundPreview.refundCents, currency)}
              />
            </div>

            <div className="rounded-lg border border-destructive/15 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">If you cancel now</p>
                  <p className="text-muted-foreground">{refundPreview.refundNote}</p>
                </div>
              </div>
            </div>

            <GuestCancelButton confirmationCode={confirmationCode} token={token} />
          </section>
        )}

        {reservation.status === "cancelled" && (
          <PublicStateCard
            icon={CircleAlert}
            eyebrow="Manage booking"
            title="Booking cancelled"
            description={
              <>
                This booking was cancelled
                {reservation.cancelledAt
                  ? ` on ${new Date(reservation.cancelledAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`
                  : ""}
                .
                {reservation.cancellationReason
                  ? ` Reason: ${reservation.cancellationReason}`
                  : ""}
              </>
            }
            tone="warning"
            className="bg-booking-card"
            actionHref={`/${property.slug}`}
            actionLabel="Book another stay"
          />
        )}

        {(reservation.status === "checked_in" ||
          reservation.status === "checked_out" ||
          reservation.status === "no_show") && (
          <PublicStateCard
            icon={CircleAlert}
            eyebrow="Manage booking"
            title={
              reservation.status === "checked_in"
                ? "Stay already in progress"
                : reservation.status === "checked_out"
                  ? "Stay completed"
                  : "Reservation marked no-show"
            }
            description={
              reservation.status === "checked_in"
                ? "You’re currently checked in. Please contact the property directly for any changes."
                : reservation.status === "checked_out"
                  ? "This stay has been completed. Thank you for staying with us."
                  : "This reservation is marked as a no-show. Please contact the property directly if you believe this is incorrect."
            }
            tone="info"
            className="bg-booking-card"
            actionHref={`/${property.slug}`}
            actionLabel="Book another stay"
          />
        )}
      </div>
    </main>
  );
}
