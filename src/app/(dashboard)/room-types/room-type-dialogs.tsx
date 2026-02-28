"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import type { RoomType, Amenity } from "@/db/schema";
import { deleteRoomType, updateRoomTypeAmenities, type AmenityAssignState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RoomTypeForm } from "./room-type-form";

export function CreateRoomTypeDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Room Type
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Room Type</DialogTitle>
        </DialogHeader>
        <RoomTypeForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditRoomTypeDialog({ roomType }: { roomType: RoomType }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Room Type</DialogTitle>
        </DialogHeader>
        <RoomTypeForm roomType={roomType} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SaveAmenitiesButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save amenities"}
    </Button>
  );
}

function ManageAmenitiesForm({
  roomTypeId,
  allAmenities,
  currentAmenityIds,
  onSuccess,
}: {
  roomTypeId: string;
  allAmenities: Amenity[];
  currentAmenityIds: string[];
  onSuccess: () => void;
}) {
  const action = updateRoomTypeAmenities.bind(null, roomTypeId);
  const [state, formAction] = useActionState<AmenityAssignState, FormData>(
    action,
    {}
  );

  if (state.success) {
    onSuccess();
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {allAmenities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No amenities found. Create some in the{" "}
          <strong>Settings → Amenities</strong> tab first.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 py-1">
          {allAmenities.map((amenity) => (
            <label
              key={amenity.id}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                name="amenityIds"
                value={amenity.id}
                defaultChecked={currentAmenityIds.includes(amenity.id)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              {amenity.name}
            </label>
          ))}
        </div>
      )}
      <SaveAmenitiesButton />
    </form>
  );
}

export function ManageAmenitiesDialog({
  roomType,
  allAmenities,
  currentAmenityIds,
}: {
  roomType: RoomType;
  allAmenities: Amenity[];
  currentAmenityIds: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Manage amenities">
          <ListChecks className="h-4 w-4" />
          <span className="sr-only">Manage amenities</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Amenities — {roomType.name}</DialogTitle>
        </DialogHeader>
        <ManageAmenitiesForm
          roomTypeId={roomType.id}
          allAmenities={allAmenities}
          currentAmenityIds={currentAmenityIds}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoomTypeButton({ roomType }: { roomType: RoomType }) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete room type?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{roomType.name}</strong> and all
            associated rooms. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => startTransition(() => deleteRoomType(roomType.id))}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
