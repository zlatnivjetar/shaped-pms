"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/components/ui/toast";
import type { Reservation } from "@/db/schema";
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  confirmReservation,
  markNoShow,
} from "../actions";

interface Props {
  id: string;
  status: Reservation["status"];
}

type Action = {
  label: string;
  fn: () => Promise<void>;
  successMessage: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
  confirm?: string;
};

export default function ReservationActions({ id, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  const actions: Action[] = [];

  if (status === "pending") {
    actions.push({
      label: "Confirm",
      fn: () => confirmReservation(id),
      successMessage: "Reservation confirmed",
      variant: "default",
    });
    actions.push({
      label: "Cancel",
      fn: () => cancelReservation(id),
      successMessage: "Reservation cancelled",
      variant: "destructive",
      confirm: "Cancel this reservation?",
    });
  }

  if (status === "confirmed") {
    actions.push({
      label: "Check In",
      fn: () => checkInReservation(id),
      successMessage: "Reservation checked in",
      variant: "default",
    });
    actions.push({
      label: "No Show",
      fn: () => markNoShow(id),
      successMessage: "Reservation marked as no-show",
      variant: "destructive",
      confirm: "Mark as no-show?",
    });
    actions.push({
      label: "Cancel",
      fn: () => cancelReservation(id),
      successMessage: "Reservation cancelled",
      variant: "destructive",
      confirm: "Cancel this reservation?",
    });
  }

  if (status === "checked_in") {
    actions.push({
      label: "Check Out",
      fn: () => checkOutReservation(id),
      successMessage: "Reservation checked out",
      variant: "default",
    });
  }

  if (actions.length === 0 && !showCancelForm) {
    return null;
  }

  function runAction(action: Action) {
    if (action.confirm && !window.confirm(action.confirm)) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        await action.fn();
        showSuccess(action.successMessage);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Action failed. Please try again.";
        setActionError(message);
        showError("Reservation update failed", message);
      }
    });
  }

  function handleCancelWithReason() {
    setActionError(null);
    startTransition(async () => {
      try {
        await cancelReservation(id, cancelReason || undefined);
        setShowCancelForm(false);
        showSuccess("Reservation cancelled");
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Cancellation failed. Please try again.";
        setActionError(message);
        showError("Cancellation failed", message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {actionError && <InlineError>{actionError}</InlineError>}

      <div className="flex flex-wrap items-center gap-2">
        {actions
          .filter((action) => action.label !== "Cancel")
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

        {actions.some((action) => action.label === "Cancel") && !showCancelForm && (
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
          <div className="flex w-full flex-wrap items-center gap-2">
            <Input
              type="text"
              placeholder="Cancellation reason (optional)"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className="min-w-48 flex-1"
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleCancelWithReason}
            >
              {isPending ? "Cancelling..." : "Confirm cancel"}
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
          <span className="text-sm text-muted-foreground">Updating...</span>
        )}
      </div>
    </div>
  );
}
