"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createRoomType, updateRoomType, type RoomTypeFormState } from "./actions";
import type { RoomType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-destructive mt-1">{errors[0]}</p>;
}

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSuccess?: () => void;
}

export function RoomTypeForm({ roomType, onSuccess }: RoomTypeFormProps) {
  const action = roomType
    ? updateRoomType.bind(null, roomType.id)
    : createRoomType;

  const [state, formAction] = useActionState<RoomTypeFormState, FormData>(action, {});

  if (state.success && onSuccess) {
    onSuccess();
  }

  // Auto-generate slug from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = e.currentTarget.form?.elements.namedItem("slug") as HTMLInputElement | null;
    if (slugInput && !roomType) {
      slugInput.value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={roomType?.name}
            onChange={handleNameChange}
            placeholder="Double Sea View"
          />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={roomType?.slug}
            placeholder="double-sea-view"
          />
          <FieldError errors={state.fieldErrors?.slug} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={roomType?.description ?? ""}
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="baseOccupancy">Base Occupancy</Label>
          <Input
            id="baseOccupancy"
            name="baseOccupancy"
            type="number"
            min={1}
            defaultValue={roomType?.baseOccupancy ?? 2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="maxOccupancy">Max Occupancy</Label>
          <Input
            id="maxOccupancy"
            name="maxOccupancy"
            type="number"
            min={1}
            defaultValue={roomType?.maxOccupancy ?? 2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="baseRateCents">Base Rate (cents)</Label>
          <Input
            id="baseRateCents"
            name="baseRateCents"
            type="number"
            min={0}
            defaultValue={roomType?.baseRateCents ?? 0}
          />
          <p className="text-xs text-muted-foreground">
            {roomType ? `€${(roomType.baseRateCents / 100).toFixed(2)}/night` : "e.g. 10000 = €100"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={roomType?.sortOrder ?? 0}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={roomType?.status ?? "active"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SubmitButton label={roomType ? "Update room type" : "Create room type"} />
    </form>
  );
}
