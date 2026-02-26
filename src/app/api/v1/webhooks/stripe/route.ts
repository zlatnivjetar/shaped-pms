export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { constructWebhookEvent } from "@/lib/payments";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[stripe webhook] signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await db
          .update(payments)
          .set({
            status: "captured",
            capturedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.stripePaymentIntentId, pi.id));

        // Ensure reservation is confirmed (edge case: webhook arrives before row)
        const payment = await db.query.payments.findFirst({
          where: eq(payments.stripePaymentIntentId, pi.id),
        });
        if (payment) {
          await db
            .update(reservations)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(
              eq(reservations.id, payment.reservationId)
            );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await db
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.stripePaymentIntentId, pi.id));
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) {
          await db
            .update(payments)
            .set({
              status: "refunded",
              refundedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.stripePaymentIntentId, piId));
        }
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    // Log but return 200 to prevent Stripe from retrying
    console.error("[stripe webhook] handler error:", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
