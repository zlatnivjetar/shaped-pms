"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, DoorOpen, LogIn, LogOut, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchDashboardSummary } from "@/lib/client-fetchers";
import type { DashboardSummaryData } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME } from "@/lib/react-query";
import { RESERVATION_STATUS_STYLES } from "@/lib/status-styles";
import { formatCurrency, formatDate } from "@/lib/table-formatters";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTrend(current: number, previous: number) {
  if (previous <= 0) {
    if (current <= 0) {
      return { direction: "neutral" as const, value: "No change" };
    }

    return { direction: "up" as const, value: "New this month" };
  }

  const delta = ((current - previous) / previous) * 100;
  if (delta === 0) {
    return { direction: "neutral" as const, value: "0% vs last month" };
  }

  return {
    direction: delta > 0 ? ("up" as const) : ("down" as const),
    value: `${Math.abs(delta).toFixed(0)}% vs last month`,
  };
}

export function DashboardOverview({
  initialData,
}: {
  initialData: DashboardSummaryData;
}) {
  const { data = initialData } = useQuery({
    queryKey: dashboardQueryKeys.summary,
    queryFn: ({ signal }) => fetchDashboardSummary(signal),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  type RecentActivityRow = DashboardSummaryData["recentActivity"][number];

  const recentActivityColumns: DataTableColumn<RecentActivityRow>[] = [
    {
      id: "code",
      header: "Code",
      className: "font-mono text-xs font-semibold",
      cell: (reservation) => (
        <Button asChild variant="link" size="sm" className="h-auto p-0 font-mono text-xs">
          <Link href={`/reservations/${reservation.id}`}>
            {reservation.confirmationCode}
          </Link>
        </Button>
      ),
    },
    {
      id: "guest",
      header: "Guest",
      cell: (reservation) => {
        const guestName =
          reservation.guest.firstName && reservation.guest.lastName
            ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
            : "Guest unavailable";

        return (
          <Link href={`/reservations/${reservation.id}`} className="block space-y-0.5">
            <div className="font-medium">{guestName}</div>
            {reservation.guest.email && (
              <div className="text-xs text-muted-foreground">
                {reservation.guest.email}
              </div>
            )}
          </Link>
        );
      },
    },
    {
      id: "check-in",
      header: "Check-in",
      className: "tabular-nums whitespace-nowrap",
      cell: (reservation) => formatDate(reservation.checkIn),
    },
    {
      id: "check-out",
      header: "Check-out",
      className: "tabular-nums whitespace-nowrap",
      cell: (reservation) => formatDate(reservation.checkOut),
    },
    {
      id: "status",
      header: "Status",
      cell: (reservation) => (
        <StatusBadge
          status={reservation.status}
          styleMap={RESERVATION_STATUS_STYLES}
          dot
        />
      ),
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      className: "font-semibold tabular-nums",
      cell: (reservation) =>
        formatCurrency(reservation.totalCents, reservation.currency),
    },
  ];

  const revenueTrend = formatTrend(
    data.revenue.thisMonthCents,
    data.revenue.lastMonthCents,
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description={formatToday()} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          title="Today's Arrivals"
          value={data.kpis.arrivals}
          subtitle="Scheduled to arrive today"
          icon={LogIn}
        />
        <KpiCard
          title="Today's Departures"
          value={data.kpis.departures}
          subtitle="Scheduled to depart today"
          icon={LogOut}
        />
        <KpiCard
          title="In-House Guests"
          value={data.kpis.inHouse}
          subtitle="Currently checked in"
          icon={DoorOpen}
        />
        <KpiCard
          title="7-Day Occupancy"
          value={`${data.kpis.occupancy7Days}%`}
          subtitle="Projected occupancy"
          icon={CalendarDays}
        />
        <KpiCard
          title="30-Day Occupancy"
          value={`${data.kpis.occupancy30Days}%`}
          subtitle="Forward-looking occupancy"
          icon={Users}
        />
      </div>

      <section className="space-y-4">
        <SectionHeader
          title="Revenue"
          description="A month-over-month snapshot based on confirmed stays."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <KpiCard
            title="This Month"
            value={formatCurrency(data.revenue.thisMonthCents, data.property.currency)}
            subtitle="Excluding cancelled and no-show reservations"
            trend={revenueTrend}
            icon={CalendarDays}
          />
          <KpiCard
            title="Last Month"
            value={formatCurrency(data.revenue.lastMonthCents, data.property.currency)}
            subtitle="Used as the comparison baseline"
            icon={CalendarDays}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Recent Activity"
          description="The latest reservations created for this property."
          action={(
            <Button asChild variant="outline" size="sm">
              <Link href="/reservations">View all reservations</Link>
            </Button>
          )}
        />
        <DataTable
          columns={recentActivityColumns}
          data={data.recentActivity}
          getRowKey={(reservation) => reservation.id}
          emptyState={{
            icon: BookOpen,
            title: "No recent bookings",
            description: "New arrivals and departures will appear here as reservations come in.",
          }}
        />
      </section>
    </div>
  );
}
