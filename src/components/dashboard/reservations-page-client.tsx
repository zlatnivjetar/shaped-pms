"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FilterBar, FilterBarActions, FilterBarField } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/pagination";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchDashboardReservations } from "@/lib/client-fetchers";
import type {
  DashboardReservationsData,
  DashboardReservationsParams,
  NormalizedDashboardReservationsParams,
} from "@/lib/dashboard-contracts";
import {
  normalizeReservationsParams,
  VALID_RESERVATION_STATUSES,
} from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME } from "@/lib/react-query";
import {
  CHANNEL_LABELS,
  PAYMENT_STATUS_STYLES,
  RESERVATION_STATUS_STYLES,
} from "@/lib/status-styles";
import { formatCurrency, formatDate } from "@/lib/table-formatters";

function parseReservationsParamsFromLocation(): NormalizedDashboardReservationsParams {
  const searchParams = new URLSearchParams(window.location.search);

  return normalizeReservationsParams({
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
}

function buildReservationsUrl(params: NormalizedDashboardReservationsParams) {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query ? `/reservations?${query}` : "/reservations";
}

export function ReservationsPageClient({
  initialParams,
  initialData,
}: {
  initialParams: NormalizedDashboardReservationsParams;
  initialData: DashboardReservationsData;
}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState(initialParams);
  const { data = initialData, isFetching } = useQuery({
    queryKey: dashboardQueryKeys.reservations(params),
    queryFn: ({ signal }) => fetchDashboardReservations(params, signal),
    placeholderData: keepPreviousData,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  useEffect(() => {
    const handlePopState = () => {
      setParams(parseReservationsParamsFromLocation());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!data.hasNextPage) {
      return;
    }

    const nextParams = normalizeReservationsParams({
      ...params,
      page: params.page + 1,
    });

    void queryClient.prefetchQuery({
      queryKey: dashboardQueryKeys.reservations(nextParams),
      queryFn: ({ signal }) => fetchDashboardReservations(nextParams, signal),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    });
  }, [data.hasNextPage, params, queryClient]);

  function updateParams(
    nextParams: DashboardReservationsParams,
    mode: "push" | "replace" = "push",
  ) {
    const normalized = normalizeReservationsParams(nextParams);
    setParams(normalized);
    window.history[mode === "replace" ? "replaceState" : "pushState"](
      {},
      "",
      buildReservationsUrl(normalized),
    );
  }

  type ReservationRow = DashboardReservationsData["rows"][number];

  const reservationColumns: DataTableColumn<ReservationRow>[] = [
    {
      id: "code",
      header: "Code",
      className: "font-mono text-xs font-semibold",
      cell: (reservation) => (
        <Button
          asChild
          variant="link"
          size="sm"
          className="h-auto p-0 font-mono text-xs"
        >
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
          <Link href={`/reservations/${reservation.id}`} className="block max-w-[200px] space-y-0.5">
            <div className="truncate font-medium" title={guestName}>
              {guestName}
            </div>
            {reservation.guest.email && (
              <div className="truncate text-xs text-muted-foreground" title={reservation.guest.email}>
                {reservation.guest.email}
              </div>
            )}
          </Link>
        );
      },
    },
    {
      id: "room",
      header: "Room",
      cell: (reservation) => {
        const name = reservation.roomTypeName ?? "Unassigned";
        return <span className="block max-w-[140px] truncate" title={name}>{name}</span>;
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
      id: "nights",
      header: "Nights",
      align: "right",
      className: "tabular-nums",
      cell: (reservation) => reservation.nights,
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
      id: "payment",
      header: "Payment",
      cell: (reservation) =>
        reservation.paymentStatus ? (
          <StatusBadge
            status={reservation.paymentStatus}
            styleMap={PAYMENT_STATUS_STYLES}
            dot
          />
        ) : (
          <span className="text-xs text-muted-foreground">No payment</span>
        ),
    },
    {
      id: "channel",
      header: "Channel",
      cell: (reservation) => (
        <Badge variant="outline" className="font-normal">
          {CHANNEL_LABELS[reservation.channel] ?? reservation.channel}
        </Badge>
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

  const filterLabel = params.status
    ? RESERVATION_STATUS_STYLES[params.status]?.label ?? params.status
    : "All statuses";
  const pageCount =
    data.totalCount > 0 ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reservations"
        description={`${data.totalCount} reservation${data.totalCount === 1 ? "" : "s"} shown`}
      />

      <FilterBar
        title="Filters"
        description="Refine the reservation list by reservation status."
        actions={
          params.status ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateParams({ page: 1 })}
            >
              Clear filter
            </Button>
          ) : null
        }
      >
        <FilterBarField label="Status" className="w-full">
          <FilterBarActions>
            <Button
              type="button"
              size="sm"
              variant={!params.status ? "default" : "outline"}
              onClick={() => updateParams({ page: 1 })}
            >
              All
            </Button>
            {VALID_RESERVATION_STATUSES.map((status) => {
              const active = status === params.status;
              return (
                <Button
                  type="button"
                  key={status}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => updateParams({ status, page: 1 })}
                >
                  {RESERVATION_STATUS_STYLES[status].label}
                </Button>
              );
            })}
          </FilterBarActions>
        </FilterBarField>
      </FilterBar>

      <section className="space-y-4">
        <SectionHeader
          title="Reservation List"
          description={`Showing ${filterLabel.toLowerCase()} reservations for the active property.`}
          action={
            isFetching ? (
              <span className="text-xs text-muted-foreground">Updating…</span>
            ) : null
          }
        />
        <DataTable
          columns={reservationColumns}
          data={data.rows}
          getRowKey={(reservation) => reservation.id}
          emptyState={{
            icon: BookOpen,
            title: "No reservations found",
            description: "Try a different filter or wait for new bookings to arrive.",
          }}
          footer={(
            <TablePagination
              page={data.page}
              pageCount={pageCount}
              totalItems={data.totalCount}
              pageSize={data.pageSize}
              itemLabel="reservations"
              onPageChange={(page) => updateParams({ ...params, page })}
            />
          )}
        />
      </section>
    </div>
  );
}
