"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CompletedReservation } from "./booking-flow";

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

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StepComplete({ reservation, propertyName, propertySlug }: Props) {
  const roomName = reservation.reservationRooms[0]?.roomType?.name ?? "Room";
  const guestFirstName = reservation.guest?.firstName ?? "Guest";
  const guestEmail = reservation.guest?.email ?? "";

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`text-center transition-all duration-500 motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Heading */}
      <h2 className="text-2xl font-[family-name:--font-playfair] text-foreground mb-1">
        Booking confirmed.
      </h2>
      <p className="font-[family-name:--font-playfair] text-muted-foreground mb-6">
        {propertyName}
      </p>

      {/* Confirmation code block */}
      <div className="bg-booking-accent text-booking-accent-foreground rounded-2xl p-6 mb-6">
        <hr className="border-booking-cta border mb-4 opacity-60" />
        <p className="text-xs text-booking-accent-foreground/70 uppercase tracking-widest mb-2">
          Confirmation code
        </p>
        <p className="text-3xl font-[family-name:--font-playfair] tracking-wider font-semibold">
          {reservation.confirmationCode}
        </p>
        <p className="text-xs text-booking-accent-foreground/70 mt-2">Save this code for your records</p>
        <hr className="border-booking-cta border mt-4 opacity-60" />
      </div>

      {/* Booking summary */}
      <div className="bg-booking-card/90 backdrop-blur-sm rounded-xl shadow-sm p-5 text-left mb-6 space-y-2">
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Property</span>
          <span className="font-medium text-foreground">{propertyName}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Room</span>
          <span className="font-medium text-foreground">{roomName}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Check-in</span>
          <span className="font-medium text-foreground">{formatDate(reservation.checkIn)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Check-out</span>
          <span className="font-medium text-foreground">{formatDate(reservation.checkOut)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Guests</span>
          <span className="font-medium text-foreground">
            {reservation.adults} {reservation.adults === 1 ? "adult" : "adults"}
            {reservation.children > 0
              ? `, ${reservation.children} ${reservation.children === 1 ? "child" : "children"}`
              : ""}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 border-t border-border pt-3 mt-1">
          <span className="font-semibold text-foreground">Total paid</span>
          <span className="font-bold text-foreground">
            {formatCurrency(reservation.totalCents, reservation.currency)}
          </span>
        </div>
      </div>

      {guestEmail && (
        <p className="text-sm text-muted-foreground mb-6">
          A confirmation will be sent to{" "}
          <span className="font-medium text-foreground">{guestEmail}</span>.
        </p>
      )}

      <Link
        href={`/${propertySlug}`}
        className="inline-block text-sm text-muted-foreground underline underline-offset-2"
      >
        Make another booking
      </Link>
    </div>
  );
}
