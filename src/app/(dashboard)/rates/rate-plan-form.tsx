"use client";

import { useActionState } from "react";
import type { RatePlan, RoomType } from "@/db/schema";
import { createRatePlan, updateRatePlan, type RatePlanFormState } from "./actions";
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

type Props = {
  roomTypes: RoomType[];
  ratePlan?: RatePlan;
  onSuccess?: () => void;
};

export function RatePlanForm({ roomTypes, ratePlan, onSuccess }: Props) {
  const action = ratePlan
    ? updateRatePlan.bind(null, ratePlan.id)
    : createRatePlan;

  const [state, formAction] = useActionState<RatePlanFormState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (result.success) onSuccess?.();
      return result;
    },
    {}
  );

  const defaultRateEuros = ratePlan
    ? (ratePlan.rateCents / 100).toFixed(2)
    : "";

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <FormMessage variant="error">{state.error}</FormMessage>
      )}

      <FormField
        label="Room Type"
        htmlFor="roomTypeId"
        error={state.fieldErrors?.roomTypeId}
      >
        <Select name="roomTypeId" defaultValue={ratePlan?.roomTypeId ?? ""}>
          <SelectTrigger id="roomTypeId">
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label="Plan Name"
        htmlFor="name"
        error={state.fieldErrors?.name}
      >
        <Input
          id="name"
          name="name"
          placeholder="e.g. Summer 2026"
          defaultValue={ratePlan?.name ?? ""}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start Date"
          htmlFor="dateStart"
          error={state.fieldErrors?.dateStart}
        >
          <Input
            id="dateStart"
            name="dateStart"
            type="date"
            defaultValue={ratePlan?.dateStart ?? ""}
          />
        </FormField>
        <FormField
          label="End Date"
          htmlFor="dateEnd"
          error={state.fieldErrors?.dateEnd}
        >
          <Input
            id="dateEnd"
            name="dateEnd"
            type="date"
            defaultValue={ratePlan?.dateEnd ?? ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Nightly Rate (EUR)"
          htmlFor="rateEuros"
          error={state.fieldErrors?.rateEuros}
        >
          <Input
            id="rateEuros"
            name="rateEuros"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultRateEuros}
          />
        </FormField>
        <FormField
          label="Priority"
          htmlFor="priority"
          description="Higher number wins when plans overlap."
        >
          <Input
            id="priority"
            name="priority"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            defaultValue={ratePlan?.priority ?? 0}
          />
        </FormField>
      </div>

      <FormField label="Status" htmlFor="status">
        <Select name="status" defaultValue={ratePlan?.status ?? "active"}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="flex justify-end pt-2">
        <SubmitButton pendingLabel="Saving...">
          {ratePlan ? "Save Changes" : "Create Rate Plan"}
        </SubmitButton>
      </div>
    </form>
  );
}
