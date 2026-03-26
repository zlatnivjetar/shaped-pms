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

  type ReservationRow = (typeof allReservations)[number];

  const reservationColumns: DataTableColumn<ReservationRow>[] = [
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReservationsPageClient
        initialParams={initialParams}
        initialData={initialData}
      />
    </HydrationBoundary>
  );
}
