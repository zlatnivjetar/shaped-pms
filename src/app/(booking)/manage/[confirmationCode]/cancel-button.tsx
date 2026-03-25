"use client";

import { useState } from "react";
import { guestCancelReservation } from "./actions";

interface Props {
  confirmationCode: string;
  token: string;
}

export default function GuestCancelButton({ confirmationCode, token }: Props) {
  const [confirming, setConfirming] = useState(false);
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
      setConfirming(false);
    } else {
      setCancelled(true);
    }
  }

  if (cancelled) {
    return (
      <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-sm text-success text-center">
        Your booking has been cancelled. A confirmation email has been sent to
        you.
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/15 transition-colors"
      >
        Cancel My Booking
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      <p className="text-sm text-muted-foreground text-center">
        Are you sure you want to cancel this booking? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Keep Booking
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Yes, Cancel"}
        </button>
      </div>
    </div>
  );
}
