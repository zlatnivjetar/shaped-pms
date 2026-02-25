import { db } from "@/db";
import { properties, guests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function GuestsPage() {
  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const allGuests = await db
    .select()
    .from(guests)
    .where(eq(guests.propertyId, property.id))
    .orderBy(desc(guests.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guests</h1>
        <p className="text-muted-foreground">
          {allGuests.length} guest{allGuests.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Stays</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allGuests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-10 text-sm"
                >
                  No guests yet. They will appear here after their first booking.
                </TableCell>
              </TableRow>
            ) : (
              allGuests.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    {g.firstName} {g.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.country ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {g.totalStays}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {g.totalSpentCents > 0
                      ? formatCurrency(g.totalSpentCents)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
