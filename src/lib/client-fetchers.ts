import type {
  BookingAvailabilityData,
  BookingAvailabilityParams,
} from "@/lib/booking-contracts";
import type {
  DashboardCalendarData,
  DashboardGuestsData,
  DashboardGuestsParams,
  DashboardReservationsData,
  DashboardReservationsParams,
  DashboardReviewsData,
  DashboardReviewsParams,
  DashboardSummaryData,
} from "@/lib/dashboard-contracts";

async function fetchInternalData<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | { data: T }
    | { error?: string };

  if (!response.ok || !("data" in payload)) {
    throw new Error(("error" in payload ? payload.error : undefined) ?? "Request failed.");
  }

  return payload.data;
}

function toSearchParams(
  params: Record<string, string | number | undefined>,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  return searchParams;
}

export function fetchDashboardSummary(signal?: AbortSignal) {
  return fetchInternalData<DashboardSummaryData>("/api/internal/dashboard/summary", {
    signal,
  });
}

export function fetchDashboardReservations(
  params: DashboardReservationsParams,
  signal?: AbortSignal,
) {
  const searchParams = toSearchParams({
    status: params.status,
    page: params.page,
    pageSize: params.pageSize,
  });

  return fetchInternalData<DashboardReservationsData>(
    `/api/internal/dashboard/reservations?${searchParams.toString()}`,
    { signal },
  );
}

export function fetchDashboardGuests(
  params: DashboardGuestsParams,
  signal?: AbortSignal,
) {
  const searchParams = toSearchParams({
    query: params.query,
    page: params.page,
    pageSize: params.pageSize,
  });

  return fetchInternalData<DashboardGuestsData>(
    `/api/internal/dashboard/guests?${searchParams.toString()}`,
    { signal },
  );
}

export function fetchDashboardReviews(
  params: DashboardReviewsParams,
  signal?: AbortSignal,
) {
  const searchParams = toSearchParams({
    status: params.status,
    source: params.source,
    page: params.page,
    pageSize: params.pageSize,
  });

  return fetchInternalData<DashboardReviewsData>(
    `/api/internal/dashboard/reviews?${searchParams.toString()}`,
    { signal },
  );
}

export function fetchDashboardCalendar(
  month?: string,
  signal?: AbortSignal,
) {
  const searchParams = toSearchParams({ month });

  return fetchInternalData<DashboardCalendarData>(
    `/api/internal/dashboard/calendar?${searchParams.toString()}`,
    { signal },
  );
}

export function fetchBookingAvailability(
  params: BookingAvailabilityParams,
  signal?: AbortSignal,
) {
  const searchParams = toSearchParams({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
  });

  return fetchInternalData<BookingAvailabilityData>(
    `/api/internal/booking/${encodeURIComponent(params.slug)}/availability?${searchParams.toString()}`,
    { signal },
  );
}
