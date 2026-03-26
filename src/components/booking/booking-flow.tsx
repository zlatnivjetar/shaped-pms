"use client";

import dynamic from "next/dynamic";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import type {
  BookingCompletedReservation,
  BookingFlowUrlState,
  BookingPublishedReview,
} from "@/lib/booking-contracts";
import {
  buildBookingFlowSearchParams,
  hasValidBookingSearch,
  parseBookingFlowState,
} from "@/lib/booking-contracts";
import { fetchBookingAvailability } from "@/lib/client-fetchers";
import { bookingQueryKeys } from "@/lib/query-keys";
import { BOOKING_AVAILABILITY_STALE_TIME } from "@/lib/react-query";
import { SOURCE_LABELS } from "@/lib/reviews";
import type { Property, RoomType } from "@/db/schema";
import StepSearch from "./step-search";
import { StepIndicator } from "./step-indicator";
import { bookingCardClassName } from "./styles";

const StepSelect = dynamic(() => import("./step-select"), {
  loading: () => <StepLoadingSkeleton />,
});
const StepDetails = dynamic(() => import("./step-details"), {
  loading: () => <StepLoadingSkeleton />,
});
const StepConfirm = dynamic(() => import("./step-confirm"), {
  loading: () => <StepLoadingSkeleton />,
});
const StepComplete = dynamic(() => import("./step-complete"), {
  loading: () => <StepLoadingSkeleton />,
});

export type GuestDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
};

interface Props {
  property: Property;
  activeRoomTypes: RoomType[];
  initialState: BookingFlowUrlState;
  completedReservation: BookingCompletedReservation;
  publishedReviews: BookingPublishedReview[];
  avgRating: number | null;
  reviewCount: number;
  amenitiesByRoomType: Record<string, { id: string; name: string; icon: string }[]>;
}

const STORAGE_KEY = "booking-guest-details";
const bookingStepTransitionClassName =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-[var(--duration-normal)] motion-safe:ease-[var(--ease-out)] motion-reduce:animate-none";

function StepLoadingSkeleton() {
  return (
    <div className={`${bookingCardClassName} space-y-4 p-6`}>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function parseFlowStateFromLocation(): BookingFlowUrlState {
  return parseBookingFlowState(
    Object.fromEntries(new URLSearchParams(window.location.search).entries()),
  );
}

function buildFlowUrl(propertySlug: string, state: BookingFlowUrlState) {
  const params = buildBookingFlowSearchParams(state);
  const query = params.toString();
  return query ? `/${propertySlug}?${query}` : `/${propertySlug}`;
}

function isGuestDetailsValid(guestDetails: GuestDetails) {
  return Boolean(
    guestDetails.firstName.trim() &&
      guestDetails.lastName.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email),
  );
}

export default function BookingFlow({
  property,
  activeRoomTypes,
  initialState,
  completedReservation,
  publishedReviews,
  avgRating,
  reviewCount,
  amenitiesByRoomType,
}: Props) {
  const queryClient = useQueryClient();
  const [flowState, setFlowState] = useState(initialState);
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const hasSearch = hasValidBookingSearch(flowState);
  const availabilityParams = hasSearch
    ? {
        slug: property.slug,
        checkIn: flowState.checkIn!,
        checkOut: flowState.checkOut!,
        adults: flowState.adults,
        children: flowState.children,
      }
    : null;

  const availabilityQuery = useQuery({
    queryKey: availabilityParams
      ? bookingQueryKeys.availability(availabilityParams)
      : ["booking", "availability", "idle"],
    queryFn: ({ signal }) => fetchBookingAvailability(availabilityParams!, signal),
    enabled: availabilityParams !== null && flowState.step !== "complete",
    placeholderData: keepPreviousData,
    staleTime: BOOKING_AVAILABILITY_STALE_TIME,
  });

  const availableRoomTypes = availabilityQuery.data?.roomTypes ?? [];
  const selectedRoomType =
    activeRoomTypes.find((roomType) => roomType.id === flowState.roomTypeId) ?? null;
  const selectedAvailability =
    availableRoomTypes.find((roomType) => roomType.roomTypeId === flowState.roomTypeId) ??
    null;

  const renderedStep =
    flowState.step === "complete"
      ? "complete"
      : !hasSearch
        ? "search"
        : flowState.step === "search"
          ? "search"
          : (flowState.step === "details" || flowState.step === "confirm") &&
              !selectedRoomType
            ? "select"
            : flowState.step;

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
    if (flowState.step === "complete") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [flowState.step]);

  useEffect(() => {
    const handlePopState = () => setFlowState(parseFlowStateFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (hasSearch) {
      void import("./step-select");
    }
  }, [hasSearch]);

  useEffect(() => {
    if (selectedRoomType) {
      void import("./step-details");
    }
  }, [selectedRoomType]);

  useEffect(() => {
    if (isGuestDetailsValid(guestDetails)) {
      void import("./step-confirm");
    }
  }, [guestDetails]);

  function updateFlowState(
    nextState: BookingFlowUrlState,
    mode: "push" | "replace" = "push",
  ) {
    setFlowState(nextState);
    window.history[mode === "replace" ? "replaceState" : "pushState"](
      {},
      "",
      buildFlowUrl(property.slug, nextState),
    );
  }

  function warmAvailability(nextState: Pick<
    BookingFlowUrlState,
    "checkIn" | "checkOut" | "adults" | "children"
  >) {
    const searchState: BookingFlowUrlState = {
      ...flowState,
      ...nextState,
      step: "select",
      roomTypeId: undefined,
      code: undefined,
      paymentIntentId: undefined,
      setupIntentId: undefined,
    };

    if (!hasValidBookingSearch(searchState)) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: bookingQueryKeys.availability({
        slug: property.slug,
        checkIn: searchState.checkIn!,
        checkOut: searchState.checkOut!,
        adults: searchState.adults,
        children: searchState.children,
      }),
      queryFn: ({ signal }) =>
        fetchBookingAvailability(
          {
            slug: property.slug,
            checkIn: searchState.checkIn!,
            checkOut: searchState.checkOut!,
            adults: searchState.adults,
            children: searchState.children,
          },
          signal,
        ),
      staleTime: BOOKING_AVAILABILITY_STALE_TIME,
    });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-booking-background">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-booking-accent">
              {property.city}
              {property.country ? `, ${property.country}` : ""}
            </p>
            <h1 className="font-[family-name:--font-playfair] text-xl font-semibold text-foreground">
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
        {renderedStep !== "complete" && <StepIndicator current={renderedStep} />}

        <ErrorBoundary
          size="compact"
          title="Booking step unavailable"
          description="We could not render this booking step. Try again to continue."
        >
          {renderedStep === "search" && (
            <div className={bookingStepTransitionClassName}>
              <StepSearch
                checkInTime={property.checkInTime ?? undefined}
                checkOutTime={property.checkOutTime ?? undefined}
                initialCheckIn={flowState.checkIn}
                initialCheckOut={flowState.checkOut}
                initialAdults={flowState.adults}
                initialChildren={flowState.children}
                onWarmSearch={warmAvailability}
                onSearch={(nextSearch) =>
                  updateFlowState(
                    {
                      ...flowState,
                      ...nextSearch,
                      step: "select",
                      roomTypeId: undefined,
                      code: undefined,
                      paymentIntentId: undefined,
                      setupIntentId: undefined,
                    },
                    "push",
                  )
                }
              />
            </div>
          )}

          {renderedStep === "select" && hasSearch && (
            <div className={bookingStepTransitionClassName}>
              <StepSelect
                checkIn={flowState.checkIn!}
                checkOut={flowState.checkOut!}
                adults={flowState.adults}
                childCount={flowState.children}
                availableRoomTypes={availableRoomTypes}
                amenitiesByRoomType={amenitiesByRoomType}
                isLoading={availabilityQuery.isLoading && availableRoomTypes.length === 0}
                onBack={() =>
                  updateFlowState(
                    {
                      ...flowState,
                      step: "search",
                      roomTypeId: undefined,
                    },
                    "push",
                  )
                }
                onSelect={(roomTypeId) =>
                  updateFlowState(
                    {
                      ...flowState,
                      step: "details",
                      roomTypeId,
                    },
                    "push",
                  )
                }
              />
            </div>
          )}

          {renderedStep === "details" && selectedRoomType && hasSearch && (
            <div className={bookingStepTransitionClassName}>
              <StepDetails
                selectedRoomType={selectedRoomType}
                checkIn={flowState.checkIn!}
                checkOut={flowState.checkOut!}
                adults={flowState.adults}
                childCount={flowState.children}
                roomTypeId={flowState.roomTypeId!}
                guestDetails={guestDetails}
                onGuestDetailsChange={setGuestDetails}
                onBack={() => updateFlowState({ ...flowState, step: "select" }, "push")}
                onContinue={() => updateFlowState({ ...flowState, step: "confirm" }, "push")}
              />
            </div>
          )}

          {renderedStep === "confirm" && selectedRoomType && hasSearch && (
            <div className={bookingStepTransitionClassName}>
              <StepConfirm
                property={property}
                selectedRoomType={selectedRoomType}
                checkIn={flowState.checkIn!}
                checkOut={flowState.checkOut!}
                adults={flowState.adults}
                childCount={flowState.children}
                roomTypeId={flowState.roomTypeId!}
                totalCents={selectedAvailability?.totalCents ?? 0}
                guestDetails={guestDetails}
                returnState={flowState}
                onBackToDetails={() =>
                  updateFlowState({ ...flowState, step: "details" }, "push")
                }
              />
            </div>
          )}

          {renderedStep === "complete" && completedReservation && (
            <StepComplete
              reservation={completedReservation}
              propertyName={property.name}
              propertySlug={property.slug}
            />
          )}

          {renderedStep === "complete" && !completedReservation && (
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

        {renderedStep === "search" && publishedReviews.length > 0 && (
          <section className="mt-12 space-y-6">
            <div className="mb-2 flex flex-col items-center gap-2 text-center">
              {avgRating !== null && (
                <span className="font-[family-name:--font-playfair] text-5xl text-booking-cta">
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
                  {reviewCount} review{reviewCount !== 1 ? "s" : ""}
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
