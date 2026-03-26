import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardSummaryData } from "@/lib/dashboard-data";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

export default async function DashboardPage() {
  const context = await getDashboardContext();
  const queryClient = makeQueryClient();

  const [kpis, recentActivity, revenue] = await Promise.all([
    getDashboardKPIs(property.id),
    getRecentActivity(property.id),
    getRevenueMetrics(property.id),
  ]);

  type RecentActivityRow = (typeof recentActivity)[number];

  const recentActivityColumns: DataTableColumn<RecentActivityRow>[] = [
    {
      id: "code",
      header: "Code",
      className: "font-mono text-xs font-semibold",
      cell: (reservation) => (
        <Link
          href={`/reservations/${reservation.id}`}
          className="font-mono text-xs font-semibold text-foreground hover:text-foreground/70"
        >
          {reservation.confirmationCode}
        </Link>
      ),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardOverview initialData={initialData} />
    </HydrationBoundary>
  );
}
