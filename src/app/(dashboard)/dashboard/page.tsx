import { db } from "@/db";
import { properties, roomTypes, rooms } from "@/db/schema";
import { count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DoorOpen, BedDouble } from "lucide-react";

export default async function DashboardPage() {
  const [roomTypeCount] = await db.select({ count: count() }).from(roomTypes);
  const [roomCount] = await db.select({ count: count() }).from(rooms);
  const allProperties = await db.select().from(properties).limit(1);
  const property = allProperties[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to {property?.name ?? "your property"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property?.name ?? "—"}</div>
            <p className="text-xs text-muted-foreground">
              {property?.city}, {property?.country}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Types</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomTypeCount?.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active room categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomCount?.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">Individual units</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
