"use client";

import { useState, useEffect } from "react";
import type { Property, RoomType, Review, Guest } from "@/db/schema";
import { SOURCE_LABELS } from "@/lib/reviews";
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
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          {/* Dot + label column */}
          <div className="flex flex-col items-center gap-1.5">
            {i < idx ? (
              /* Completed: gold dot with checkmark */
              <div className="w-5 h-5 rounded-full bg-booking-cta flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : i === idx ? (
              /* Current: filled navy circle */
              <div className="w-5 h-5 rounded-full bg-booking-accent" />
            ) : (
              /* Upcoming: hollow circle */
              <div className="w-5 h-5 rounded-full border-2 border-border" />
            )}
            <span className={`text-xs hidden sm:block ${i === idx ? "text-booking-accent font-medium" : i < idx ? "text-booking-cta" : "text-muted-foreground"}`}>
              {STEP_LABELS[i]}
            </span>
          </div>
          {/* Connecting line */}
          {i < STEPS.length - 1 && (
            <div className={`w-12 h-px mx-1 mb-4 ${i < idx ? "bg-booking-cta" : "bg-border"}`} />
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-booking-accent">
              {property.city}{property.country ? `, ${property.country}` : ""}
            </p>
            <h1 className="text-xl font-semibold text-foreground font-[family-name:--font-playfair]">{property.name}</h1>
            {property.tagline && (
              <p className="text-xs text-muted-foreground mt-0.5">{property.tagline}</p>
            )}
            {property.phone && (
              <a
                href={`tel:${property.phone}`}
                className="text-xs text-muted-foreground hover:text-foreground mt-0.5 block"
              >
                {property.phone}
              </a>
            )}
          </div>
          {property.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.logoUrl}
              alt={property.name}
              className="h-10 w-auto object-contain flex-shrink-0"
            />
          )}
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
            <p className="text-muted-foreground">Reservation not found.</p>
          </div>
        )}

        {/* Reviews section — visible on search step */}
        {step === "search" && publishedReviews.length > 0 && (
          <section className="mt-12 space-y-6">
            <div className="flex flex-col items-center text-center gap-1 mb-2">
              {avgRating !== null && (
                <span className="text-5xl font-[family-name:--font-playfair] text-booking-cta">
                  {avgRating.toFixed(1)}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-rating-star text-sm">{"★".repeat(Math.round(avgRating ?? 0))}</span>
                <span className="text-xs text-muted-foreground">
                  {publishedReviews.length} review{publishedReviews.length !== 1 ? "s" : ""}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mt-1">Guest Reviews</h2>
            </div>

            <div className="space-y-4">
              {publishedReviews.map((review) => {
                const guest = review.guest;
                const displayName = guest
                  ? `${guest.firstName} ${guest.lastName[0]}.`
                  : review.reviewerName ?? "Guest";
                const initials = displayName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={review.id}
                    className="bg-booking-card/90 backdrop-blur-sm rounded-xl shadow-sm p-5 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-booking-accent text-white flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {displayName}
                          </p>
                          {review.source !== "direct" && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-info/10 text-info border border-info/20">
                              {SOURCE_LABELS[review.source]}
                            </span>
                          )}
                        </div>
                        <p className="text-rating-star text-xs leading-none mt-0.5">
                          {"★".repeat(review.rating)}
                          <span className="text-muted">
                            {"★".repeat(5 - review.rating)}
                          </span>
                        </p>
                      </div>
                    </div>
                    {review.title && (
                      <p className="text-sm font-semibold text-foreground">
                        {review.title}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {review.body.length > 200
                        ? review.body.slice(0, 200) + "…"
                        : review.body}
                    </p>
                    {review.propertyResponse && (
                      <div className="bg-muted border border-border rounded-md px-3 py-2 mt-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {property.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
