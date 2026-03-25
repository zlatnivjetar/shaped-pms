"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Discount, RoomType } from "@/db/schema";
import { createDiscount, updateDiscount, deleteDiscount, type DiscountFormState } from "./actions";
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

function DiscountForm({
  roomTypes,
  discount,
  onSuccess,
}: {
  roomTypes: RoomType[];
  discount?: Discount;
  onSuccess?: () => void;
}) {
  const action = discount
    ? updateDiscount.bind(null, discount.id)
    : createDiscount;

  const [state, formAction] = useActionState<DiscountFormState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (result.success) onSuccess?.();
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <FormMessage variant="error">{state.error}</FormMessage>
      )}

      <FormField
        label="Room Type"
        htmlFor="roomTypeId"
        description="Leave blank to apply to all room types."
      >
        <Select name="roomTypeId" defaultValue={discount?.roomTypeId ?? "all"}>
          <SelectTrigger id="roomTypeId">
            <SelectValue placeholder="All room types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All room types</SelectItem>
            {roomTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Early Bird, Summer Special"
          defaultValue={discount?.name ?? ""}
        />
      </FormField>

      <FormField
        label="Discount (%)"
        htmlFor="percentage"
        error={state.fieldErrors?.percentage}
      >
        <Input
          id="percentage"
          name="percentage"
          type="number"
          min="1"
          max="100"
          step="1"
          placeholder="10"
          defaultValue={discount?.percentage ?? ""}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start Date (optional)"
          htmlFor="dateStart"
          error={state.fieldErrors?.dateStart}
        >
          <Input
            id="dateStart"
            name="dateStart"
            type="date"
            defaultValue={discount?.dateStart ?? ""}
          />
        </FormField>
        <FormField
          label="End Date (optional)"
          htmlFor="dateEnd"
          error={state.fieldErrors?.dateEnd}
        >
          <Input
            id="dateEnd"
            name="dateEnd"
            type="date"
            defaultValue={discount?.dateEnd ?? ""}
          />
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Leave both blank for a permanent discount.
      </p>

      <FormField label="Status" htmlFor="status">
        <Select name="status" defaultValue={discount?.status ?? "active"}>
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
          {discount ? "Save Changes" : "Create Discount"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function CreateDiscountDialog({ roomTypes }: { roomTypes: RoomType[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Discount
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Discount</DialogTitle>
        </DialogHeader>
        <DiscountForm roomTypes={roomTypes} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditDiscountDialog({
  discount,
  roomTypes,
}: {
  discount: Discount;
  roomTypes: RoomType[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit discount"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Discount</DialogTitle>
        </DialogHeader>
        <DiscountForm
          roomTypes={roomTypes}
          discount={discount}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDiscountButton({ discount }: { discount: Discount }) {
  const [, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          aria-label="Delete discount"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete discount?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{discount.name}&rdquo; will be removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => startTransition(() => deleteDiscount(discount.id))}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
