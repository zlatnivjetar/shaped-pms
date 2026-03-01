"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Pencil, Trash2, ListChecks, CalendarDays } from "lucide-react";
import type { RoomType, Amenity, BookingRule } from "@/db/schema";
import { deleteRoomType, updateRoomTypeAmenities, type AmenityAssignState } from "./actions";
import {
  createBookingRule,
  deleteBookingRule,
  type BookingRuleFormState,
} from "./booking-rule-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// ─── Booking Rules ─────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AddBookingRuleButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding..." : "Add rule"}
    </Button>
  );
}

function BookingRuleForm({
  roomTypeId,
  onSuccess,
}: {
  roomTypeId: string;
  onSuccess: () => void;
}) {
  const action = createBookingRule.bind(null, roomTypeId);
  const [state, formAction] = useActionState<BookingRuleFormState, FormData>(
    action,
    {}
  );

  if (state.success) {
    onSuccess();
  }

  return (
    <form action={formAction} className="space-y-4 border-t border-stone-200 pt-4 mt-4">
      <p className="text-sm font-medium text-stone-700">Add new rule</p>
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="minNights" className="text-xs">Min nights</Label>
          <Input id="minNights" name="minNights" type="number" min={1} placeholder="e.g. 3" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="maxNights" className="text-xs">Max nights</Label>
          <Input id="maxNights" name="maxNights" type="number" min={1} placeholder="e.g. 14" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="dateStart" className="text-xs">Active from</Label>
          <Input id="dateStart" name="dateStart" type="date" />
          <p className="text-xs text-muted-foreground">Leave blank = always</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateEnd" className="text-xs">Active until</Label>
          <Input id="dateEnd" name="dateEnd" type="date" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-stone-700">Allowed check-in days</p>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, idx) => (
            <label key={idx} className="flex items-center gap-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                name="allowedCheckInDays"
                value={idx}
                className="h-3.5 w-3.5 rounded border-input accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Leave all unchecked = any day allowed</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-stone-700">Allowed check-out days</p>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, idx) => (
            <label key={idx} className="flex items-center gap-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                name="allowedCheckOutDays"
                value={idx}
                className="h-3.5 w-3.5 rounded border-input accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <AddBookingRuleButton />
    </form>
  );
}

function formatRuleSummary(rule: BookingRule): string {
  const parts: string[] = [];
  if (rule.minNights !== null) parts.push(`Min ${rule.minNights}n`);
  if (rule.maxNights !== null) parts.push(`Max ${rule.maxNights}n`);
  if (rule.allowedCheckInDays && rule.allowedCheckInDays.length > 0) {
    const days = rule.allowedCheckInDays.map((d) => DAY_LABELS[d]).join(", ");
    parts.push(`Check-in: ${days}`);
  }
  if (rule.allowedCheckOutDays && rule.allowedCheckOutDays.length > 0) {
    const days = rule.allowedCheckOutDays.map((d) => DAY_LABELS[d]).join(", ");
    parts.push(`Check-out: ${days}`);
  }
  return parts.join(" · ") || "Rule (no constraints set)";
}

function BookingRulesContent({
  roomTypeId,
  rules,
  onRuleAdded,
}: {
  roomTypeId: string;
  rules: BookingRule[];
  onRuleAdded: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No booking rules configured. Add one below.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start justify-between gap-2 rounded-md border border-stone-200 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-stone-800">{formatRuleSummary(rule)}</p>
                {(rule.dateStart || rule.dateEnd) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rule.dateStart ?? "∞"} → {rule.dateEnd ?? "∞"}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  startTransition(() => deleteBookingRule(rule.id))
                }
                disabled={isPending}
                className="text-destructive hover:text-destructive/80 text-xs shrink-0 mt-0.5 disabled:opacity-50"
                title="Delete rule"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <BookingRuleForm roomTypeId={roomTypeId} onSuccess={onRuleAdded} />
    </div>
  );
}

export function ManageBookingRulesDialog({
  roomType,
  rules,
}: {
  roomType: RoomType;
  rules: BookingRule[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Manage booking rules">
          <CalendarDays className="h-4 w-4" />
          <span className="sr-only">Manage booking rules</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking Rules — {roomType.name}</DialogTitle>
        </DialogHeader>
        <BookingRulesContent
          roomTypeId={roomType.id}
          rules={rules}
          onRuleAdded={() => setOpen(false)}
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
