import { db } from "@/db";
import { roomTypes, rooms, amenities, roomTypeAmenities } from "@/db/schema";
import { eq, count, asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CreateRoomTypeDialog,
  EditRoomTypeDialog,
  DeleteRoomTypeButton,
  ManageAmenitiesDialog,
} from "../../room-types/room-type-dialogs";

export default async function SettingsRoomTypesPage() {
  const allRoomTypes = await db
    .select()
    .from(roomTypes)
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.createdAt));

  const roomCounts = await db
    .select({ roomTypeId: rooms.roomTypeId, count: count() })
    .from(rooms)
    .groupBy(rooms.roomTypeId);

  const countMap = new Map(roomCounts.map((r) => [r.roomTypeId, r.count]));

  const allAmenities = await db
    .select()
    .from(amenities)
    .orderBy(asc(amenities.sortOrder), asc(amenities.createdAt));

  const assignments = await db.select().from(roomTypeAmenities);
  const amenityIdsByRoomType = new Map<string, string[]>();
  for (const a of assignments) {
    const existing = amenityIdsByRoomType.get(a.roomTypeId) ?? [];
    existing.push(a.amenityId);
    amenityIdsByRoomType.set(a.roomTypeId, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Room Types</h2>
          <p className="text-muted-foreground text-sm">
            Manage your room categories and base rates.
          </p>
        </div>
        <CreateRoomTypeDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Occupancy</TableHead>
              <TableHead>Base Rate</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[130px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRoomTypes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No room types yet. Add your first room type to get started.
                </TableCell>
              </TableRow>
            ) : (
              allRoomTypes.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rt.name}</p>
                      <p className="text-xs text-muted-foreground">{rt.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rt.baseOccupancy}–{rt.maxOccupancy} guests
                  </TableCell>
                  <TableCell>
                    €{(rt.baseRateCents / 100).toFixed(0)}/night
                  </TableCell>
                  <TableCell>{countMap.get(rt.id) ?? 0} rooms</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rt.status === "active" ? "default" : "secondary"
                      }
                    >
                      {rt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ManageAmenitiesDialog
                        roomType={rt}
                        allAmenities={allAmenities}
                        currentAmenityIds={
                          amenityIdsByRoomType.get(rt.id) ?? []
                        }
                      />
                      <EditRoomTypeDialog roomType={rt} />
                      <DeleteRoomTypeButton roomType={rt} />
                    </div>
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
