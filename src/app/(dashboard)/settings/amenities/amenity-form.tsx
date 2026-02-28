"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAmenity, updateAmenity, type AmenityFormState } from "./actions";
import type { Amenity } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface AmenityFormProps {
  amenity?: Amenity;
  onSuccess?: () => void;
}

export function AmenityForm({ amenity, onSuccess }: AmenityFormProps) {
  const action = amenity
    ? updateAmenity.bind(null, amenity.id)
    : createAmenity;

  const [state, formAction] = useActionState<AmenityFormState, FormData>(
    action,
    {}
  );

  if (state.success && onSuccess) {
    onSuccess();
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = e.currentTarget.form?.elements.namedItem(
      "slug"
    ) as HTMLInputElement | null;
    if (slugInput && !amenity) {
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
            defaultValue={amenity?.name}
            onChange={handleNameChange}
            placeholder="Free Wi-Fi"
          />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={amenity?.slug}
            placeholder="free-wifi"
          />
          <FieldError errors={state.fieldErrors?.slug} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="icon">Icon</Label>
          <Input
            id="icon"
            name="icon"
            defaultValue={amenity?.icon ?? "tag"}
            placeholder="wifi"
          />
          <p className="text-xs text-muted-foreground">
            Lucide icon name: wifi, car, utensils, waves, tv, thermometer,
            wind, home, bath, coffee, tag…
          </p>
          <FieldError errors={state.fieldErrors?.icon} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={amenity?.sortOrder ?? 0}
          />
          <FieldError errors={state.fieldErrors?.sortOrder} />
        </div>
      </div>

      <SubmitButton label={amenity ? "Update amenity" : "Create amenity"} />
    </form>
  );
}
