"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { RatePlan, RoomType } from "@/db/schema";
import { createRatePlan, updateRatePlan, type RatePlanFormState } from "./actions";
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

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
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-1">
        <Label htmlFor="roomTypeId">Room Type</Label>
        <Select
          name="roomTypeId"
          defaultValue={ratePlan?.roomTypeId ?? ""}
        >
          <SelectTrigger>
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
        {state.fieldErrors?.roomTypeId && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.roomTypeId[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">Plan Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Summer 2026"
          defaultValue={ratePlan?.name ?? ""}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dateStart">Start Date</Label>
          <Input
            id="dateStart"
            name="dateStart"
            type="date"
            defaultValue={ratePlan?.dateStart ?? ""}
          />
          {state.fieldErrors?.dateStart && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.dateStart[0]}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateEnd">End Date</Label>
          <Input
            id="dateEnd"
            name="dateEnd"
            type="date"
            defaultValue={ratePlan?.dateEnd ?? ""}
          />
          {state.fieldErrors?.dateEnd && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.dateEnd[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="rateEuros">Nightly Rate (€)</Label>
          <Input
            id="rateEuros"
            name="rateEuros"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultRateEuros}
          />
          {state.fieldErrors?.rateEuros && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.rateEuros[0]}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            name="priority"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            defaultValue={ratePlan?.priority ?? 0}
          />
          <p className="text-xs text-muted-foreground">
            Higher number wins when plans overlap.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={ratePlan?.status ?? "active"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton label={ratePlan ? "Save Changes" : "Create Rate Plan"} />
      </div>
    </form>
  );
}
