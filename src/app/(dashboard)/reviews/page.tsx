import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ReviewsPageClient } from "@/components/dashboard/reviews-page-client";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardReviewsData } from "@/lib/dashboard-data";
import { normalizeReviewsParams } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

interface Props {
  searchParams: Promise<{ status?: string; source?: string; page?: string }>;
}

export default async function ReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const context = await getDashboardContext();
  const initialParams = normalizeReviewsParams({
    status: sp.status,
    source: sp.source,
    page: sp.page,
  });
  const queryClient = makeQueryClient();
  const initialData = await queryClient.ensureQueryData({
    queryKey: dashboardQueryKeys.reviews(initialParams),
    queryFn: () => getDashboardReviewsData(context.property.id, initialParams),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReviewsPageClient
        initialParams={initialParams}
        initialData={initialData}
      />
    </HydrationBoundary>
  );
}
