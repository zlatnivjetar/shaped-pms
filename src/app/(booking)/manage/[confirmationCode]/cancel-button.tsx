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
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 text-center">
        Your booking has been cancelled. A confirmation email has been sent to
        you.
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
      >
        Cancel My Booking
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <p className="text-sm text-stone-600 text-center">
        Are you sure you want to cancel this booking? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          Keep Booking
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Yes, Cancel"}
        </button>
      </div>
    </div>
  );
}
