import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  DoorOpen,
  LogIn,
  LogOut,
  Users,
} from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  type DataTableColumn,
  DataTable,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { properties } from "@/db/schema";
import {
  getDashboardKPIs,
  getRecentActivity,
  getRevenueMetrics,
} from "@/lib/dashboard";
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

export default async function DashboardPage() {
  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

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
        const guestName = reservation.guest
          ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
          : "Guest unavailable";

        return (
          <Link href={`/reservations/${reservation.id}`} className="block space-y-0.5">
            <div className="font-medium">{guestName}</div>
            {reservation.guest?.email && (
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
    revenue.thisMonthCents,
    revenue.lastMonthCents,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={formatToday()}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          title="Today's Arrivals"
          value={kpis.arrivals}
          subtitle="Scheduled to arrive today"
          icon={LogIn}
        />
        <KpiCard
          title="Today's Departures"
          value={kpis.departures}
          subtitle="Scheduled to depart today"
          icon={LogOut}
        />
        <KpiCard
          title="In-House Guests"
          value={kpis.inHouse}
          subtitle="Currently checked in"
          icon={DoorOpen}
        />
        <KpiCard
          title="7-Day Occupancy"
          value={`${kpis.occupancy7Days}%`}
          subtitle="Projected occupancy"
          icon={CalendarDays}
        />
        <KpiCard
          title="30-Day Occupancy"
          value={`${kpis.occupancy30Days}%`}
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
            value={formatCurrency(revenue.thisMonthCents, property.currency)}
            subtitle="Excluding cancelled and no-show reservations"
            trend={revenueTrend}
            icon={CalendarDays}
          />
          <KpiCard
            title="Last Month"
            value={formatCurrency(revenue.lastMonthCents, property.currency)}
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
          data={recentActivity}
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
