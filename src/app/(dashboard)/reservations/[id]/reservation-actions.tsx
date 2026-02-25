"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  confirmReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  markNoShow,
} from "../actions";
import type { Reservation } from "@/db/schema";

interface Props {
  id: string;
  status: Reservation["status"];
}

type Action = {
  label: string;
  fn: () => Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary";
  confirm?: string;
};

export default function ReservationActions({ id, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  const actions: Action[] = [];

  if (status === "pending") {
    actions.push({
      label: "Confirm",
      fn: () => confirmReservation(id),
      variant: "default",
    });
    actions.push({
      label: "Cancel",
      fn: () => cancelReservation(id),
      variant: "destructive",
      confirm: "Cancel this reservation?",
    });
  }

  if (status === "confirmed") {
    actions.push({
      label: "Check In",
      fn: () => checkInReservation(id),
      variant: "default",
    });
    actions.push({
      label: "No Show",
      fn: () => markNoShow(id),
      variant: "destructive",
      confirm: "Mark as no-show?",
    });
    actions.push({
      label: "Cancel",
      fn: () => cancelReservation(id),
      variant: "destructive",
      confirm: "Cancel this reservation?",
    });
  }

  if (status === "checked_in") {
    actions.push({
      label: "Check Out",
      fn: () => checkOutReservation(id),
      variant: "default",
    });
  }

  if (actions.length === 0 && !showCancelForm) {
    return null;
  }

  function runAction(action: Action) {
    if (action.confirm && !window.confirm(action.confirm)) return;
    startTransition(async () => {
      await action.fn();
    });
  }

  function handleCancelWithReason() {
    startTransition(async () => {
      await cancelReservation(id, cancelReason || undefined);
      setShowCancelForm(false);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {actions
        .filter((a) => a.label !== "Cancel")
        .map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? "default"}
            size="sm"
            disabled={isPending}
            onClick={() => runAction(action)}
          >
            {action.label}
          </Button>
        ))}

      {/* Cancel with optional reason */}
      {actions.some((a) => a.label === "Cancel") &&
        !showCancelForm && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setShowCancelForm(true)}
          >
            Cancel reservation
          </Button>
        )}

      {showCancelForm && (
        <div className="flex items-center gap-2 flex-wrap w-full">
          <input
            type="text"
            placeholder="Cancellation reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="flex-1 min-w-48 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleCancelWithReason}
          >
            {isPending ? "Cancelling…" : "Confirm cancel"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelForm(false)}
          >
            Keep
          </Button>
        </div>
      )}

      {isPending && (
        <span className="text-sm text-muted-foreground">Updating…</span>
      )}
    </div>
  );
}
