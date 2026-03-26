import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { GuestsPageClient } from "@/components/dashboard/guests-page-client";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getDashboardGuestsData } from "@/lib/dashboard-data";
import { normalizeGuestsParams } from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME, makeQueryClient } from "@/lib/react-query";

interface Props {
  searchParams: Promise<{ query?: string; page?: string }>;
}

export default async function GuestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const context = await getDashboardContext();
  const initialParams = normalizeGuestsParams({
    query: sp.query,
    page: sp.page,
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

      <FilterBar
        title="Search"
        description="Find guests by name, email, phone, or country."
        actions={query ? <FilterBarResetLink href="/guests">Clear search</FilterBarResetLink> : null}
      >
        <form action="/guests" className="contents">
          <FilterBarField label="Guest Search" htmlFor="guest-search" className="w-full max-w-sm">
            <div className="flex items-center gap-2">
              <FilterBarInput
                id="guest-search"
                name="query"
                defaultValue={sp.query ?? ""}
                placeholder="Search guests"
              />
              <Button type="submit" size="sm" className="shrink-0">
                Search
              </Button>
            </div>
          </FilterBarField>
        </form>
      </FilterBar>

      <section className="space-y-4">
        <SectionHeader
          title="Guest Directory"
          description="Guest profiles and lifetime booking value for this property."
        />
        <DataTable
          columns={guestColumns}
          data={filteredGuests}
          getRowKey={(guest) => guest.id}
          emptyState={{
            icon: Users,
            title: query ? "No guests matched your search" : "No guests yet",
            description: query
              ? "Try a broader search term."
              : "Guests will appear here after their first booking.",
          }}
        />
      </section>
    </div>
  );
}
