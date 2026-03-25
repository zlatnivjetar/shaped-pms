import { asc, count } from "drizzle-orm";
import { Bed } from "lucide-react";

import {
  CreateRoomTypeDialog,
  DeleteRoomTypeButton,
  EditRoomTypeDialog,
  ManageAmenitiesDialog,
  ManageBookingRulesDialog,
} from "../../room-types/room-type-dialogs";
import {
  type DataTableColumn,
  DataTable,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import {
  amenities,
  bookingRules,
  properties,
  roomTypeAmenities,
  roomTypes,
  rooms,
} from "@/db/schema";
import { RATE_STATUS_STYLES } from "@/lib/status-styles";
import { formatCurrency } from "@/lib/table-formatters";
import { SettingsNav } from "../settings-nav";

export default async function SettingsRoomTypesPage() {
  const [property] = await db.select().from(properties).limit(1);

  const allRoomTypes = await db
    .select()
    .from(roomTypes)
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.createdAt));

  const roomCounts = await db
    .select({ roomTypeId: rooms.roomTypeId, count: count() })
    .from(rooms)
    .groupBy(rooms.roomTypeId);

  const countMap = new Map(roomCounts.map((room) => [room.roomTypeId, room.count]));

  const allAmenities = await db
    .select()
    .from(amenities)
    .orderBy(asc(amenities.sortOrder), asc(amenities.createdAt));

  const assignments = await db.select().from(roomTypeAmenities);
  const amenityIdsByRoomType = new Map<string, string[]>();
  for (const assignment of assignments) {
    const existing = amenityIdsByRoomType.get(assignment.roomTypeId) ?? [];
    existing.push(assignment.amenityId);
    amenityIdsByRoomType.set(assignment.roomTypeId, existing);
  }

  const allRules = await db.select().from(bookingRules);
  const rulesByRoomType = new Map<string, (typeof allRules)[number][]>();
  for (const rule of allRules) {
    const existing = rulesByRoomType.get(rule.roomTypeId) ?? [];
    existing.push(rule);
    rulesByRoomType.set(rule.roomTypeId, existing);
  }

  type RoomTypeRow = (typeof allRoomTypes)[number];

  const columns: DataTableColumn<RoomTypeRow>[] = [
    {
      id: "name",
      header: "Room Type",
      cell: (roomType) => (
        <div className="space-y-0.5">
          <div className="font-medium">{roomType.name}</div>
          <div className="text-xs text-muted-foreground">{roomType.slug}</div>
        </div>
      ),
    },
    {
      id: "occupancy",
      header: "Occupancy",
      cell: (roomType) => `${roomType.baseOccupancy}-${roomType.maxOccupancy} guests`,
    },
    {
      id: "base-rate",
      header: "Base Rate",
      className: "tabular-nums",
      cell: (roomType) =>
        property
          ? `${formatCurrency(roomType.baseRateCents, property.currency)}/night`
          : `${(roomType.baseRateCents / 100).toFixed(0)}/night`,
    },
    {
      id: "rooms",
      header: "Rooms",
      align: "right",
      className: "tabular-nums",
      cell: (roomType) => countMap.get(roomType.id) ?? 0,
    },
    {
      id: "status",
      header: "Status",
      cell: (roomType) => (
        <StatusBadge status={roomType.status} styleMap={RATE_STATUS_STYLES} dot />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      className: "w-[184px]",
      cell: (roomType) => (
        <div className="flex justify-end gap-1">
          <ManageAmenitiesDialog
            roomType={roomType}
            allAmenities={allAmenities}
            currentAmenityIds={amenityIdsByRoomType.get(roomType.id) ?? []}
          />
          <ManageBookingRulesDialog
            roomType={roomType}
            rules={rulesByRoomType.get(roomType.id) ?? []}
          />
          <EditRoomTypeDialog roomType={roomType} />
          <DeleteRoomTypeButton roomType={roomType} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Room Type Settings"
        description="Configure room categories, inventory rules, and the base rate for each accommodation type."
      />
      <SettingsNav />

      <section className="space-y-4">
        <SectionHeader
          title="Room Types"
          description="Manage room definitions, assigned amenities, booking rules, and inventory counts."
          action={<CreateRoomTypeDialog />}
        />
        <DataTable
          columns={columns}
          data={allRoomTypes}
          getRowKey={(roomType) => roomType.id}
          emptyState={{
            icon: Bed,
            title: "No room types yet",
            description: "Add your first room type to start configuring inventory.",
            action: <CreateRoomTypeDialog />,
          }}
        />
      </section>
    </div>
  );
}
