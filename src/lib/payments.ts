import Stripe from "stripe";

// Lazy singleton — initialized on first use so build doesn't fail without env vars
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

export type PaymentType = "deposit" | "full_payment";

interface CreatePaymentIntentParams {
  amountCents: number;
  currency: string;
  paymentMode: "full_at_booking" | "deposit_at_booking";
  depositPercentage: number;
  metadata: Record<string, string>;
}

interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  chargedAmountCents: number;
  paymentType: PaymentType;
}

export async function createPaymentIntent({
  amountCents,
  currency,
  paymentMode,
  depositPercentage,
  metadata,
}: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
  const s = getStripe();
  const isDeposit = paymentMode === "deposit_at_booking";
  const chargedAmountCents = isDeposit
    ? Math.round((amountCents * depositPercentage) / 100)
    : amountCents;
  const paymentType: PaymentType = isDeposit ? "deposit" : "full_payment";

  const pi = await s.paymentIntents.create({
    amount: chargedAmountCents,
    currency: currency.toLowerCase(),
    capture_method: isDeposit ? "manual" : "automatic",
    metadata: {
      ...metadata,
      payment_mode: paymentMode,
      payment_type: paymentType,
      total_amount_cents: String(amountCents),
    },
  });

  return {
    clientSecret: pi.client_secret!,
    paymentIntentId: pi.id,
    chargedAmountCents,
    paymentType,
  };
}

interface CaptureResult {
  success: boolean;
  capturedAmountCents?: number;
  error?: string;
}

export async function capturePaymentIntent(
  paymentIntentId: string
): Promise<CaptureResult> {
  try {
    const pi = await getStripe().paymentIntents.capture(paymentIntentId);
    return { success: true, capturedAmountCents: pi.amount_received };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Capture failed",
    };
  }
}

interface RefundResult {
  success: boolean;
  refundedAmountCents?: number;
  error?: string;
}

export async function refundPayment(
  paymentIntentId: string,
  amountCents?: number
): Promise<RefundResult> {
  try {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    if (amountCents !== undefined) params.amount = amountCents;
    const refund = await getStripe().refunds.create(params);
    return { success: true, refundedAmountCents: refund.amount };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Refund failed",
    };
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await getStripe().paymentIntents.cancel(paymentIntentId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cancel failed",
    };
  }
}

export function constructWebhookEvent(
  rawBody: string,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

// Named export for direct Stripe access in booking actions
export { getStripe as stripe };
