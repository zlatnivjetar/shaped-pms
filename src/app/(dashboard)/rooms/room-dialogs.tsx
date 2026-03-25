"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Room, RoomType } from "@/db/schema";
import { addRoom, deleteRoom, updateRoomStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { RoomFormState } from "./actions";

export function AddRoomDialog({ roomType }: { roomType: RoomType }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<RoomFormState, FormData>(
    addRoom.bind(null, roomType.id),
    {}
  );

  if (state.success && open) {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-3 w-3" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Room - {roomType.name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <FormMessage variant="error">{state.error}</FormMessage>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Room Number"
              htmlFor="roomNumber"
              error={state.fieldErrors?.roomNumber}
            >
              <Input id="roomNumber" name="roomNumber" placeholder="101" />
            </FormField>
            <FormField label="Floor" htmlFor="floor">
              <Input id="floor" name="floor" placeholder="1" />
            </FormField>
          </div>
          <FormField label="Status" htmlFor="status">
            <Select name="status" defaultValue="available">
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <SubmitButton pendingLabel="Adding...">Add Room</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoomButton({ room }: { room: Room }) {
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
          <AlertDialogTitle>Delete room {room.roomNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete room <strong>{room.roomNumber}</strong>. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => startTransition(() => deleteRoom(room.id))}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RoomStatusSelect({ room }: { room: Room }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={room.status}
      disabled={isPending}
      onValueChange={(value) =>
        startTransition(() =>
          updateRoomStatus(room.id, value as Room["status"])
        )
      }
    >
      <SelectTrigger className="h-7 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available">Available</SelectItem>
        <SelectItem value="maintenance">Maintenance</SelectItem>
        <SelectItem value="out_of_service">Out of Service</SelectItem>
      </SelectContent>
    </Select>
  );
}
