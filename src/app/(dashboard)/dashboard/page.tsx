import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardSummaryData } from "@/lib/dashboard-data";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

export default async function DashboardPage() {
  const context = await getDashboardContext();
  const queryClient = makeQueryClient();

  const initialData = await queryClient.ensureQueryData({
    queryKey: dashboardQueryKeys.summary,
    queryFn: () =>
      getDashboardSummaryData(
        context.property.id,
        context.property.currency,
      ),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardOverview initialData={initialData} />
    </HydrationBoundary>
  );
}
