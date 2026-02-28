import { db } from "@/db";
import { properties } from "@/db/schema";
import {
  getDashboardKPIs,
  getRecentBookings,
  getRevenueMetrics,
} from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, LogIn, LogOut, BedDouble } from "lucide-react";
import Link from "next/link";

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

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const [kpis, recentBookings, revenue] = await Promise.all([
    getDashboardKPIs(property.id),
    getRecentBookings(property.id),
    getRevenueMetrics(property.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Arrivals
            </CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.arrivals}</div>
            <p className="text-xs text-muted-foreground">Arrivals today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Departures
            </CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.departures}</div>
            <p className="text-xs text-muted-foreground">Departures today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-House Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.inHouse}</div>
            <p className="text-xs text-muted-foreground">Currently in-house</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tonight&apos;s Occupancy
            </CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.occupancyPct}%</div>
            <p className="text-xs text-muted-foreground">Occupancy tonight</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Revenue</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(revenue.thisMonthCents, property.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Excluding cancelled &amp; no-show
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(revenue.lastMonthCents, property.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Excluding cancelled &amp; no-show
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link
            href="/reservations"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10 text-sm"
                  >
                    No reservations yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((r) => {
                  const guestName = r.guest
                    ? `${r.guest.firstName} ${r.guest.lastName}`
                    : "—";
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
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
                      <TableCell className="text-sm tabular-nums whitespace-nowrap">
                        {formatDate(r.checkIn)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums whitespace-nowrap">
                        {formatDate(r.checkOut)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANTS[r.status] ?? "outline"}
                          className="whitespace-nowrap"
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
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
    </div>
  );
}
