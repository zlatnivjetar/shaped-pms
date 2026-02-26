"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import type { Property, RoomType } from "@/db/schema";
import type { GuestDetails } from "./booking-flow";
import {
  createReservation,
  createPaymentIntentForBooking,
} from "@/app/(booking)/[propertySlug]/actions";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface Props {
  property: Property;
  selectedRoomType: RoomType;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  roomTypeId: string;
  totalCents: number;
  guestDetails: GuestDetails;
}

type PaymentInfo = {
  clientSecret: string;
  paymentIntentId: string;
  chargedAmountCents: number;
  paymentType: "deposit" | "full_payment";
  reservationCode: string;
};

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-900 font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

// ─── PaymentFormInner (must live inside <Elements>) ───────────────────────────

function PaymentFormInner({
  property,
  paymentInfo,
  checkIn,
  checkOut,
  adults,
  childCount,
  roomTypeId,
  onSuccess,
  onError,
  isActionPending,
}: {
  property: Property;
  paymentInfo: PaymentInfo;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  roomTypeId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  isActionPending: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message ?? "Card validation failed.");
      setIsProcessing(false);
      return;
    }

    const returnUrl = new URL(`/${property.slug}`, window.location.origin);
    returnUrl.searchParams.set("step", "confirm");
    returnUrl.searchParams.set("check_in", checkIn);
    returnUrl.searchParams.set("check_out", checkOut);
    returnUrl.searchParams.set("adults", String(adults));
    returnUrl.searchParams.set("children", String(childCount));
    returnUrl.searchParams.set("room_type_id", roomTypeId);
    returnUrl.searchParams.set("payment_intent", paymentInfo.paymentIntentId);
    returnUrl.searchParams.set("code", paymentInfo.reservationCode);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl.toString() },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
    } else if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "requires_capture")
    ) {
      onSuccess();
    } else {
      onError("Unexpected payment state. Please try again.");
      setIsProcessing(false);
    }
  }

  const isDeposit = paymentInfo.paymentType === "deposit";
  const busy = isProcessing || isActionPending;

  return (
    <div className="space-y-4">
      {isDeposit && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          You will be charged{" "}
          <strong>{formatCurrency(paymentInfo.chargedAmountCents)}</strong> now
          as a deposit. The remaining balance is due at check-in.
        </div>
      )}
      <PaymentElement />
      <Button
        onClick={handlePay}
        disabled={!stripe || !elements || busy}
        className="w-full bg-stone-900 hover:bg-stone-700 text-white text-base py-3"
      >
        {isActionPending
          ? "Confirming booking…"
          : isProcessing
            ? "Processing payment…"
            : `Pay ${formatCurrency(paymentInfo.chargedAmountCents, property.currency)}${isDeposit ? " deposit" : ""}`}
      </Button>
    </div>
  );
}

// ─── StepConfirm ──────────────────────────────────────────────────────────────

export default function StepConfirm({
  property,
  selectedRoomType,
  checkIn,
  checkOut,
  adults,
  childCount,
  roomTypeId,
  totalCents,
  guestDetails,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, formAction, isPending] = useActionState(createReservation, null);
  const formRef = useRef<HTMLFormElement>(null);

  const [stage, setStage] = useState<"summary" | "payment">("summary");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  const nights =
    (new Date(checkOut + "T00:00:00Z").getTime() -
      new Date(checkIn + "T00:00:00Z").getTime()) /
    86400000;

  // Handle 3DS return: detect payment_intent + code params in URL
  useEffect(() => {
    const piId = searchParams.get("payment_intent");
    const code = searchParams.get("code");
    if (piId && code) {
      setPaymentInfo({
        clientSecret: "",
        paymentIntentId: piId,
        chargedAmountCents: 0,
        paymentType: "full_payment",
        reservationCode: code,
      });
      setAutoSubmit(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once paymentInfo is ready for auto-submit, trigger form submission
  useEffect(() => {
    if (autoSubmit && paymentInfo) {
      formRef.current?.requestSubmit();
      setAutoSubmit(false);
    }
  }, [autoSubmit, paymentInfo]);

  async function handleProceedToPayment() {
    setIsCreatingPI(true);
    setPaymentError(null);
    try {
      const result = await createPaymentIntentForBooking(property.slug, {
        roomTypeId,
        checkIn,
        checkOut,
        adults,
        children: childCount,
      });
      if ("error" in result) {
        setPaymentError(result.error);
        return;
      }
      setPaymentInfo(result);
      setStage("payment");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not set up payment. Please try again.";
      setPaymentError(message);
    } finally {
      setIsCreatingPI(false);
    }
  }

  function handleBack() {
    const params = new URLSearchParams({
      step: "details",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
      room_type_id: roomTypeId,
    });
    router.push(`/${property.slug}?${params.toString()}`);
  }

  // Show loading screen during 3DS auto-submit or action pending
  if (autoSubmit || (isPending && paymentInfo?.clientSecret === "")) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-600 text-sm">Completing your reservation…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={stage === "payment" ? () => setStage("summary") : handleBack}
          className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1 mb-3"
          disabled={isPending || isCreatingPI}
        >
          ← {stage === "payment" ? "Back to summary" : "Edit details"}
        </button>
        <h2 className="text-xl font-semibold text-stone-900">
          {stage === "payment" ? "Payment" : "Review & confirm"}
        </h2>
      </div>

      {/* Summary card — visible in both stages */}
      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 mb-5">
        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
            Stay
          </p>
          <Row label="Room" value={selectedRoomType.name} />
          <Row label="Check-in" value={formatDate(checkIn)} />
          <Row label="Check-out" value={formatDate(checkOut)} />
          <Row
            label="Duration"
            value={`${nights} ${nights === 1 ? "night" : "nights"}`}
          />
          <Row
            label="Guests"
            value={`${adults} ${adults === 1 ? "adult" : "adults"}${childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}`}
          />
        </div>

        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
            Guest
          </p>
          <Row
            label="Name"
            value={`${guestDetails.firstName} ${guestDetails.lastName}`}
          />
          <Row label="Email" value={guestDetails.email} />
          {guestDetails.phone && (
            <Row label="Phone" value={guestDetails.phone} />
          )}
          {guestDetails.specialRequests && (
            <Row label="Requests" value={guestDetails.specialRequests} />
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
            Price
          </p>
          <Row
            label={`${formatCurrency(totalCents / nights)} × ${nights} ${nights === 1 ? "night" : "nights"}`}
            value={formatCurrency(totalCents)}
          />
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-stone-100">
            <span className="font-semibold text-stone-900">Total</span>
            <span className="text-lg font-bold text-stone-900">
              {formatCurrency(totalCents, property.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Stage: summary */}
      {stage === "summary" && (
        <>
          {(paymentError || error) && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {paymentError ?? error}
            </div>
          )}
          <Button
            onClick={handleProceedToPayment}
            disabled={isCreatingPI || isPending}
            className="w-full bg-stone-900 hover:bg-stone-700 text-white text-base py-3"
          >
            {isCreatingPI ? "Setting up payment…" : "Proceed to payment →"}
          </Button>
        </>
      )}

      {/* Stage: payment */}
      {stage === "payment" && paymentInfo && stripePromise && (
        <>
          {(paymentError || error) && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {paymentError ?? error}
            </div>
          )}
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: paymentInfo.clientSecret }}
          >
            <PaymentFormInner
              property={property}
              paymentInfo={paymentInfo}
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              childCount={childCount}
              roomTypeId={roomTypeId}
              onSuccess={() => formRef.current?.requestSubmit()}
              onError={(msg) => setPaymentError(msg)}
              isActionPending={isPending}
            />
          </Elements>
        </>
      )}

      {stage === "payment" && !stripePromise && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          Payment is not configured. Please contact the property.
        </div>
      )}

      {/* Hidden reservation creation form */}
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="propertyId" value={property.id} />
        <input type="hidden" name="propertySlug" value={property.slug} />
        <input type="hidden" name="roomTypeId" value={roomTypeId} />
        <input type="hidden" name="checkIn" value={checkIn} />
        <input type="hidden" name="checkOut" value={checkOut} />
        <input type="hidden" name="adults" value={adults} />
        <input type="hidden" name="children" value={childCount} />
        <input type="hidden" name="firstName" value={guestDetails.firstName} />
        <input type="hidden" name="lastName" value={guestDetails.lastName} />
        <input type="hidden" name="email" value={guestDetails.email} />
        <input type="hidden" name="phone" value={guestDetails.phone ?? ""} />
        <input
          type="hidden"
          name="specialRequests"
          value={guestDetails.specialRequests ?? ""}
        />
        <input
          type="hidden"
          name="paymentIntentId"
          value={paymentInfo?.paymentIntentId ?? ""}
        />
        <input
          type="hidden"
          name="reservationCode"
          value={paymentInfo?.reservationCode ?? ""}
        />
      </form>

      <p className="text-xs text-stone-400 text-center mt-3">
        By confirming, you agree to our booking terms.
      </p>
    </div>
  );
}
