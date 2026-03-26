import { QueryClient } from "@tanstack/react-query";

export const DASHBOARD_QUERY_STALE_TIME = 30_000;
export const DASHBOARD_REFERENCE_STALE_TIME = 5 * 60_000;
export const CALENDAR_QUERY_STALE_TIME = 15_000;
export const BOOKING_AVAILABILITY_STALE_TIME = 15_000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DASHBOARD_QUERY_STALE_TIME,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
