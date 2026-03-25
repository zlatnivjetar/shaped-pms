import Link from "next/link";
import { asc } from "drizzle-orm";
import { DoorOpen, Settings2 } from "lucide-react";

import {
  AddRoomDialog,
  DeleteRoomButton,
  RoomStatusSelect,
} from "../../rooms/room-dialogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { db } from "@/db";
import { properties, roomTypes, rooms } from "@/db/schema";
import { formatCurrency } from "@/lib/table-formatters";
import { SettingsNav } from "../settings-nav";

export default async function SettingsRoomsPage() {
  const [property] = await db.select().from(properties).limit(1);
  const allRoomTypes = await db
    .select()
    .from(roomTypes)
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.createdAt));

  const allRooms = await db
    .select()
    .from(rooms)
    .orderBy(asc(rooms.roomNumber));

  const roomsByType = new Map(
    allRoomTypes.map((roomType) => [
      roomType.id,
      { roomType, rooms: [] as typeof allRooms },
    ]),
  );

  for (const room of allRooms) {
    roomsByType.get(room.roomTypeId)?.rooms.push(room);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Room Settings"
        description={`${allRooms.length} room${allRooms.length === 1 ? "" : "s"} across ${allRoomTypes.length} room type${allRoomTypes.length === 1 ? "" : "s"}.`}
        actions={(
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/room-types">
              <Settings2 className="mr-2 h-4 w-4" />
              Manage Types
            </Link>
          </Button>
        )}
      />
      <SettingsNav />

      <section className="space-y-4">
        <SectionHeader
          title="Room Inventory"
          description="Manage individual rooms, floor assignments, and operational status by room type."
        />

        {allRoomTypes.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={DoorOpen}
                size="compact"
                title="No rooms"
                description="Create room types before adding individual rooms to inventory."
                action={(
                  <Button asChild variant="outline">
                    <Link href="/settings/room-types">Create room types first</Link>
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...roomsByType.values()].map(({ roomType, rooms: typeRooms }) => (
              <Card key={roomType.id} className="gap-0">
                <CardHeader className="border-b">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>{roomType.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(roomType.baseRateCents, property?.currency ?? "EUR")}/night · up to {roomType.maxOccupancy} guests · {typeRooms.length} room
                        {typeRooms.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <AddRoomDialog roomType={roomType} />
                  </div>
                </CardHeader>

                {typeRooms.length > 0 ? (
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {typeRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex min-h-14 flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">Room {room.roomNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {room.floor ? `Floor ${room.floor}` : "Floor not assigned"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RoomStatusSelect room={room} />
                            <DeleteRoomButton room={room} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <EmptyState
                      icon={DoorOpen}
                      size="compact"
                      title="No rooms"
                      description="Add your first room in this category to start tracking availability."
                      action={<AddRoomDialog roomType={roomType} />}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
