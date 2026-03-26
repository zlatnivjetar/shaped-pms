import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ReservationsPageClient } from "@/components/dashboard/reservations-page-client";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardReservationsData } from "@/lib/dashboard-data";
import { normalizeReservationsParams } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function ReservationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const context = await getDashboardContext();
  const initialParams = normalizeReservationsParams({
    status: sp.status,
    page: sp.page,
  });
  const queryClient = makeQueryClient();
  const initialData = await queryClient.ensureQueryData({
    queryKey: dashboardQueryKeys.reservations(initialParams),
    queryFn: () => getDashboardReservationsData(context.property.id, initialParams),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReservationsPageClient
        initialParams={initialParams}
        initialData={initialData}
      />
    </HydrationBoundary>
  );
}
