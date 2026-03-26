import type {
  DashboardCalendarParams,
  DashboardGuestsParams,
  DashboardReservationsParams,
  DashboardReviewsParams,
} from "@/lib/dashboard-contracts";
import type { BookingAvailabilityParams } from "@/lib/booking-contracts";

export const dashboardQueryKeys = {
  summary: ["dashboard", "summary"] as const,
  reservations: (params: DashboardReservationsParams) =>
    ["dashboard", "reservations", params] as const,
  guests: (params: DashboardGuestsParams) =>
    ["dashboard", "guests", params] as const,
  reviews: (params: DashboardReviewsParams) =>
    ["dashboard", "reviews", params] as const,
  calendar: (params: DashboardCalendarParams) =>
    ["dashboard", "calendar", params] as const,
};

export const bookingQueryKeys = {
  availability: (params: BookingAvailabilityParams) =>
    ["booking", "availability", params] as const,
};
