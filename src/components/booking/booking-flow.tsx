"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import type { Property, RoomType, Review, Guest } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { StarRating } from "@/components/ui/star-rating";
import type { AvailableRoomType } from "@/lib/availability";
import { SOURCE_LABELS } from "@/lib/reviews";
import StepConfirm from "./step-confirm";
import StepComplete from "./step-complete";
import StepDetails from "./step-details";
import StepSearch from "./step-search";
import StepSelect from "./step-select";
import { StepIndicator } from "./step-indicator";
import { bookingCardClassName } from "./styles";

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
const bookingStepTransitionClassName =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-[var(--duration-normal)] motion-safe:ease-[var(--ease-out)] motion-reduce:animate-none";

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

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guestDetails));
    } catch {
      // ignore
    }
  }, [guestDetails]);

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
      <header className="border-b border-border bg-booking-background">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-booking-accent">
              {property.city}
              {property.country ? `, ${property.country}` : ""}
            </p>
            <h1 className="font-display text-xl font-semibold text-foreground">
              {property.name}
            </h1>
            {property.tagline && (
              <p className="mt-0.5 text-xs text-booking-muted">{property.tagline}</p>
            )}
            {property.phone && (
              <a
                href={`tel:${property.phone}`}
                className="mt-0.5 block text-xs text-booking-muted transition-colors hover:text-foreground"
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
              className="h-10 w-auto flex-shrink-0 object-contain"
            />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {step !== "complete" && <StepIndicator current={step} />}

        <ErrorBoundary
          size="compact"
          title="Booking step unavailable"
          description="We could not render this booking step. Try again to continue."
        >
          {step === "search" && (
            <div className={bookingStepTransitionClassName}>
              <StepSearch
                propertySlug={property.slug}
                checkInTime={property.checkInTime ?? undefined}
                checkOutTime={property.checkOutTime ?? undefined}
                initialCheckIn={checkIn}
                initialCheckOut={checkOut}
                initialAdults={adults}
                initialChildren={childCount}
              />
            </div>
          )}

          {step === "select" && (
            <div className={bookingStepTransitionClassName}>
              <StepSelect
                propertySlug={property.slug}
                checkIn={checkIn!}
                checkOut={checkOut!}
                adults={adults}
                childCount={childCount}
                availableRoomTypes={availableRoomTypes ?? []}
                amenitiesByRoomType={amenitiesByRoomType}
              />
            </div>
          )}

          {step === "details" && selectedRoomType && checkIn && checkOut && (
            <div className={bookingStepTransitionClassName}>
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
            </div>
          )}

          {step === "confirm" && selectedRoomType && checkIn && checkOut && (
            <div className={bookingStepTransitionClassName}>
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
            </div>
          )}

          {step === "complete" && completedReservation && (
            <StepComplete
              reservation={completedReservation}
              propertyName={property.name}
              propertySlug={property.slug}
            />
          )}

          {step === "complete" && !completedReservation && (
            <div className={bookingCardClassName}>
              <EmptyState
                icon={CircleAlert}
                size="compact"
                title="Reservation not found"
                description="We could not find the completed booking details for this confirmation."
              />
            </div>
          )}
        </ErrorBoundary>

        {step === "search" && publishedReviews.length > 0 && (
          <section className="mt-12 space-y-6">
            <div className="mb-2 flex flex-col items-center gap-2 text-center">
              {avgRating !== null && (
                <span className="font-display text-5xl text-booking-cta">
                  {avgRating.toFixed(1)}
                </span>
              )}
              <div className="flex items-center gap-2">
                <StarRating
                  value={Math.round(avgRating ?? 0)}
                  readOnly
                  size="sm"
                  aria-label={`Average rating ${avgRating?.toFixed(1) ?? "0"} out of 5`}
                />
                <span className="text-xs text-muted-foreground">
                  {publishedReviews.length} review{publishedReviews.length !== 1 ? "s" : ""}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Guest Reviews</h2>
            </div>

            <div className="space-y-4">
              {publishedReviews.map((review) => {
                const guest = review.guest;
                const displayName = guest
                  ? `${guest.firstName} ${guest.lastName[0]}.`
                  : review.reviewerName ?? "Guest";
                const initials = displayName
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={review.id} className={`${bookingCardClassName} space-y-3 p-5`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-booking-accent text-xs font-semibold text-booking-accent-foreground">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{displayName}</p>
                          {review.source !== "direct" && (
                            <Badge
                              variant="outline"
                              className="border-info/20 bg-info/10 text-info"
                            >
                              {SOURCE_LABELS[review.source]}
                            </Badge>
                          )}
                        </div>
                        <StarRating
                          value={review.rating}
                          readOnly
                          size="sm"
                          className="mt-0.5"
                          aria-label={`${review.rating} out of 5 stars`}
                        />
                      </div>
                    </div>

                    {review.title && (
                      <p className="text-sm font-semibold text-foreground">{review.title}</p>
                    )}

                    <p className="text-sm text-muted-foreground">
                      {review.body.length > 200
                        ? `${review.body.slice(0, 200)}…`
                        : review.body}
                    </p>

                    {review.propertyResponse && (
                      <div className="rounded-lg border border-border bg-muted/60 px-3 py-3">
                        <p className="text-xs font-medium text-foreground">{property.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
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
