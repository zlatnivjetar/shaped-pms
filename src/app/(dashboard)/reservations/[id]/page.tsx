import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import ReservationActions from "./reservation-actions";
import PaymentActions from "./payment-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import {
  CHANNEL_LABELS,
  PAYMENT_STATUS_STYLES,
  RESERVATION_STATUS_STYLES,
} from "@/lib/status-styles";
import { formatCurrency } from "@/lib/table-formatters";

function formatStayDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatShortDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  if (!reservation) {
    notFound();
  }

  const reservationRoom = reservation.reservationRooms[0];
  const roomTypeName = reservationRoom?.roomType?.name ?? "Unassigned";
  const roomNumber = reservationRoom?.room?.roomNumber;
  const guestName = reservation.guest
    ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
    : "Guest information unavailable";

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title={reservation.confirmationCode}
        titleClassName="font-mono"
        description={`Booked via ${CHANNEL_LABELS[reservation.channel] ?? reservation.channel} on ${formatShortDate(reservation.createdAt)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reservations", href: "/reservations" },
          { label: reservation.confirmationCode },
        ]}
        actions={(
          <StatusBadge
            status={reservation.status}
            styleMap={RESERVATION_STATUS_STYLES}
            dot
            className="text-sm"
          />
        )}
      />

      <section className="space-y-4">
        <SectionHeader
          title="Reservation Actions"
          description="Update the stay status, record cancellations, and manage payment collection."
        />
        <Card>
          <CardContent className="pt-6">
            <ReservationActions id={reservation.id} status={reservation.status} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Reservation Overview"
          description="Core guest, stay, and payment details for this booking."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Guest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailRow label="Name" value={guestName} />
              <DetailRow
                label="Email"
                value={reservation.guest?.email ?? "Not provided"}
                muted={!reservation.guest?.email}
              />
              <DetailRow
                label="Phone"
                value={reservation.guest?.phone ?? "Not provided"}
                muted={!reservation.guest?.phone}
              />
              <DetailRow
                label="Country"
                value={reservation.guest?.country ?? "Not provided"}
                muted={!reservation.guest?.country}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailRow label="Room Type" value={roomTypeName} />
              {roomNumber && <DetailRow label="Room" value={`Room ${roomNumber}`} />}
              <DetailRow label="Check-in" value={formatStayDate(reservation.checkIn)} />
              <DetailRow label="Check-out" value={formatStayDate(reservation.checkOut)} />
              <DetailRow label="Nights" value={reservation.nights} />
              <DetailRow
                label="Guests"
                value={`${reservation.adults} adult${reservation.adults === 1 ? "" : "s"}${reservation.children > 0 ? `, ${reservation.children} child${reservation.children === 1 ? "" : "ren"}` : ""}`}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                {reservationRoom && (
                  <DetailRow
                    label="Nightly Rate"
                    value={`${formatCurrency(reservationRoom.ratePerNightCents, reservation.currency)} × ${reservation.nights}`}
                  />
                )}
                <DetailRow
                  label="Reservation Total"
                  value={formatCurrency(reservation.totalCents, reservation.currency)}
                />
              </div>

              {reservation.payments.length > 0 ? (
                reservation.payments.map((payment) => {
                  const typeLabel =
                    payment.type === "deposit"
                      ? "Deposit"
                      : payment.type === "full_payment"
                        ? "Full payment"
                        : "Refund";

                  const isScheduled = !!payment.stripeSetupIntentId;

                  return (
                    <div key={payment.id} className="space-y-3 rounded-xl border px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{typeLabel}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(payment.amountCents, payment.currency)}
                          </div>
                        </div>
                        <StatusBadge
                          status={payment.status}
                          styleMap={PAYMENT_STATUS_STYLES}
                          dot
                        />
                      </div>

                      {isScheduled && payment.status === "pending" && payment.scheduledChargeAt && (
                        <p className="text-xs text-info">
                          Charge scheduled for {formatShortDate(payment.scheduledChargeAt)}
                        </p>
                      )}

                      {isScheduled && payment.chargeAttempts > 0 && (
                        <p className="text-xs text-warning">
                          {payment.chargeAttempts} charge attempt{payment.chargeAttempts === 1 ? "" : "s"} recorded. The latest attempt failed.
                        </p>
                      )}

                      {payment.scheduledChargeLogs.length > 0 && (
                        <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                          {payment.scheduledChargeLogs.slice(0, 3).map((log) => (
                            <p key={log.id}>
                              {formatShortDate(log.attemptedAt)}
                              {" · "}
                              <span className={log.status === "succeeded" ? "text-success" : "text-destructive"}>
                                {log.status}
                              </span>
                              {log.errorMessage ? `: ${log.errorMessage}` : ""}
                            </p>
                          ))}
                        </div>
                      )}

                      <PaymentActions payment={payment} reservationId={reservation.id} />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
              )}
            </CardContent>
          </Card>

          {(reservation.specialRequests || reservation.cancellationReason) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reservation.specialRequests && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Special requests</div>
                    <p className="text-sm text-muted-foreground">
                      {reservation.specialRequests}
                    </p>
                  </div>
                )}
                {reservation.cancellationReason && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Cancellation reason</div>
                    <p className="text-sm text-muted-foreground">
                      {reservation.cancellationReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
