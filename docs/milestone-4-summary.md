# Milestone 4: Stripe Payments

## What was built

### Database
- Added `payments` table with `paymentTypeEnum` (deposit | full_payment | refund) and `paymentStatusEnum` (pending | requires_capture | captured | failed | refunded)
- Migration `0003_simple_deathbird.sql` applied to Neon

### `src/lib/payments.ts`
Stripe server-side utility with lazy singleton initialization (avoids build failures when key is not set):
- `createPaymentIntent()` — full or deposit amount, automatic or manual capture
- `capturePaymentIntent()` — captures a held authorization
- `refundPayment()` — full or partial refund
- `cancelPaymentIntent()` — cancels an uncaptured authorization
- `constructWebhookEvent()` — signature verification (available but webhook not registered for MVP)

### Booking flow
- New action `createPaymentIntentForBooking()` — computes total server-side, pre-generates reservation code, creates Stripe PI
- `createReservation()` updated to require `paymentIntentId` + `reservationCode`, verifies PI status before creating reservation, inserts payment row
- `StepConfirm` rewritten with two stages:
  - **Summary** → "Proceed to payment" calls `createPaymentIntentForBooking`
  - **Payment** → Stripe Elements (`PaymentElement`) collects card, on success submits hidden form to `createReservation`
  - 3DS redirect handled via `useSearchParams` + auto-submit on return

### Dashboard
- Reservation list: added Payment column with status badge
- Reservation detail: replaced placeholder card with real payment data (type, amount, status)
- `PaymentActions` client component: **Capture deposit** button (requires_capture) and **Issue refund** button (captured)
- `cancelReservation` updated to auto-refund or cancel the Stripe PI when a reservation is cancelled

### Webhook handler
- `src/app/api/v1/webhooks/stripe/route.ts` created, handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- **Not registered in Stripe dashboard** — deferred as unnecessary for MVP

## Payment modes
- **Full payment at booking** — card charged immediately (`capture_method: automatic`)
- **Deposit at booking** — card authorized for deposit % only (`capture_method: manual`), captured from dashboard at check-in

## Env vars required
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # set but webhook endpoint not registered
```

## Verified working
- Successful payment with `4242 4242 4242 4242` → reservation + payment row created
- Declined card shows inline error, no reservation created
- Deposit flow shows Auth held status in dashboard
- All 23 existing tests still pass
