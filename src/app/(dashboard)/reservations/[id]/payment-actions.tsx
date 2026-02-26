"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { capturePaymentAction, refundPaymentAction } from "../actions";
import type { Payment } from "@/db/schema";

interface Props {
  payment: Payment;
  reservationId: string;
}

export default function PaymentActions({ payment, reservationId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  if (payment.status === "captured") {
    return (
      <div className="space-y-2">
        {actionError && (
          <p className="text-sm text-red-600">{actionError}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("Issue a full refund for this payment?")) return;
            startTransition(async () => {
              const result = await refundPaymentAction(
                payment.id,
                payment.stripePaymentIntentId,
                reservationId
              );
              if (result.error) setActionError(result.error);
            });
          }}
        >
          {isPending ? "Processing…" : "Issue refund"}
        </Button>
      </div>
    );
  }

  if (payment.status === "requires_capture") {
    return (
      <div className="space-y-2">
        {actionError && (
          <p className="text-sm text-red-600">{actionError}</p>
        )}
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("Capture the held deposit?")) return;
            startTransition(async () => {
              const result = await capturePaymentAction(
                payment.id,
                payment.stripePaymentIntentId,
                reservationId
              );
              if (result.error) setActionError(result.error);
            });
          }}
        >
          {isPending ? "Processing…" : "Capture deposit"}
        </Button>
      </div>
    );
  }

  return null;
}
