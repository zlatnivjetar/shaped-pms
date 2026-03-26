"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FilterBar, FilterBarField, FilterBarInput } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/pagination";
import { SectionHeader } from "@/components/ui/section-header";
import { fetchDashboardGuests } from "@/lib/client-fetchers";
import type {
  DashboardGuestsData,
  DashboardGuestsParams,
  NormalizedDashboardGuestsParams,
} from "@/lib/dashboard-contracts";
import { normalizeGuestsParams } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME } from "@/lib/react-query";
import { formatCurrency } from "@/lib/table-formatters";

function parseGuestsParamsFromLocation(): NormalizedDashboardGuestsParams {
  const searchParams = new URLSearchParams(window.location.search);

  return normalizeGuestsParams({
    query: searchParams.get("query") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
}

function buildGuestsUrl(params: NormalizedDashboardGuestsParams) {
  const searchParams = new URLSearchParams();

  if (params.query) {
    searchParams.set("query", params.query);
  }

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query ? `/guests?${query}` : "/guests";
}

export function GuestsPageClient({
  initialParams,
  initialData,
  currency,
}: {
  initialParams: NormalizedDashboardGuestsParams;
  initialData: DashboardGuestsData;
  currency: string;
}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState(initialParams);
  const [searchValue, setSearchValue] = useState(initialParams.query);

  const { data = initialData, isFetching } = useQuery({
    queryKey: dashboardQueryKeys.guests(params),
    queryFn: ({ signal }) => fetchDashboardGuests(params, signal),
    placeholderData: keepPreviousData,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  function updateParams(
    nextParams: DashboardGuestsParams,
    mode: "push" | "replace" = "push",
  ) {
    const normalized = normalizeGuestsParams(nextParams);
    setParams(normalized);
    window.history[mode === "replace" ? "replaceState" : "pushState"](
      {},
      "",
      buildGuestsUrl(normalized),
    );
  }

  useEffect(() => {
    const handlePopState = () => {
      const nextParams = parseGuestsParamsFromLocation();
      setParams(nextParams);
      setSearchValue(nextParams.query);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const nextQuery = searchValue.trim();
    if (nextQuery === params.query) {
      return;
    }

    const timeout = window.setTimeout(() => {
      updateParams({ ...params, query: nextQuery, page: 1 }, "replace");
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [params, searchValue]);

  useEffect(() => {
    if (!data.hasNextPage) {
      return;
    }

    const nextParams = normalizeGuestsParams({
      ...params,
      page: params.page + 1,
    });

    void queryClient.prefetchQuery({
      queryKey: dashboardQueryKeys.guests(nextParams),
      queryFn: ({ signal }) => fetchDashboardGuests(nextParams, signal),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    });
  }, [data.hasNextPage, params, queryClient]);

  type GuestRow = DashboardGuestsData["rows"][number];

  const guestColumns: DataTableColumn<GuestRow>[] = [
    {
      id: "name",
      header: "Guest",
      cell: (guest) => (
        <div className="max-w-[200px] space-y-0.5">
          <div className="truncate font-medium" title={`${guest.firstName} ${guest.lastName}`}>
            {guest.firstName} {guest.lastName}
          </div>
          <div className="truncate text-xs text-muted-foreground" title={guest.email}>
            {guest.email}
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (guest) => guest.phone ?? "Not provided",
    },
    {
      id: "country",
      header: "Country",
      cell: (guest) => guest.country ?? "Unknown",
    },
    {
      id: "stays",
      header: "Stays",
      align: "right",
      className: "tabular-nums",
      cell: (guest) => guest.totalStays,
    },
    {
      id: "total-spent",
      header: "Total Spent",
      align: "right",
      className: "font-semibold tabular-nums",
      cell: (guest) =>
        guest.totalSpentCents > 0
          ? formatCurrency(guest.totalSpentCents, currency)
          : "—",
    },
  ];

  const pageCount =
    data.totalCount > 0 ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guests"
        description={`${data.totalCount} guest${data.totalCount === 1 ? "" : "s"} shown`}
      />

      <FilterBar
        title="Search"
        description="Find guests by name, email, phone, or country."
        actions={
          params.query ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchValue("");
                updateParams({ page: 1, query: "" });
              }}
            >
              Clear search
            </Button>
          ) : null
        }
      >
        <FilterBarField label="Guest Search" htmlFor="guest-search" className="flex-1 min-w-[16rem]">
          <FilterBarInput
            id="guest-search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search guests"
          />
        </FilterBarField>
      </FilterBar>

      <section className="space-y-4">
        <SectionHeader
          title="Guest Directory"
          description="Guest profiles and lifetime booking value for this property."
          action={
            isFetching ? (
              <span className="text-xs text-muted-foreground">Updating…</span>
            ) : null
          }
        />
        <DataTable
          columns={guestColumns}
          data={data.rows}
          getRowKey={(guest) => guest.id}
          emptyState={{
            icon: Users,
            title: params.query ? "No guests matched your search" : "No guests yet",
            description: params.query
              ? "Try a broader search term."
              : "Guests will appear here after their first booking.",
          }}
          footer={(
            <TablePagination
              page={data.page}
              pageCount={pageCount}
              totalItems={data.totalCount}
              pageSize={data.pageSize}
              itemLabel="guests"
              onPageChange={(page) => updateParams({ ...params, page })}
            />
          )}
        />
      </section>
    </div>
  );
}
