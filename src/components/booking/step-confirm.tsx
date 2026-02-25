"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Property, RoomType } from "@/db/schema";
import type { GuestDetails } from "./booking-flow";
import { createReservation } from "@/app/(booking)/[propertySlug]/actions";

interface Props {
  property: Property;
  selectedRoomType: RoomType;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  roomTypeId: string;
  totalCents: number;
  guestDetails: GuestDetails;
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
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-900 font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

export default function StepConfirm({
  property,
  selectedRoomType,
  checkIn,
  checkOut,
  adults,
  childCount,
  roomTypeId,
  totalCents,
  guestDetails,
}: Props) {
  const router = useRouter();
  const [error, formAction, isPending] = useActionState(createReservation, null);

  const nights =
    (new Date(checkOut + "T00:00:00Z").getTime() -
      new Date(checkIn + "T00:00:00Z").getTime()) /
    86400000;

  function handleBack() {
    const params = new URLSearchParams({
      step: "details",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
      room_type_id: roomTypeId,
    });
    router.push(`/${property.slug}?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1 mb-3"
          disabled={isPending}
        >
          ← Edit details
        </button>
        <h2 className="text-xl font-semibold text-stone-900">Review & confirm</h2>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 mb-5">
        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Stay</p>
          <Row label="Room" value={selectedRoomType.name} />
          <Row label="Check-in" value={formatDate(checkIn)} />
          <Row label="Check-out" value={formatDate(checkOut)} />
          <Row label="Duration" value={`${nights} ${nights === 1 ? "night" : "nights"}`} />
          <Row
            label="Guests"
            value={`${adults} ${adults === 1 ? "adult" : "adults"}${childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}`}
          />
        </div>

        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Guest</p>
          <Row label="Name" value={`${guestDetails.firstName} ${guestDetails.lastName}`} />
          <Row label="Email" value={guestDetails.email} />
          {guestDetails.phone && <Row label="Phone" value={guestDetails.phone} />}
          {guestDetails.specialRequests && (
            <Row label="Requests" value={guestDetails.specialRequests} />
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Price</p>
          <Row
            label={`${formatCurrency(totalCents / nights)} × ${nights} ${nights === 1 ? "night" : "nights"}`}
            value={formatCurrency(totalCents)}
          />
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-stone-100">
            <span className="font-semibold text-stone-900">Total</span>
            <span className="text-lg font-bold text-stone-900">
              {formatCurrency(totalCents)}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Payment will be collected at the property.
          </p>
        </div>
      </div>

      {/* Hidden-input form that submits to the server action */}
      <form action={formAction}>
        <input type="hidden" name="propertyId" value={property.id} />
        <input type="hidden" name="propertySlug" value={property.slug} />
        <input type="hidden" name="roomTypeId" value={roomTypeId} />
        <input type="hidden" name="checkIn" value={checkIn} />
        <input type="hidden" name="checkOut" value={checkOut} />
        <input type="hidden" name="adults" value={adults} />
        <input type="hidden" name="children" value={childCount} />
        <input type="hidden" name="firstName" value={guestDetails.firstName} />
        <input type="hidden" name="lastName" value={guestDetails.lastName} />
        <input type="hidden" name="email" value={guestDetails.email} />
        <input type="hidden" name="phone" value={guestDetails.phone} />
        <input type="hidden" name="specialRequests" value={guestDetails.specialRequests} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-stone-900 hover:bg-stone-700 text-white text-base py-3"
        >
          {isPending ? "Confirming booking…" : "Confirm booking"}
        </Button>
      </form>

      <p className="text-xs text-stone-400 text-center mt-3">
        By confirming, you agree to our booking terms.
      </p>
    </div>
  );
}
