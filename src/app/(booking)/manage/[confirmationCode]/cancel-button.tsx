"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { guestCancelReservation } from "./actions";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { showError, showSuccess } from "@/components/ui/toast";

interface Props {
  confirmationCode: string;
  token: string;
}

export default function GuestCancelButton({ confirmationCode, token }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const result = await guestCancelReservation(confirmationCode, token);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      showError("Cancellation failed", result.error);
      return;
    }

    setOpen(false);
    setCancelled(true);
    showSuccess("Booking cancelled", "A confirmation email has been sent.");
  }

  if (cancelled) {
    return (
      <Alert variant="success">
        Your booking has been cancelled. A confirmation email has been sent to you.
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {error && <InlineError>{error}</InlineError>}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" className="w-full">
            Cancel this booking
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <CircleAlert className="h-8 w-8" />
            </AlertDialogMedia>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. We’ll calculate any refund based on the
              property’s cancellation policy.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep booking</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? "Cancelling…" : "Yes, cancel booking"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
