"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Room, RoomType } from "@/db/schema";
import { addRoom, deleteRoom, updateRoomStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { RoomFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add Room"}
    </Button>
  );
}

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
          <DialogTitle>Add Room — {roomType.name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input id="roomNumber" name="roomNumber" placeholder="101" />
              {state.fieldErrors?.roomNumber && (
                <p className="text-sm text-destructive">{state.fieldErrors.roomNumber[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" name="floor" placeholder="1" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
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
          </div>
          <SubmitButton />
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
