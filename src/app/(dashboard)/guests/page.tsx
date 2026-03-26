import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { GuestsPageClient } from "@/components/dashboard/guests-page-client";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardGuestsData } from "@/lib/dashboard-data";
import { normalizeGuestsParams } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

interface Props {
  searchParams: Promise<{ query?: string; page?: string; pageSize?: string }>;
}

export default async function GuestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const context = await getDashboardContext();
  const initialParams = normalizeGuestsParams({
    query: sp.query,
    page: sp.page,
    pageSize: sp.pageSize,
  });
  const queryClient = makeQueryClient();
  const initialData = await queryClient.ensureQueryData({
    queryKey: dashboardQueryKeys.guests(initialParams),
    queryFn: () => getDashboardGuestsData(context.property.id, initialParams),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GuestsPageClient
        initialParams={initialParams}
        initialData={initialData}
        currency={context.property.currency}
      />
    </HydrationBoundary>
  );
}
