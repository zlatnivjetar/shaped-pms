"use client";

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

  return (
    <div className="text-center">
      {/* Success icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-stone-900 mb-1">Booking confirmed!</h2>
      <p className="text-stone-500 mb-6">
        Thank you, {guestFirstName}. Your reservation is confirmed.
      </p>

      {/* Confirmation code */}
      <div className="bg-stone-900 text-white rounded-xl p-5 mb-6">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
          Confirmation code
        </p>
        <p className="text-3xl font-mono font-bold tracking-wider">
          {reservation.confirmationCode}
        </p>
        <p className="text-xs text-stone-400 mt-1">
          Save this code for your records
        </p>
      </div>

      {/* Booking summary */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 text-left mb-6 space-y-2">
        <div className="flex justify-between text-sm py-1">
          <span className="text-stone-500">Property</span>
          <span className="font-medium text-stone-900">{propertyName}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-stone-500">Room</span>
          <span className="font-medium text-stone-900">{roomName}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-stone-500">Check-in</span>
          <span className="font-medium text-stone-900">{formatDate(reservation.checkIn)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-stone-500">Check-out</span>
          <span className="font-medium text-stone-900">{formatDate(reservation.checkOut)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-stone-500">Guests</span>
          <span className="font-medium text-stone-900">
            {reservation.adults} {reservation.adults === 1 ? "adult" : "adults"}
            {reservation.children > 0
              ? `, ${reservation.children} ${reservation.children === 1 ? "child" : "children"}`
              : ""}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 border-t border-stone-100 pt-3 mt-1">
          <span className="font-semibold text-stone-900">Total paid</span>
          <span className="font-bold text-stone-900">
            {formatCurrency(reservation.totalCents, reservation.currency)}
          </span>
        </div>
      </div>

      {guestEmail && (
        <p className="text-sm text-stone-500 mb-6">
          A confirmation will be sent to{" "}
          <span className="font-medium text-stone-800">{guestEmail}</span>.
        </p>
      )}

      <Link
        href={`/${propertySlug}`}
        className="inline-block text-sm text-stone-600 underline underline-offset-2"
      >
        Make another booking
      </Link>
    </div>
  );
}
