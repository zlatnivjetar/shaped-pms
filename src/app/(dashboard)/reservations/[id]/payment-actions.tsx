"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { showError, showSuccess } from "@/components/ui/toast";
import { capturePaymentAction, refundPaymentAction } from "../actions";
import type { Payment } from "@/db/schema";

interface Props {
  payment: Payment;
  reservationId: string;
}

export default function PaymentActions({ payment, reservationId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  if (payment.status === "captured" && payment.stripePaymentIntentId) {
    return (
      <div className="space-y-2">
        {actionError && <InlineError>{actionError}</InlineError>}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("Issue a full refund for this payment?")) return;
            setActionError(null);
            startTransition(async () => {
              const result = await refundPaymentAction(
                payment.id,
                payment.stripePaymentIntentId!,
                reservationId
              );
              if (result.error) {
                setActionError(result.error);
                showError("Refund failed", result.error);
                return;
              }

              showSuccess("Refund issued");
            });
          }}
        >
          {isPending ? "Processing…" : "Issue refund"}
        </Button>
      </div>
    );
  }

  if (payment.status === "requires_capture" && payment.stripePaymentIntentId) {
    return (
      <div className="space-y-2">
        {actionError && <InlineError>{actionError}</InlineError>}
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("Capture the held deposit?")) return;
            setActionError(null);
            startTransition(async () => {
              const result = await capturePaymentAction(
                payment.id,
                payment.stripePaymentIntentId!,
                reservationId
              );
              if (result.error) {
                setActionError(result.error);
                showError("Capture failed", result.error);
                return;
              }

              showSuccess("Deposit captured");
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
