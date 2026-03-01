# Milestone 12 + 13 — Booking Rules + Scheduled Charges

**Status:** Complete

> M12 and M13 were implemented together in one session. They share a single schema migration and touch different parts of the codebase (availability engine vs. payment flow) with no logical conflict.

---

## Overview

**M12** adds per-room-type booking rules — minimum/maximum stay lengths and day-of-week restrictions for check-in and check-out — enforced at every entry point: the booking engine UI, the `createReservation` server action, and the REST API. Rules can be seasonal (optional date range) or permanent. Guests see a clear violation message rather than a silent unavailability.

**M13** adds a second Stripe payment flow for properties that want to collect card details at booking time but charge closer to arrival. When a booking is made far enough in advance (beyond a configurable threshold), a Stripe Customer and SetupIntent are created to save the card without charging. A daily cron job charges due payments automatically with exponential backoff on failure. Near-term bookings fall through to the existing immediate PaymentIntent flow unchanged.

---

## Schema (`src/db/schema.ts` → migrations `0007`, `0008`)

### New enum value: `paymentModeEnum`
Added `"scheduled"` to the existing `payment_mode` enum (previously only `full_at_booking | deposit_at_booking`).

### `properties` — new column
- `scheduled_charge_threshold_days` — `integer NOT NULL DEFAULT 7`. Number of days before check-in that determines whether a booking uses the save-card flow (far out) or immediate charge flow (near term).

### `payments` — new columns
- `stripe_setup_intent_id` — `text`, nullable. Populated for scheduled-flow bookings instead of `stripe_payment_intent_id`.
- `stripe_payment_method_id` — `text`, nullable. The saved payment method to charge at cron time.
- `stripe_customer_id` — `text`, nullable. The Stripe Customer the payment method is attached to. Required for off-session charging.
- `stripe_payment_intent_id` — changed to **nullable** (was previously non-null). Scheduled payments have no PaymentIntent at booking time.
- `scheduled_charge_at` — `timestamp with time zone`, nullable. The date the cron should charge this payment (`checkIn - threshold days`).
- `charge_attempts` — `integer NOT NULL DEFAULT 0`. Incremented on each failed charge attempt.

### New table: `booking_rules`
```
booking_rules
├── id (uuid, pk)
├── property_id (fk → properties, cascade)
├── room_type_id (fk → room_types, cascade)
├── min_nights (integer, nullable)
├── max_nights (integer, nullable)
├── allowed_check_in_days (integer[], nullable) — 0=Sun … 6=Sat; null = all days allowed
├── allowed_check_out_days (integer[], nullable)
├── date_start (date, nullable) — rule only active from this date; null = always
├── date_end (date, nullable) — rule only active until this date; null = always
├── created_at
└── updated_at
```

### New table: `scheduled_charge_log`
```
scheduled_charge_log
├── id (uuid, pk)
├── payment_id (fk → payments, cascade)
├── attempted_at (timestamp, default now)
├── status (text) — "succeeded" | "failed"
├── error_message (text, nullable)
└── created_at
```

---

## M12 — Booking Rules

### Core enforcement (`src/lib/availability.ts`)

**`checkBookingRules(propertyId, roomTypeId, checkIn, checkOut)`**

Pure async function. Queries all `booking_rules` rows for the given room type whose date range overlaps the stay (or has no date range). Validates:
- `minNights` — stay length must be ≥ this value
- `maxNights` — stay length must be ≤ this value
- `allowedCheckInDays` — check-in weekday (UTC) must be in the allowed set
- `allowedCheckOutDays` — check-out weekday (UTC) must be in the allowed set

Returns `{ valid: boolean; violations: string[] }` with human-readable messages such as "Minimum stay is 3 nights" and "Check-in not allowed on Thursday".

**`getAvailableRoomTypes()`** updated to batch-load all rules for the property in a single query, then annotate each result with `ruleViolation: string | null`. No N+1 queries.

`AvailableRoomType` type extended:
```ts
ruleViolation: string | null;
```

### Booking engine — room selection (`src/components/booking/step-select.tsx`)

Room types with a `ruleViolation` are now shown **grayed out** rather than hidden:
- Reduced opacity, desaturated
- Amber warning box below the card with the violation message
- "Unavailable" button (disabled) instead of "Select"

Guests understand why the room is unavailable and can adjust their dates instead of wondering if the property is full.

### Booking engine — `createReservation` (`src/app/(booking)/[propertySlug]/actions.ts`)

Server-side re-validation of booking rules before the inventory lock step. Returns the first violation string as an error if rules are breached. This prevents any client-side bypass.

### REST API (`src/app/api/v1/reservations/route.ts`)

After the availability check, `checkBookingRules()` is called. If violated, returns HTTP 400:
```json
{ "error": "Booking rule violation", "details": ["Minimum stay is 3 nights"] }
```

`apiError()` in `src/lib/api-utils.ts` extended with an optional `extra?: Record<string, unknown>` parameter to support the `details` field.

### Dashboard — Booking Rules management (`/settings/room-types`)

New **"Booking Rules"** button per room type on the room types settings page. Opens `ManageBookingRulesDialog`, which shows existing rules for the room type and provides an add/delete interface.

**Rule form fields:**
- Min nights (number input, optional)
- Max nights (number input, optional)
- Allowed check-in days (checkboxes Mon–Sun, optional)
- Allowed check-out days (checkboxes Mon–Sun, optional)
- Date from / Date to (date inputs, optional — for seasonal rules)

**Server actions (`src/app/(dashboard)/room-types/booking-rule-actions.ts`):**
- `createBookingRule(roomTypeId, prevState, formData)` — validates at least one constraint is set; inserts rule
- `deleteBookingRule(ruleId)` — deletes rule by id

Rules are displayed as human-readable summaries (e.g. "Min 3 nights · Check-in: Mon, Fri · From 2026-06-01 to 2026-08-31").

---

## M13 — Scheduled Charges

### Stripe payment library (`src/lib/payments.ts`)

**`createSetupIntent(guestEmail, guestName, metadata)`**

1. Creates a Stripe Customer (`customers.create`) with the guest's email and name — this is what appears in the Stripe dashboard and is required for off-session reuse.
2. Creates a SetupIntent with `customer: customerId` and `usage: 'off_session'`.
3. Returns `{ clientSecret, setupIntentId, customerId }`.

**`chargeWithSavedMethod(customerId, paymentMethodId, amountCents, currency, reservationId)`**

Creates a PaymentIntent with `customer`, `payment_method`, `confirm: true`, `off_session: true`. Used exclusively by the cron job.

### Property settings (`/settings/property`)

**Form (`src/app/(dashboard)/settings/property-form.tsx`):**
- "Scheduled (charge before arrival)" added to the Payment Mode select.
- When "Scheduled" is selected, a "Charge X days before check-in" input appears (`scheduledChargeThresholdDays`), with helper text explaining the save-now / charge-later flow.
- Deposit % input is hidden when mode is not `deposit_at_booking`.

**Action (`src/app/(dashboard)/settings/actions.ts`):**
- `scheduled` added to the payment mode enum validation.
- `scheduledChargeThresholdDays` validated as `z.coerce.number().int().min(1).max(365)`.

### Booking engine — dual-flow (`src/app/(booking)/[propertySlug]/actions.ts`)

**`createPaymentIntentForBooking()`** now accepts `guestEmail` and `guestName` parameters and returns a discriminated union:

```ts
type PaymentIntentResult =
  | { type: "payment"; clientSecret; paymentIntentId; chargedAmountCents; paymentType; reservationCode }
  | { type: "setup"; clientSecret; setupIntentId; customerId; totalCents; reservationCode; scheduledChargeDate }
  | { error: string }
```

**Flow selection logic:**
- `paymentMode === 'scheduled'` AND `daysUntilCheckIn > threshold` → SetupIntent (save card)
- Everything else (including scheduled near-term) → PaymentIntent (immediate charge)

**`createReservation()`** reads `setupIntentId` and `stripeCustomerId` from form data. For the setup flow:
- Retrieves the SetupIntent from Stripe to verify `status === 'succeeded'` and extract `payment_method`
- Falls back to reading `customer` from the retrieved SetupIntent if `stripeCustomerId` is missing (3DS redirect case)
- Inserts a `payments` row with `stripeSetupIntentId`, `stripePaymentMethodId`, `stripeCustomerId`, `status = 'pending'`, `scheduledChargeAt = checkIn - threshold days`

### Booking engine — confirm step (`src/components/booking/step-confirm.tsx`)

- `PaymentInfo` type updated to discriminated union matching `PaymentIntentResult`
- `handleProceedToPayment` passes `guestEmail` and `guestName` to `createPaymentIntentForBooking`
- `PaymentFormInner` uses `stripe.confirmSetup()` for setup flow, `stripe.confirmPayment()` for payment flow — the `<PaymentElement>` works with both client secret types
- Info banner for setup flow: "Your card will be saved now and charged €X on [date], before your arrival"
- Hidden form includes `setupIntentId`, `stripeCustomerId` fields
- 3DS return URL detection handles both `payment_intent` and `setup_intent` URL params

### Cron job (`src/app/api/v1/cron/daily/route.ts`)

Extended with a `runScheduledCharges` step after pre-arrival emails and review requests.

**Query:** payments where `scheduled_charge_at <= now`, `status = 'pending'`, `charge_attempts < 3`, `stripe_payment_method_id IS NOT NULL`, `stripe_customer_id IS NOT NULL`.

**On success:**
- Updates payment: `status = 'captured'`, `captured_at`, `stripe_payment_intent_id` (from the charge result)
- Inserts `scheduled_charge_log` row: `status = 'succeeded'`

**On failure:**
- Increments `charge_attempts`
- Reschedules: `scheduled_charge_at = now + 2^attempts days` (exponential backoff: 2 → 4 → 8 days)
- After 3 attempts: `status = 'failed'`, `scheduled_charge_at = null`
- Inserts `scheduled_charge_log` row: `status = 'failed'`, `error_message`

### Dashboard — Reservation detail (`/reservations/[id]`)

Payment card updated to show scheduled charge state:
- `status = 'pending'` with `scheduledChargeAt` set → "Charge scheduled for [date]" in blue
- `chargeAttempts > 0` → "X charge attempt(s) — last failed" in amber
- Up to 3 most recent `scheduledChargeLogs` shown with attempt date, status (green/red), and error message if any

---

## Cancellation handling for scheduled payments

When a reservation with a pending scheduled payment is cancelled (by guest portal or dashboard), no Stripe API call is made — the card was never charged. The payment row is updated to `status = 'refunded'` in the DB only. This is handled in both:
- `src/app/(booking)/manage/[confirmationCode]/actions.ts` (`guestCancelReservation`)
- `src/app/(dashboard)/reservations/actions.ts` (`cancelReservation`)

---

## Files Changed

| File | Change |
|---|---|
| `src/db/schema.ts` | Add `scheduled` to `paymentModeEnum`; add `scheduledChargeThresholdDays` to `properties`; make `stripePaymentIntentId` nullable; add `stripeSetupIntentId`, `stripePaymentMethodId`, `stripeCustomerId`, `scheduledChargeAt`, `chargeAttempts` to `payments`; new `bookingRules` table; new `scheduledChargeLog` table; updated relations; new type exports |
| `src/db/migrations/0007_living_klaw.sql` | **New** — M12+M13 schema changes |
| `src/db/migrations/0008_lonely_boomer.sql` | **New** — add `stripeCustomerId` column (bug-fix follow-up) |
| `src/lib/availability.ts` | Add `checkBookingRules()`; extend `getAvailableRoomTypes()` with `ruleViolation` |
| `src/lib/payments.ts` | Add `createSetupIntent()` (with Customer creation); add `chargeWithSavedMethod()` (with `customerId`) |
| `src/lib/api-utils.ts` | `apiError()` accepts optional `extra` for rule violation `details` field |
| `src/app/(booking)/[propertySlug]/actions.ts` | Dual-flow `createPaymentIntentForBooking`; setup-flow handling in `createReservation` |
| `src/components/booking/step-confirm.tsx` | Dual-flow UI (setup vs payment); guest details passed for Customer creation; hidden fields for setup flow |
| `src/components/booking/step-select.tsx` | Grayed-out cards with violation message for rule-blocked room types |
| `src/app/api/v1/reservations/route.ts` | Rule enforcement with HTTP 400 on violation |
| `src/app/api/v1/cron/daily/route.ts` | Scheduled charge execution with retry/backoff |
| `src/app/(dashboard)/room-types/booking-rule-actions.ts` | **New** — `createBookingRule`, `deleteBookingRule` server actions |
| `src/app/(dashboard)/room-types/room-type-dialogs.tsx` | `ManageBookingRulesDialog` with rule list, form, and delete |
| `src/app/(dashboard)/settings/room-types/page.tsx` | Fetch and pass `bookingRules` per room type |
| `src/app/(dashboard)/settings/property-form.tsx` | Scheduled mode UI with threshold input |
| `src/app/(dashboard)/settings/actions.ts` | `scheduled` mode + `scheduledChargeThresholdDays` validation |
| `src/app/(dashboard)/reservations/[id]/page.tsx` | Scheduled charge status display + charge log history |
| `src/app/(dashboard)/reservations/[id]/payment-actions.tsx` | Null guards for nullable `stripePaymentIntentId` |
| `src/app/(dashboard)/reservations/actions.ts` | Cancel handling for pending scheduled payments |
| `src/app/(booking)/manage/[confirmationCode]/actions.ts` | Cancel handling for pending scheduled payments |
