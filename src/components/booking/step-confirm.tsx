"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DetailRow } from "@/components/ui/detail-row";
import { InlineError } from "@/components/ui/inline-error";
import type { Property, RoomType } from "@/db/schema";
import { hexTokens, darkHexTokens } from "@/lib/design-tokens";
import {
  createPaymentIntentForBooking,
  createReservation,
} from "@/app/(booking)/[propertySlug]/actions";
import type { GuestDetails } from "./booking-flow";
import {
  bookingCardClassName,
  bookingCtaButtonClassName,
  bookingGhostButtonClassName,
} from "./styles";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function buildStripeAppearance(isDark: boolean) {
  const t = isDark ? darkHexTokens : hexTokens;
  return {
    theme: (isDark ? "night" : "stripe") as "night" | "stripe",
    variables: {
      colorPrimary: t.bookingCta,
      colorBackground: t.bookingCard,
      colorText: t.foreground,
      colorTextSecondary: t.bookingMuted,
      colorDanger: t.destructive,
      colorSuccess: t.success,
      colorTextPlaceholder: t.bookingMuted,
      colorIcon: t.bookingMuted,
      borderRadius: "8px",
      fontFamily: "Manrope, system-ui, sans-serif",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        backgroundColor: t.bookingCard,
        borderColor: t.border,
        boxShadow: "none",
      },
      ".Input:focus": {
        borderColor: t.bookingAccent,
        boxShadow: `0 0 0 1px ${t.bookingAccent}`,
      },
      ".Label": {
        color: t.bookingMuted,
      },
      ".Tab": {
        borderColor: t.border,
        backgroundColor: t.bookingCard,
      },
      ".Tab:hover": {
        color: t.foreground,
      },
      ".Tab--selected": {
        borderColor: t.bookingCta,
        color: t.foreground,
        boxShadow: `0 0 0 1px ${t.bookingCta}`,
      },
    },
  };
}

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

type PaymentInfo =
  | {
      type: "payment";
      clientSecret: string;
      paymentIntentId: string;
      chargedAmountCents: number;
      paymentType: "deposit" | "full_payment";
      reservationCode: string;
    }
  | {
      type: "setup";
      clientSecret: string;
      setupIntentId: string;
      customerId: string;
      totalCents: number;
      reservationCode: string;
      scheduledChargeDate: string;
    };

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function cancellationPolicyLabel(policy: string, days: number): string {
  if (policy === "flexible") {
    return `Free cancellation up to ${days} day${days !== 1 ? "s" : ""} before arrival`;
  }

  if (policy === "moderate") {
    return `50% refund if cancelled up to ${days} day${days !== 1 ? "s" : ""} before arrival; no refund after`;
  }

  return "Non-refundable";
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

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
  onError: (message: string) => void;
  isActionPending: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const isSetupFlow = paymentInfo.type === "setup";

  async function handlePay() {
    if (!stripe || !elements) {
      return;
    }

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
    returnUrl.searchParams.set("code", paymentInfo.reservationCode);

    if (isSetupFlow) {
      returnUrl.searchParams.set("setup_intent", paymentInfo.setupIntentId);
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Card setup failed. Please try again.");
        setIsProcessing(false);
      } else if (setupIntent?.status === "succeeded") {
        onSuccess();
      } else {
        onError("Unexpected setup state. Please try again.");
        setIsProcessing(false);
      }

      return;
    }

    returnUrl.searchParams.set("payment_intent", paymentInfo.paymentIntentId);
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

  const isDeposit = !isSetupFlow && paymentInfo.paymentType === "deposit";
  const busy = isProcessing || isActionPending;

  return (
    <div className="space-y-4">
      {isSetupFlow ? (
        <Alert variant="info">
          Your card will be saved now and charged{" "}
          <strong>{formatCurrency(paymentInfo.totalCents, property.currency)}</strong> on{" "}
          <strong>{paymentInfo.scheduledChargeDate}</strong>, before your arrival.
        </Alert>
      ) : isDeposit ? (
        <Alert variant="info">
          You will be charged{" "}
          <strong>
            {formatCurrency(paymentInfo.chargedAmountCents, property.currency)}
          </strong>{" "}
          now as a deposit. The remaining balance is due at check-in.
        </Alert>
      ) : null}

      <div className={`${bookingCardClassName} p-4`}>
        <PaymentElement />
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Secured by Stripe
      </div>

      <Button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !elements || busy}
        className={`h-10 w-full text-base ${bookingCtaButtonClassName}`}
      >
        {isActionPending
          ? "Confirming booking…"
          : isProcessing
            ? isSetupFlow
              ? "Saving card…"
              : "Processing payment…"
            : isSetupFlow
              ? "Save card & confirm booking"
              : `Pay ${formatCurrency(paymentInfo.chargedAmountCents, property.currency)}${isDeposit ? " deposit" : ""}`}
      </Button>
    </div>
  );
}

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
  const { resolvedTheme } = useTheme();
  const stripeAppearance = buildStripeAppearance(resolvedTheme === "dark");

  const [stage, setStage] = useState<"summary" | "payment">("summary");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  const nights =
    (new Date(`${checkOut}T00:00:00Z`).getTime() -
      new Date(`${checkIn}T00:00:00Z`).getTime()) /
    86400000;

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent");
    const setupIntentId = searchParams.get("setup_intent");
    const code = searchParams.get("code");

    if (paymentIntentId && code) {
      setPaymentInfo({
        type: "payment",
        clientSecret: "",
        paymentIntentId,
        chargedAmountCents: 0,
        paymentType: "full_payment",
        reservationCode: code,
      });
      setAutoSubmit(true);
    } else if (setupIntentId && code) {
      setPaymentInfo({
        type: "setup",
        clientSecret: "",
        setupIntentId,
        customerId: "",
        totalCents: 0,
        reservationCode: code,
        scheduledChargeDate: "",
      });
      setAutoSubmit(true);
    }
  }, [searchParams]);

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
        guestEmail: guestDetails.email,
        guestFirstName: guestDetails.firstName,
        guestLastName: guestDetails.lastName,
      });

      if ("error" in result) {
        setPaymentError(result.error);
        return;
      }

      setPaymentInfo(result as PaymentInfo);
      setStage("payment");
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Could not set up payment. Please try again.";
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

  if (
    autoSubmit ||
    (isPending && paymentInfo !== null && paymentInfo.clientSecret === "")
  ) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Completing your reservation…</p>
      </div>
    );
  }

  const combinedError = paymentError ?? error;

  return (
    <div>
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={stage === "payment" ? () => setStage("summary") : handleBack}
          disabled={isPending || isCreatingPI}
          className={`mb-3 px-0 ${bookingGhostButtonClassName}`}
        >
          ← {stage === "payment" ? "Back to summary" : "Edit details"}
        </Button>
        <h2 className="text-xl font-semibold text-foreground">
          {stage === "payment" ? "Payment" : "Review & confirm"}
        </h2>
      </div>

      <div className={`${bookingCardClassName} mb-5 divide-y divide-border`}>
        <div className="p-4">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-booking-accent">
            Stay
          </p>
          <div className="space-y-0.5">
            <DetailRow label="Room" value={selectedRoomType.name} />
            <DetailRow label="Check-in" value={formatDate(checkIn)} />
            <DetailRow label="Check-out" value={formatDate(checkOut)} />
            <DetailRow
              label="Duration"
              value={`${nights} ${nights === 1 ? "night" : "nights"}`}
            />
            <DetailRow
              label="Guests"
              value={`${adults} ${adults === 1 ? "adult" : "adults"}${childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}`}
            />
          </div>
        </div>

        <div className="p-4">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-booking-accent">
            Guest
          </p>
          <div className="space-y-0.5">
            <DetailRow
              label="Name"
              value={`${guestDetails.firstName} ${guestDetails.lastName}`}
            />
            <DetailRow label="Email" value={guestDetails.email} />
            {guestDetails.phone && <DetailRow label="Phone" value={guestDetails.phone} />}
            {guestDetails.specialRequests && (
              <DetailRow
                label="Requests"
                value={
                  <span className="max-w-[16rem] whitespace-pre-wrap break-words text-right">
                    {guestDetails.specialRequests}
                  </span>
                }
              />
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-booking-accent">
            Price
          </p>
          <div className="space-y-0.5">
            <DetailRow
              label={`${formatCurrency(totalCents / nights, property.currency)} × ${nights} ${nights === 1 ? "night" : "nights"}`}
              value={formatCurrency(totalCents, property.currency)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(totalCents, property.currency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {cancellationPolicyLabel(
              property.cancellationPolicy,
              property.cancellationDeadlineDays,
            )}
          </p>
        </div>
      </div>

      {combinedError && (
        <div className="mb-4">
          <InlineError>{combinedError}</InlineError>
        </div>
      )}

      {stage === "summary" && (
        <Button
          type="button"
          onClick={handleProceedToPayment}
          disabled={isCreatingPI || isPending}
          className={`h-10 w-full text-base ${bookingCtaButtonClassName}`}
        >
          {isCreatingPI ? "Setting up payment…" : "Proceed to payment"}
        </Button>
      )}

      {stage === "payment" && paymentInfo && stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: paymentInfo.clientSecret,
            appearance: stripeAppearance,
          }}
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
            onError={(message) => setPaymentError(message)}
            isActionPending={isPending}
          />
        </Elements>
      )}

      {stage === "payment" && !stripePromise && (
        <InlineError>
          Payment is not configured. Please contact the property.
        </InlineError>
      )}

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
          value={paymentInfo?.type === "payment" ? paymentInfo.paymentIntentId : ""}
        />
        <input
          type="hidden"
          name="setupIntentId"
          value={paymentInfo?.type === "setup" ? paymentInfo.setupIntentId : ""}
        />
        <input
          type="hidden"
          name="stripeCustomerId"
          value={paymentInfo?.type === "setup" ? paymentInfo.customerId : ""}
        />
        <input
          type="hidden"
          name="reservationCode"
          value={paymentInfo?.reservationCode ?? ""}
        />
      </form>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        By confirming, you agree to our booking terms.
      </p>
    </div>
  );
}
