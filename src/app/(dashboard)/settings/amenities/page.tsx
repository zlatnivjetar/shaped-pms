import { db } from "@/db";
import { amenities } from "@/db/schema";
import { asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateAmenityDialog,
  EditAmenityDialog,
  DeleteAmenityButton,
} from "./amenity-dialogs";

export default async function SettingsAmenitiesPage() {
  const allAmenities = await db
    .select()
    .from(amenities)
    .orderBy(asc(amenities.sortOrder), asc(amenities.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Amenities</h2>
          <p className="text-muted-foreground text-sm">
            Manage the features and facilities you can assign to room types.
          </p>
        </div>
        <CreateAmenityDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allAmenities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No amenities yet. Add your first amenity to get started.
                </TableCell>
              </TableRow>
            ) : (
              allAmenities.map((amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell className="font-medium">{amenity.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {amenity.icon}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {amenity.slug}
                  </TableCell>
                  <TableCell>{amenity.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditAmenityDialog amenity={amenity} />
                      <DeleteAmenityButton amenity={amenity} />
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
