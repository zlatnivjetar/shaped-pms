"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Discount, RoomType } from "@/db/schema";
import { createDiscount, updateDiscount, deleteDiscount, type DiscountFormState } from "./actions";
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

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
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-1">
        <Label>Room Type</Label>
        <Select name="roomTypeId" defaultValue={discount?.roomTypeId ?? "all"}>
          <SelectTrigger>
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
        <p className="text-xs text-muted-foreground">
          Leave blank to apply to all room types.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Early Bird, Summer Special"
          defaultValue={discount?.name ?? ""}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="percentage">Discount (%)</Label>
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
        {state.fieldErrors?.percentage && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.percentage[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dateStart">Start Date (optional)</Label>
          <Input
            id="dateStart"
            name="dateStart"
            type="date"
            defaultValue={discount?.dateStart ?? ""}
          />
          {state.fieldErrors?.dateStart && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.dateStart[0]}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateEnd">End Date (optional)</Label>
          <Input
            id="dateEnd"
            name="dateEnd"
            type="date"
            defaultValue={discount?.dateEnd ?? ""}
          />
          {state.fieldErrors?.dateEnd && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.dateEnd[0]}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Leave both blank for a permanent discount.
      </p>

      <div className="space-y-1">
        <Label>Status</Label>
        <Select name="status" defaultValue={discount?.status ?? "active"}>
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
        <SubmitButton label={discount ? "Save Changes" : "Create Discount"} />
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
