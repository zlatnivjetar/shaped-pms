"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { AvailabilityCalendar } from "@/app/(dashboard)/rates/availability-calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { fetchDashboardCalendar } from "@/lib/client-fetchers";
import type { DashboardCalendarData } from "@/lib/dashboard-contracts";
import { currentMonthStr, normalizeMonth } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { CALENDAR_QUERY_STALE_TIME } from "@/lib/react-query";

function prevMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = new Date(year, monthNumber - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const following = new Date(year, monthNumber, 1);
  return `${following.getFullYear()}-${String(following.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthFromLocation() {
  const searchParams = new URLSearchParams(window.location.search);
  return normalizeMonth(searchParams.get("month") ?? undefined);
}

function buildCalendarUrl(month: string) {
  return month === currentMonthStr() ? "/calendar" : `/calendar?month=${month}`;
}

export function CalendarPageClient({
  propertyId,
  initialMonth,
  initialData,
}: {
  propertyId: string;
  initialMonth: string;
  initialData: DashboardCalendarData;
}) {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(initialMonth);
  const { data = initialData, isFetching } = useQuery({
    queryKey: dashboardQueryKeys.calendar({ month }),
    queryFn: ({ signal }) => fetchDashboardCalendar(month, signal),
    placeholderData: keepPreviousData,
    staleTime: CALENDAR_QUERY_STALE_TIME,
  });

  useEffect(() => {
    const handlePopState = () => setMonth(parseMonthFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    for (const adjacentMonth of [prevMonth(month), nextMonth(month)]) {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.calendar({ month: adjacentMonth }),
        queryFn: ({ signal }) => fetchDashboardCalendar(adjacentMonth, signal),
        staleTime: CALENDAR_QUERY_STALE_TIME,
      });
    }
  }, [month, queryClient]);

  function updateMonth(next: string) {
    const normalized = normalizeMonth(next);
    setMonth(normalized);
    window.history.pushState({}, "", buildCalendarUrl(normalized));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendar"
        description="Availability and rate overrides for the selected month."
      />

      <section className="space-y-4">
        <SectionHeader
          title="Availability Grid"
          description="Use the monthly matrix to spot sell-out dates and override rates."
          action={
            isFetching ? (
              <span className="text-xs text-muted-foreground">Updating…</span>
            ) : null
          }
        />
        <ErrorBoundary
          size="compact"
          title="Calendar unavailable"
          description="The availability grid could not be rendered. Try again."
        >
          {data.roomTypes.length === 0 ? (
            <div className="rounded-xl border bg-card shadow-sm">
              <EmptyState
                icon={CalendarDays}
                size="compact"
                title="No calendar data yet"
                description="Add room types and rooms first, then availability will populate automatically."
              />
            </div>
          ) : (
            <AvailabilityCalendar
              propertyId={propertyId}
              month={data.month}
              data={data.roomTypes}
              isLoading={isFetching}
              onMonthChange={updateMonth}
              onRefresh={() =>
                queryClient.invalidateQueries({
                  queryKey: dashboardQueryKeys.calendar({ month: data.month }),
                })
              }
            />
          )}
        </ErrorBoundary>
      </section>
    </div>
  );
}
