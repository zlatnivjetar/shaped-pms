import type { Guest, Property, Review, RoomType } from "@/db/schema";
import type { AvailableRoomType } from "@/lib/availability";

export type BookingStep = "search" | "select" | "details" | "confirm" | "complete";

export type BookingAmenityInfo = {
  id: string;
  name: string;
  icon: string;
};

export type BookingPublishedReview = Review & {
  guest: Guest | null;
};

export type BookingCompletedReservation = {
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

export interface BookingAvailabilityParams {
  slug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export interface BookingAvailabilityData {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomTypes: AvailableRoomType[];
}

export interface BookingShellData {
  property: Property;
  activeRoomTypes: RoomType[];
  amenitiesByRoomType: Record<string, BookingAmenityInfo[]>;
  publishedReviews: BookingPublishedReview[];
  avgRating: number | null;
  reviewCount: number;
  propertyAmenities: { name: string }[];
}

export interface BookingFlowUrlState {
  step: BookingStep;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
  roomTypeId?: string;
  code?: string;
  paymentIntentId?: string;
  setupIntentId?: string;
}

export const DEFAULT_BOOKING_ADULTS = 2;
export const DEFAULT_BOOKING_CHILDREN = 0;

function isValidBookingStep(step?: string): step is BookingStep {
  return (
    step === "search" ||
    step === "select" ||
    step === "details" ||
    step === "confirm" ||
    step === "complete"
  );
}

function normalizeInteger(
  value: string | number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

export function parseBookingFlowState(
  searchParams: Record<string, string | undefined>,
): BookingFlowUrlState {
  return {
    step: isValidBookingStep(searchParams.step) ? searchParams.step : "search",
    checkIn: searchParams.check_in,
    checkOut: searchParams.check_out,
    adults: normalizeInteger(searchParams.adults, DEFAULT_BOOKING_ADULTS, 1, 10),
    children: normalizeInteger(
      searchParams.children,
      DEFAULT_BOOKING_CHILDREN,
      0,
      10,
    ),
    roomTypeId: searchParams.room_type_id,
    code: searchParams.code,
    paymentIntentId: searchParams.payment_intent,
    setupIntentId: searchParams.setup_intent,
  };
}

export function buildBookingFlowSearchParams(
  state: BookingFlowUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("step", state.step);

  if (state.checkIn) {
    params.set("check_in", state.checkIn);
  }

  if (state.checkOut) {
    params.set("check_out", state.checkOut);
  }

  params.set("adults", String(state.adults));
  params.set("children", String(state.children));

  if (state.roomTypeId) {
    params.set("room_type_id", state.roomTypeId);
  }

  if (state.code) {
    params.set("code", state.code);
  }

  if (state.paymentIntentId) {
    params.set("payment_intent", state.paymentIntentId);
  }

  if (state.setupIntentId) {
    params.set("setup_intent", state.setupIntentId);
  }

  return params;
}

export function hasValidBookingSearch(state: BookingFlowUrlState): boolean {
  return Boolean(
    state.checkIn &&
      state.checkOut &&
      /^\d{4}-\d{2}-\d{2}$/.test(state.checkIn) &&
      /^\d{4}-\d{2}-\d{2}$/.test(state.checkOut) &&
      state.checkIn < state.checkOut,
  );
}
