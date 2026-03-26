import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import BookingFlow from "@/components/booking/booking-flow";
import {
  getBookingAvailabilityData,
  getBookingShellData,
  getCompletedBookingReservation,
} from "@/lib/booking-data";
import { hasValidBookingSearch, parseBookingFlowState } from "@/lib/booking-contracts";
import { bookingQueryKeys } from "@/lib/query-keys";
import { BOOKING_AVAILABILITY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

interface Props {
  params: Promise<{ propertySlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { propertySlug } = await params;
  const sp = await searchParams;
  const shellData = await getBookingShellData(propertySlug);

  if (!shellData) {
    notFound();
  }

  const initialState = parseBookingFlowState(sp);
  const queryClient = makeQueryClient();

  if (initialState.step !== "complete" && hasValidBookingSearch(initialState)) {
    const availabilityParams = {
      slug: propertySlug,
      checkIn: initialState.checkIn!,
      checkOut: initialState.checkOut!,
      adults: initialState.adults,
      children: initialState.children,
    };

    await queryClient.ensureQueryData({
      queryKey: bookingQueryKeys.availability(availabilityParams),
      queryFn: () =>
        getBookingAvailabilityData(shellData.property.id, {
          checkIn: availabilityParams.checkIn,
          checkOut: availabilityParams.checkOut,
          adults: availabilityParams.adults,
          children: availabilityParams.children,
        }),
      staleTime: BOOKING_AVAILABILITY_STALE_TIME,
    });
  }

  const completedReservation =
    initialState.step === "complete"
      ? await getCompletedBookingReservation(
          shellData.property.id,
          initialState.code,
        )
      : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookingFlow
        property={shellData.property}
        activeRoomTypes={shellData.activeRoomTypes}
        initialState={initialState}
        completedReservation={completedReservation}
        publishedReviews={shellData.publishedReviews}
        avgRating={shellData.avgRating}
        reviewCount={shellData.reviewCount}
        amenitiesByRoomType={shellData.amenitiesByRoomType}
      />
    </HydrationBoundary>
  );
}
