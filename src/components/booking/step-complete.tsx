"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DetailRow } from "@/components/ui/detail-row";
import type { CompletedReservation } from "./booking-flow";
import { bookingCardClassName } from "./styles";

type ReservationData = NonNullable<CompletedReservation>;

interface Props {
  reservation: ReservationData;
  propertyName: string;
  propertySlug: string;
}

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StepComplete({
  reservation,
  propertyName,
  propertySlug,
}: Props) {
  const roomName = reservation.reservationRooms[0]?.roomType?.name ?? "Room";
  const guestEmail = reservation.guest?.email ?? "";

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`text-center transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <h2 className="mb-1 font-display text-2xl text-foreground">
        Booking confirmed.
      </h2>
      <p className="mb-6 text-muted-foreground">{propertyName}</p>

      <div className="mb-6 rounded-xl border border-border bg-booking-accent p-6 text-booking-accent-foreground">
        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-booking-accent-foreground/70">
          Confirmation code
        </p>
        <p className="font-mono text-3xl font-semibold tracking-[0.3em] text-booking-accent-foreground">
          {reservation.confirmationCode}
        </p>
        <p className="mt-2 text-xs text-booking-accent-foreground/70">
          Save this code for your records
        </p>
      </div>

      <div className={`${bookingCardClassName} mb-6 p-5 text-left`}>
        <div className="space-y-0.5">
          <DetailRow label="Property" value={propertyName} />
          <DetailRow label="Room" value={roomName} />
          <DetailRow label="Check-in" value={formatDate(reservation.checkIn)} />
          <DetailRow label="Check-out" value={formatDate(reservation.checkOut)} />
          <DetailRow
            label="Guests"
            value={`${reservation.adults} ${reservation.adults === 1 ? "adult" : "adults"}${reservation.children > 0 ? `, ${reservation.children} ${reservation.children === 1 ? "child" : "children"}` : ""}`}
          />
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <DetailRow
            label="Total paid"
            value={formatCurrency(reservation.totalCents, reservation.currency)}
            className="py-0"
          />
        </div>
      </div>

      {guestEmail && (
        <p className="mb-6 text-sm text-muted-foreground">
          A confirmation will be sent to{" "}
          <span className="font-medium text-foreground">{guestEmail}</span>.
        </p>
      )}

      <Button asChild variant="outline" className="border-border bg-booking-card">
        <Link href={`/${propertySlug}`}>Make another booking</Link>
      </Button>
    </div>
  );
}
