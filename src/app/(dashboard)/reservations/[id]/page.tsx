import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RESERVATION_STATUS_STYLES, PAYMENT_STATUS_STYLES, CHANNEL_LABELS } from "@/lib/status-styles";
import ReservationActions from "./reservation-actions";
import PaymentActions from "./payment-actions";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: {
      guest: true,
      reservationRooms: {
        with: {
          roomType: true,
          room: true,
        },
      },
      payments: {
        with: {
          scheduledChargeLogs: {
            orderBy: (logs, { desc }) => [desc(logs.attemptedAt)],
          },
        },
      },
    },
  });

  if (!reservation) notFound();

  const rr = reservation.reservationRooms[0];
  const roomTypeName = rr?.roomType?.name ?? "—";
  const roomNumber = rr?.room?.roomNumber;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Back link */}
      <Link
        href="/reservations"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        ← Reservations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-mono">
            {reservation.confirmationCode}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Booked via {CHANNEL_LABELS[reservation.channel] ?? reservation.channel} ·{" "}
            {new Date(reservation.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={reservation.status} styleMap={RESERVATION_STATUS_STYLES} className="text-sm px-3 py-1" />
      </div>

      {/* Status actions */}
      <ReservationActions
        id={reservation.id}
        status={reservation.status}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Guest info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Guest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {reservation.guest ? (
              <>
                <p className="font-semibold text-base">
                  {reservation.guest.firstName} {reservation.guest.lastName}
                </p>
                <p className="text-muted-foreground">{reservation.guest.email}</p>
                {reservation.guest.phone && (
                  <p className="text-muted-foreground">{reservation.guest.phone}</p>
                )}
                {reservation.guest.country && (
                  <p className="text-muted-foreground">{reservation.guest.country}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No guest info</p>
            )}
          </CardContent>
        </Card>

        {/* Stay details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Stay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-base">{roomTypeName}</p>
            {roomNumber && (
              <p className="text-muted-foreground">Room {roomNumber}</p>
            )}
            <div className="pt-1 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span>{formatDate(reservation.checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span>{formatDate(reservation.checkOut)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nights</span>
                <span>{reservation.nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span>
                  {reservation.adults} adult{reservation.adults !== 1 ? "s" : ""}
                  {reservation.children > 0
                    ? `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}`
                    : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {rr && (
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {formatCurrency(rr.ratePerNightCents, reservation.currency)}/night ×{" "}
                  {reservation.nights} nights
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t">
              <span>Total</span>
              <span>{formatCurrency(reservation.totalCents, reservation.currency)}</span>
            </div>
            {reservation.payments.length > 0 ? (
              reservation.payments.map((p) => {
                const typeLabel =
                  p.type === "deposit"
                    ? "Deposit"
                    : p.type === "full_payment"
                      ? "Full payment"
                      : "Refund";
                const isScheduled = !!p.stripeSetupIntentId;
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground">{typeLabel}</span>
                        <span className="ml-2 font-medium">
                          {formatCurrency(p.amountCents, p.currency)}
                        </span>
                      </div>
                      <StatusBadge status={p.status} styleMap={PAYMENT_STATUS_STYLES} />
                    </div>
                    {isScheduled && p.status === "pending" && p.scheduledChargeAt && (
                      <p className="text-xs text-info">
                        Charge scheduled for{" "}
                        {new Date(p.scheduledChargeAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {isScheduled && p.chargeAttempts > 0 && (
                      <p className="text-xs text-warning">
                        {p.chargeAttempts} charge attempt{p.chargeAttempts !== 1 ? "s" : ""} — last failed
                      </p>
                    )}
                    {p.scheduledChargeLogs && p.scheduledChargeLogs.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-1 mt-1">
                        {p.scheduledChargeLogs.slice(0, 3).map((log) => (
                          <p key={log.id}>
                            {new Date(log.attemptedAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" — "}
                            <span className={log.status === "succeeded" ? "text-success" : "text-destructive"}>
                              {log.status}
                            </span>
                            {log.errorMessage && `: ${log.errorMessage}`}
                          </p>
                        ))}
                      </div>
                    )}
                    <PaymentActions payment={p} reservationId={reservation.id} />
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground">No payment recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Special requests + cancellation */}
        {(reservation.specialRequests || reservation.cancellationReason) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {reservation.specialRequests && (
                <div>
                  <p className="font-medium mb-1">Special requests</p>
                  <p className="text-muted-foreground">{reservation.specialRequests}</p>
                </div>
              )}
              {reservation.cancellationReason && (
                <div>
                  <p className="font-medium mb-1">Cancellation reason</p>
                  <p className="text-muted-foreground">{reservation.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
