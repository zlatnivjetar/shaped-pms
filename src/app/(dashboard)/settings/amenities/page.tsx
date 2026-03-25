import { asc } from "drizzle-orm";
import { Sparkles } from "lucide-react";

import {
  CreateAmenityDialog,
  DeleteAmenityButton,
  EditAmenityDialog,
} from "./amenity-dialogs";
import {
  type DataTableColumn,
  DataTable,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { db } from "@/db";
import { amenities } from "@/db/schema";
import { SettingsNav } from "../settings-nav";

export default async function SettingsAmenitiesPage() {
  const allAmenities = await db
    .select()
    .from(amenities)
    .orderBy(asc(amenities.sortOrder), asc(amenities.createdAt));

  type AmenityRow = (typeof allAmenities)[number];

  const columns: DataTableColumn<AmenityRow>[] = [
    {
      id: "name",
      header: "Amenity",
      className: "font-medium",
      cell: (amenity) => amenity.name,
    },
    {
      id: "icon",
      header: "Icon",
      cell: (amenity) => (
        <code className="inline-flex rounded-md border bg-background px-2 py-1 font-mono text-xs text-foreground">
          {amenity.icon}
        </code>
      ),
    },
    {
      id: "slug",
      header: "Slug",
      className: "text-muted-foreground",
      cell: (amenity) => amenity.slug,
    },
    {
      id: "sort",
      header: "Sort",
      align: "right",
      className: "tabular-nums",
      cell: (amenity) => amenity.sortOrder,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      className: "w-[88px]",
      cell: (amenity) => (
        <div className="flex justify-end gap-1">
          <EditAmenityDialog amenity={amenity} />
          <DeleteAmenityButton amenity={amenity} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Amenity Settings"
        description="Manage the features and facilities available for assignment to room types."
      />
      <SettingsNav />

      <section className="space-y-4">
        <SectionHeader
          title="Amenities"
          description="Control amenity labels, icons, and sort order for room type merchandising."
          action={<CreateAmenityDialog />}
        />
        <DataTable
          columns={columns}
          data={allAmenities}
          getRowKey={(amenity) => amenity.id}
          emptyState={{
            icon: Sparkles,
            title: "No amenities yet",
            description: "Add your first amenity to make it available across room types.",
            action: <CreateAmenityDialog />,
          }}
        />
      </section>
    </div>
  );
}
