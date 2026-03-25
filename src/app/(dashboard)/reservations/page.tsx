import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type DataTableColumn,
  DataTable,
} from "@/components/ui/data-table";
import {
  FilterBar,
  FilterBarActions,
  FilterBarField,
  FilterBarResetLink,
} from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import { properties, reservations, type Reservation } from "@/db/schema";
import {
  CHANNEL_LABELS,
  PAYMENT_STATUS_STYLES,
  RESERVATION_STATUS_STYLES,
} from "@/lib/status-styles";
import { formatCurrency, formatDate } from "@/lib/table-formatters";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const;

interface Props {
  searchParams: Promise<{ status?: string }>;
}

function buildReservationsHref(status?: string) {
  return status ? `/reservations?status=${status}` : "/reservations";
}

export default async function ReservationsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const statusFilter = sp.status;
  const isValidStatus =
    statusFilter &&
    VALID_STATUSES.includes(statusFilter as (typeof VALID_STATUSES)[number]);

  const allReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.propertyId, property.id),
      isValidStatus
        ? eq(reservations.status, statusFilter as Reservation["status"])
        : undefined,
    ),
    with: {
      guest: true,
      reservationRooms: {
        with: { roomType: true },
      },
      payments: true,
    },
    orderBy: [desc(reservations.createdAt)],
  });

  type ReservationRow = (typeof allReservations)[number];

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
        const guestName = reservation.guest
          ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
          : "Guest unavailable";

        return (
          <Link href={`/reservations/${reservation.id}`} className="block max-w-[200px] space-y-0.5">
            <div className="truncate font-medium" title={guestName}>{guestName}</div>
            {reservation.guest?.email && (
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
        const name = reservation.reservationRooms[0]?.roomType?.name ?? "Unassigned";
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
      cell: (reservation) => {
        const payment = reservation.payments[0];
        return payment ? (
          <StatusBadge
            status={payment.status}
            styleMap={PAYMENT_STATUS_STYLES}
            dot
          />
        ) : (
          <span className="text-xs text-muted-foreground">No payment</span>
        );
      },
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

  const filterLabel =
    isValidStatus && statusFilter
      ? RESERVATION_STATUS_STYLES[statusFilter]?.label ?? statusFilter
      : "All statuses";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reservations"
        description={`${allReservations.length} reservation${allReservations.length === 1 ? "" : "s"} shown`}
      />

      <FilterBar
        title="Filters"
        description="Refine the reservation list by reservation status."
        actions={(
          isValidStatus ? (
            <FilterBarResetLink href="/reservations">Clear filter</FilterBarResetLink>
          ) : null
        )}
      >
        <FilterBarField label="Status" className="w-full">
          <FilterBarActions>
            <Button
              asChild
              size="sm"
              variant={!isValidStatus ? "default" : "outline"}
            >
              <Link href="/reservations">All</Link>
            </Button>
            {VALID_STATUSES.map((status) => {
              const active = status === statusFilter;
              return (
                <Button
                  asChild
                  key={status}
                  size="sm"
                  variant={active ? "default" : "outline"}
                >
                  <Link href={buildReservationsHref(status)}>
                    {RESERVATION_STATUS_STYLES[status].label}
                  </Link>
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
        />
        <DataTable
          columns={reservationColumns}
          data={allReservations}
          getRowKey={(reservation) => reservation.id}
          emptyState={{
            icon: BookOpen,
            title: "No reservations found",
            description: "Try a different filter or wait for new bookings to arrive.",
          }}
        />
      </section>
    </div>
  );
}
