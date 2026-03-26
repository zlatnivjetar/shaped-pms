import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { CalendarPageClient } from "@/components/dashboard/calendar-page-client";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardCalendarData } from "@/lib/dashboard-data";
import { normalizeMonth } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { CALENDAR_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

type SearchParams = Promise<{ month?: string }>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { month } = await searchParams;
  const context = await getDashboardContext();
  const initialMonth = normalizeMonth(month);
  const queryClient = makeQueryClient();
  const initialData = await queryClient.ensureQueryData({
    queryKey: dashboardQueryKeys.calendar({ month: initialMonth }),
    queryFn: () => getDashboardCalendarData(context.property.id, initialMonth),
    staleTime: CALENDAR_QUERY_STALE_TIME,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPageClient
        propertyId={context.property.id}
        initialMonth={initialMonth}
        initialData={initialData}
      />
    </HydrationBoundary>
  );
}
