"use client";

import { useActionState } from "react";
import { createRoomType, updateRoomType, type RoomTypeFormState } from "./actions";
import type { RoomType } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSuccess?: () => void;
}

export function RoomTypeForm({ roomType, onSuccess }: RoomTypeFormProps) {
  const action = roomType
    ? updateRoomType.bind(null, roomType.id)
    : createRoomType;

  const [state, formAction] = useActionState<RoomTypeFormState, FormData>(
    action,
    {}
  );

  if (state.success && onSuccess) {
    onSuccess();
  }

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
        <FormMessage variant="error">{state.error}</FormMessage>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <Input
            id="name"
            name="name"
            defaultValue={roomType?.name}
            onChange={handleNameChange}
            placeholder="Double Sea View"
          />
        </FormField>
        <FormField label="Slug" htmlFor="slug" error={state.fieldErrors?.slug}>
          <Input
            id="slug"
            name="slug"
            defaultValue={roomType?.slug}
            placeholder="double-sea-view"
          />
        </FormField>
      </div>

      <FormField label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={roomType?.description ?? ""}
          rows={3}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Base Occupancy" htmlFor="baseOccupancy">
          <Input
            id="baseOccupancy"
            name="baseOccupancy"
            type="number"
            min={1}
            defaultValue={roomType?.baseOccupancy ?? 2}
          />
        </FormField>
        <FormField label="Max Occupancy" htmlFor="maxOccupancy">
          <Input
            id="maxOccupancy"
            name="maxOccupancy"
            type="number"
            min={1}
            defaultValue={roomType?.maxOccupancy ?? 2}
          />
        </FormField>
        <FormField
          label="Base Rate (cents)"
          htmlFor="baseRateCents"
          description={roomType ? `EUR ${(roomType.baseRateCents / 100).toFixed(2)}/night` : "e.g. 10000 = EUR 100"}
        >
          <Input
            id="baseRateCents"
            name="baseRateCents"
            type="number"
            min={0}
            defaultValue={roomType?.baseRateCents ?? 0}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sort Order" htmlFor="sortOrder">
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={roomType?.sortOrder ?? 0}
          />
        </FormField>
        <FormField label="Status" htmlFor="status">
          <Select name="status" defaultValue={roomType?.status ?? "active"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <SubmitButton pendingLabel="Saving...">
        {roomType ? "Update room type" : "Create room type"}
      </SubmitButton>
    </form>
  );
}
