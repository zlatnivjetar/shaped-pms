import { db } from "@/db";
import { roomTypes, rooms } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddRoomDialog, DeleteRoomButton, RoomStatusSelect } from "./room-dialogs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  maintenance: "secondary",
  out_of_service: "destructive",
};

export default async function RoomsPage() {
  const allRoomTypes = await db
    .select()
    .from(roomTypes)
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.createdAt));

  const allRooms = await db.select().from(rooms).orderBy(asc(rooms.roomNumber));

  const roomsByType = new Map(allRoomTypes.map((rt) => [rt.id, { roomType: rt, rooms: [] as typeof allRooms }]));
  for (const room of allRooms) {
    roomsByType.get(room.roomTypeId)?.rooms.push(room);
  }

  if (allRoomTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground">Manage individual rooms grouped by type.</p>
        </div>
        <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
          <p>No room types yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/room-types">Create room types first →</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground">
            {allRooms.length} rooms across {allRoomTypes.length} types.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/room-types">
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Types
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {[...roomsByType.values()].map(({ roomType, rooms: typeRooms }) => (
          <Card key={roomType.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{roomType.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    €{(roomType.baseRateCents / 100).toFixed(0)}/night · up to {roomType.maxOccupancy} guests ·{" "}
                    {typeRooms.length} room{typeRooms.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <AddRoomDialog roomType={roomType} />
              </div>
            </CardHeader>
            {typeRooms.length > 0 && (
              <CardContent className="pt-0">
                <div className="divide-y rounded-md border">
                  {typeRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">Room {room.roomNumber}</span>
                        {room.floor && (
                          <span className="text-xs text-muted-foreground">Floor {room.floor}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <RoomStatusSelect room={room} />
                        <DeleteRoomButton room={room} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
