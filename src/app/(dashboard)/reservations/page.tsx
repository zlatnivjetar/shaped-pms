import { db } from "@/db";
import { properties, reservations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Reservation } from "@/db/schema";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  checked_in: "default",
  checked_out: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const CHANNEL_LABELS: Record<string, string> = {
  direct: "Direct",
  booking_com: "Booking.com",
  airbnb: "Airbnb",
  expedia: "Expedia",
  walk_in: "Walk-in",
  phone: "Phone",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReservationsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const statusFilter = sp.status;
  const validStatuses = [
    "pending",
    "confirmed",
    "checked_in",
    "checked_out",
    "cancelled",
    "no_show",
  ];

  const allReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.propertyId, property.id),
      statusFilter && validStatuses.includes(statusFilter)
        ? eq(reservations.status, statusFilter as Reservation["status"])
        : undefined
    ),
    with: {
      guest: true,
      reservationRooms: {
        with: { roomType: true },
      },
    },
    orderBy: [desc(reservations.createdAt)],
  });

  const statuses = ["", ...validStatuses];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
        <p className="text-muted-foreground">
          {allReservations.length} reservation
          {allReservations.length !== 1 ? "s" : ""}
          {statusFilter ? ` · ${STATUS_LABELS[statusFilter] ?? statusFilter}` : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const active = (s === "" && !statusFilter) || s === statusFilter;
          return (
            <Link
              key={s || "all"}
              href={s ? `/reservations?status=${s}` : "/reservations"}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s ? STATUS_LABELS[s] : "All"}
            </Link>
          );
        })}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Nts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allReservations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-10 text-sm"
                >
                  No reservations found.
                </TableCell>
              </TableRow>
            ) : (
              allReservations.map((r) => {
                const roomName =
                  r.reservationRooms[0]?.roomType?.name ?? "—";
                const guestName = r.guest
                  ? `${r.guest.firstName} ${r.guest.lastName}`
                  : "—";
                return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/reservations/${r.id}`}
                        className="font-mono text-sm font-medium hover:underline"
                      >
                        {r.confirmationCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/reservations/${r.id}`} className="block">
                        <span className="font-medium">{guestName}</span>
                        {r.guest && (
                          <span className="block text-xs text-muted-foreground">
                            {r.guest.email}
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{roomName}</TableCell>
                    <TableCell className="text-sm tabular-nums whitespace-nowrap">
                      {formatDate(r.checkIn)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums whitespace-nowrap">
                      {formatDate(r.checkOut)}
                    </TableCell>
                    <TableCell className="text-sm">{r.nights}</TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANTS[r.status] ?? "outline"}
                        className="whitespace-nowrap"
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {CHANNEL_LABELS[r.channel] ?? r.channel}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(r.totalCents, r.currency)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
