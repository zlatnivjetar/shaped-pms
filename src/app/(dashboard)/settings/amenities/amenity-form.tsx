"use client";

import { useActionState } from "react";
import { createAmenity, updateAmenity, type AmenityFormState } from "./actions";
import type { Amenity } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

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
        <FormMessage variant="error">{state.error}</FormMessage>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <Input
            id="name"
            name="name"
            defaultValue={amenity?.name}
            onChange={handleNameChange}
            placeholder="Free Wi-Fi"
          />
        </FormField>
        <FormField label="Slug" htmlFor="slug" error={state.fieldErrors?.slug}>
          <Input
            id="slug"
            name="slug"
            defaultValue={amenity?.slug}
            placeholder="free-wifi"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Icon"
          htmlFor="icon"
          description="Phosphor icon name (kebab-case): wifi-high, snowflake, waves, cooking-pot, bathtub, dumbbell, leaf..."
          error={state.fieldErrors?.icon}
        >
          <Input
            id="icon"
            name="icon"
            defaultValue={amenity?.icon ?? "tag"}
            placeholder="wifi"
          />
        </FormField>
        <FormField
          label="Sort Order"
          htmlFor="sortOrder"
          error={state.fieldErrors?.sortOrder}
        >
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={amenity?.sortOrder ?? 0}
          />
        </FormField>
      </div>

      <SubmitButton pendingLabel="Saving...">
        {amenity ? "Update amenity" : "Create amenity"}
      </SubmitButton>
    </form>
  );
}
