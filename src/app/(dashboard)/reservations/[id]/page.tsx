import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReservationActions from "./reservation-actions";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  checked_in: "default",
  checked_out: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const CHANNEL_LABELS: Record<string, string> = {
  direct: "Direct",
  booking_com: "Booking.com",
  airbnb: "Airbnb",
  expedia: "Expedia",
  walk_in: "Walk-in",
  phone: "Phone",
};

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
    },
  });

  if (!reservation) notFound();

  const rr = reservation.reservationRooms[0];
  const roomTypeName = rr?.roomType?.name ?? "—";
  const roomNumber = rr?.room?.roomNumber;

  return (
    <div className="space-y-6 max-w-2xl">
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
          <h1 className="text-2xl font-bold tracking-tight font-mono">
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
        <Badge
          variant={STATUS_VARIANTS[reservation.status] ?? "outline"}
          className="text-sm px-3 py-1"
        >
          {STATUS_LABELS[reservation.status] ?? reservation.status}
        </Badge>
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

        {/* Pricing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
            <p className="text-xs text-muted-foreground">
              Payment at property · {reservation.currency}
            </p>
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
