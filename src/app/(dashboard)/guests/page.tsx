import { desc, eq } from "drizzle-orm";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type DataTableColumn,
  DataTable,
} from "@/components/ui/data-table";
import {
  FilterBar,
  FilterBarField,
  FilterBarInput,
  FilterBarResetLink,
} from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { db } from "@/db";
import { guests, properties } from "@/db/schema";
import { formatCurrency } from "@/lib/table-formatters";

interface Props {
  searchParams: Promise<{ query?: string }>;
}

export default async function GuestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.query?.trim().toLowerCase() ?? "";

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const guestRecords = await db
    .select()
    .from(guests)
    .where(eq(guests.propertyId, property.id))
    .orderBy(desc(guests.createdAt));

  const filteredGuests = query
    ? guestRecords.filter((guest) =>
        [
          guest.firstName,
          guest.lastName,
          guest.email,
          guest.phone ?? "",
          guest.country ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : guestRecords;

  type GuestRow = (typeof filteredGuests)[number];

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
          ? formatCurrency(guest.totalSpentCents, property.currency)
          : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guests"
        description={`${filteredGuests.length} guest${filteredGuests.length === 1 ? "" : "s"} shown`}
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
