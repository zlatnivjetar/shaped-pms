"use client";

import { useState, useEffect } from "react";
import type { Property, RoomType, Review, Guest } from "@/db/schema";
import type { AvailableRoomType } from "@/lib/availability";
import StepSearch from "./step-search";
import StepSelect from "./step-select";
import StepDetails from "./step-details";
import StepConfirm from "./step-confirm";
import StepComplete from "./step-complete";

export type GuestDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
};

export type CompletedReservation = {
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalCents: number;
  currency: string;
  guest: { firstName: string; lastName: string; email: string } | null;
  reservationRooms: Array<{ roomType: { name: string } | null }>;
} | null;

type PublishedReview = Review & { guest: Guest | null };

type AmenityInfo = { id: string; name: string; icon: string };

interface Props {
  property: Property;
  step: string;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  childCount: number;
  roomTypeId?: string;
  code?: string;
  availableRoomTypes: AvailableRoomType[] | null;
  selectedRoomType: RoomType | null;
  confirmTotal: number;
  completedReservation: CompletedReservation;
  publishedReviews: PublishedReview[];
  avgRating: number | null;
  amenitiesByRoomType: Record<string, AmenityInfo[]>;
}

const STORAGE_KEY = "booking-guest-details";

const STEPS = ["search", "select", "details", "confirm"];
const STEP_LABELS = ["Dates", "Room", "Details", "Confirm"];

function StepIndicator({ current }: { current: string }) {
  const idx = STEPS.indexOf(current);
  if (idx === -1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
              i < idx
                ? "bg-stone-800 text-white"
                : i === idx
                  ? "bg-stone-800 text-white ring-2 ring-stone-300"
                  : "bg-stone-200 text-stone-500"
            }`}
          >
            {i < idx ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`text-xs hidden sm:inline ${
              i === idx ? "text-stone-800 font-medium" : "text-stone-400"
            }`}
          >
            {STEP_LABELS[i]}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-px ${i < idx ? "bg-stone-800" : "bg-stone-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingFlow({
  property,
  step,
  checkIn,
  checkOut,
  adults,
  childCount,
  roomTypeId,
  availableRoomTypes,
  selectedRoomType,
  confirmTotal,
  completedReservation,
  publishedReviews,
  avgRating,
  amenitiesByRoomType,
}: Props) {
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGuestDetails(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guestDetails));
    } catch {
      // ignore
    }
  }, [guestDetails]);

  // Clear sessionStorage on completion
  useEffect(() => {
    if (step === "complete") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            {property.city}{property.country ? `, ${property.country}` : ""}
          </p>
          <h1 className="text-lg font-semibold text-stone-900">{property.name}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        {step !== "complete" && <StepIndicator current={step} />}

        {step === "search" && (
          <StepSearch
            propertySlug={property.slug}
            checkInTime={property.checkInTime ?? undefined}
            checkOutTime={property.checkOutTime ?? undefined}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialAdults={adults}
            initialChildren={childCount}
          />
        )}

        {step === "select" && (
          <StepSelect
            propertySlug={property.slug}
            checkIn={checkIn!}
            checkOut={checkOut!}
            adults={adults}
            childCount={childCount}
            availableRoomTypes={availableRoomTypes ?? []}
            amenitiesByRoomType={amenitiesByRoomType}
          />
        )}

        {step === "details" && selectedRoomType && checkIn && checkOut && (
          <StepDetails
            propertySlug={property.slug}
            selectedRoomType={selectedRoomType}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            childCount={childCount}
            roomTypeId={roomTypeId!}
            guestDetails={guestDetails}
            onGuestDetailsChange={setGuestDetails}
          />
        )}

        {step === "confirm" && selectedRoomType && checkIn && checkOut && (
          <StepConfirm
            property={property}
            selectedRoomType={selectedRoomType}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            childCount={childCount}
            roomTypeId={roomTypeId!}
            totalCents={confirmTotal}
            guestDetails={guestDetails}
          />
        )}

        {step === "complete" && completedReservation && (
          <StepComplete
            reservation={completedReservation}
            propertyName={property.name}
            propertySlug={property.slug}
          />
        )}

        {/* Fallback for invalid state */}
        {step === "complete" && !completedReservation && (
          <div className="text-center py-16">
            <p className="text-stone-500">Reservation not found.</p>
          </div>
        )}

        {/* Reviews section — visible on search step */}
        {step === "search" && publishedReviews.length > 0 && (
          <section className="mt-12 space-y-6">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold text-stone-900">
                Guest Reviews
              </h2>
              {avgRating !== null && (
                <span className="text-sm text-stone-500">
                  <span className="text-amber-400 font-medium">
                    {"★".repeat(Math.round(avgRating))}
                  </span>{" "}
                  <span className="font-semibold text-stone-700">
                    {avgRating.toFixed(1)}
                  </span>{" "}
                  from {publishedReviews.length} review
                  {publishedReviews.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {publishedReviews.map((review) => {
                const guest = review.guest;
                const initials = guest
                  ? `${guest.firstName[0]}${guest.lastName[0]}`.toUpperCase()
                  : "?";
                const displayName = guest
                  ? `${guest.firstName} ${guest.lastName[0]}.`
                  : "Guest";
                return (
                  <div
                    key={review.id}
                    className="bg-white border border-stone-200 rounded-lg p-5 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {displayName}
                        </p>
                        <p className="text-amber-400 text-xs leading-none">
                          {"★".repeat(review.rating)}
                          <span className="text-stone-200">
                            {"★".repeat(5 - review.rating)}
                          </span>
                        </p>
                      </div>
                    </div>
                    {review.title && (
                      <p className="text-sm font-semibold text-stone-800">
                        {review.title}
                      </p>
                    )}
                    <p className="text-sm text-stone-600">
                      {review.body.length > 200
                        ? review.body.slice(0, 200) + "…"
                        : review.body}
                    </p>
                    {review.propertyResponse && (
                      <div className="bg-stone-50 border border-stone-200 rounded-md px-3 py-2 mt-1">
                        <p className="text-xs font-medium text-stone-500">
                          {property.name}
                        </p>
                        <p className="text-xs text-stone-600">
                          {review.propertyResponse}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
