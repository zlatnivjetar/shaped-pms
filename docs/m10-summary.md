# Milestone 10 + 11 — Guest Self-Service Portal + Cancellation Policy

**Status:** Complete

> M10 and M11 were implemented together. M11 (policy-aware refunds) depends on M10 (the guest portal must exist before policy terms can be shown there), and both share the same cancellation code path.

---

## Overview

Guests can now view and cancel their own bookings through a secure token-gated portal without contacting the property. Cancellations are policy-aware — the refund amount depends on the property's configured policy (flexible / moderate / strict) and how far in advance the cancellation happens. The same policy logic applies whether the cancellation is initiated by the guest via the portal or by staff via the dashboard.

---

## Schema (`src/db/schema.ts` → migration `0006`)

Three new columns across two tables:

### `reservations`
- `manage_token` — `varchar(64)`, unique, nullable. A 48-char hex token generated at booking time, embedded in the manage link sent to the guest. Used to authenticate the guest portal without a login.

### `properties`
- `cancellation_policy` — new `cancellation_policy` enum (`flexible | moderate | strict`), `NOT NULL DEFAULT 'flexible'`
- `cancellation_deadline_days` — `integer`, `NOT NULL DEFAULT 7`. The number of days before check-in that determines the refund window.

**Policy rules:**
| Policy | Before deadline | After deadline |
|---|---|---|
| `flexible` | Full refund | No refund |
| `moderate` | 50% refund | No refund |
| `strict` | No refund | No refund |

---

## Cancellation Utility Library (`src/lib/cancellation.ts`)

New file of pure functions with no DB calls — easy to unit test and reused across the guest portal, dashboard cancel action, and booking engine UI.

### `generateManageToken(): string`
`randomBytes(24).toString("hex")` — 48-char hex, URL-safe. Same pattern as `generateReviewToken()` in `src/lib/reviews.ts`.

### `buildManageUrl(confirmationCode, token): string`
Builds `${NEXT_PUBLIC_APP_URL}/manage/${confirmationCode}?token=${token}`. Falls back to the Vercel URL if the env var is not set.

### `calculateRefundAmount(policy, deadlineDays, checkIn, paidCents, currency)`
Computes refund amount and a human-readable note for emails and UI. Compares today's date against `checkIn` using UTC calendar days (no time component) to determine if the cancellation is before or after the deadline.

Returns `{ refundCents: number, refundNote: string }`.

Example outputs:
- Flexible, before deadline → `{ refundCents: 42000, refundNote: "Full refund of €420.00 has been initiated..." }`
- Moderate, after deadline → `{ refundCents: 0, refundNote: "No refund — cancellation was made less than 7 days before check-in." }`
- Strict → `{ refundCents: 0, refundNote: "No refund per strict cancellation policy." }`

---

## Guest Portal (`/manage/[confirmationCode]?token=...`)

### Page (`src/app/(booking)/manage/[confirmationCode]/page.tsx`)

Server component. Lives in the `(booking)` route group so it inherits the public layout (no auth required).

**Token validation:** Queries the reservation by `confirmationCode`, then compares `reservation.manageToken` to the `token` search param. If missing, wrong, or the reservation doesn't exist — renders a locked error screen with zero booking data exposed. The error is identical for all invalid-token cases to avoid leaking reservation existence.

**Booking summary** (shown when token is valid):
- Confirmation code, status badge, check-in/out dates (with check-in/out times from property), room type, guest count, amount paid

**Cancellation section** (shown only when `status === 'confirmed'`):
- Policy name and deadline days
- Live refund preview from `calculateRefundAmount()` — updates automatically if the policy is changed in Settings
- "Cancel My Booking" button → `GuestCancelButton` client component

**Terminal states:**
- `cancelled` — shows cancellation date and reason; no action available
- `checked_in` / `checked_out` / `no_show` — informational message; no action available

### Cancel Button (`src/app/(booking)/manage/[confirmationCode]/cancel-button.tsx`)

Client component with a two-step confirmation flow:
1. "Cancel My Booking" → reveals confirmation prompt
2. "Keep Booking" (dismisses) or "Yes, Cancel" (calls server action)
3. On success: shows inline success message without a page redirect

### Guest Cancel Action (`src/app/(booking)/manage/[confirmationCode]/actions.ts`)

Server action `guestCancelReservation(confirmationCode, token, reason?)`.

Steps:
1. Re-fetches and re-validates the token server-side (never trusts the client)
2. Guards that `status === 'confirmed'` — returns an error for any other status
3. Loads property policy and captured payment
4. Calls `calculateRefundAmount()` to get `refundCents` and `refundNote`
5. Rolls back inventory: `GREATEST(0, booked_units - 1)` for each room type across all nights
6. Stripe: if `refundCents > 0`, calls `refundPayment(piId, refundCents)` (partial or full); if payment is `requires_capture` (deposit not yet charged), calls `cancelPaymentIntent` instead
7. Updates `payments.status = 'refunded'`
8. Updates `reservations.status = 'cancelled'`, `cancelled_at`, `cancellation_reason`
9. Fire-and-forget cancellation email via `sendCancellationConfirmation()` with `refundNote`
10. Returns `{ success: true }` or `{ error: string }`

---

## Booking Confirmation Email (`src/components/emails/booking-confirmation.tsx`)

Added a "Manage Your Booking" section before the footer. A branded button links to `buildManageUrl(confirmationCode, manageToken)`.

`sendBookingConfirmation()` in `src/lib/email.ts` extended with an optional `manageUrl?: string` prop, passed through from `createReservation()` in `src/app/(booking)/[propertySlug]/actions.ts`.

`createReservation()` now generates `manageToken` via `generateManageToken()`, stores it in the `reservations` INSERT, and passes `buildManageUrl(reservationCode, manageToken)` to the email sender.

---

## Settings — Cancellation Policy (`/settings/property`)

### Form (`src/app/(dashboard)/settings/property-form.tsx`)

New "Cancellation Policy" card added at the bottom of the property form, before the save button:
- **Policy** — shadcn `Select` with three options. Each label includes a brief description of the refund behaviour.
- **Deadline (days before check-in)** — `number` input, `min=1`, `max=365`, with helper text.

Both fields default to the current property values (`property.cancellationPolicy`, `property.cancellationDeadlineDays`).

### Action (`src/app/(dashboard)/settings/actions.ts`)

`updatePropertySchema` extended:
```ts
cancellationPolicy: z.enum(["flexible", "moderate", "strict"]),
cancellationDeadlineDays: z.coerce.number().int().min(1).max(365),
```

Both fields added to the `db.update(properties).set(...)` call.

---

## Dashboard Cancel — Policy Applied (`src/app/(dashboard)/reservations/actions.ts`)

`cancelReservation()` updated to apply the same policy logic as the guest portal:

1. Loads property `cancellationPolicy` and `cancellationDeadlineDays` from the already-fetched `reservation.property`
2. Calls `calculateRefundAmount()` with the captured payment amount
3. Issues a partial Stripe refund (`refundPayment(piId, refundCents)`) when `refundCents > 0`; skips the Stripe call entirely when `refundCents === 0` (policy says no refund)
4. Passes `refundNote` to `sendCancellationConfirmation()` so the guest email reflects the exact refund amount

Previously the dashboard always issued a full refund regardless of policy. Now dashboard and guest portal cancellations are consistent.

---

## Booking Engine — Cancellation Policy Label (`src/components/booking/step-confirm.tsx`)

A one-line policy description added under the Total amount on the confirm step:

| Policy | Label |
|---|---|
| `flexible` | `Free cancellation up to N days before arrival` |
| `moderate` | `50% refund if cancelled up to N days before arrival; no refund after` |
| `strict` | `Non-refundable` |

Rendered as muted `text-xs` below the total, always reflecting the current property configuration.

---

## Files Changed

| File | Change |
|---|---|
| `src/db/schema.ts` | New `cancellationPolicyEnum`; add `cancellationPolicy`, `cancellationDeadlineDays` to `properties`; add `manageToken` to `reservations`; export `CancellationPolicy` type |
| `src/db/migrations/0006_flashy_randall.sql` | **New** — migration for all three columns + enum |
| `src/lib/cancellation.ts` | **New** — `generateManageToken`, `buildManageUrl`, `calculateRefundAmount` |
| `src/app/(booking)/manage/[confirmationCode]/page.tsx` | **New** — guest portal server component |
| `src/app/(booking)/manage/[confirmationCode]/cancel-button.tsx` | **New** — two-step cancel client component |
| `src/app/(booking)/manage/[confirmationCode]/actions.ts` | **New** — `guestCancelReservation` server action |
| `src/app/(booking)/[propertySlug]/actions.ts` | Generate and store `manageToken` in `createReservation`; pass `manageUrl` to email sender |
| `src/lib/email.ts` | Add optional `manageUrl` param to `sendBookingConfirmation` |
| `src/components/emails/booking-confirmation.tsx` | Add "Manage Your Booking" button section |
| `src/app/(dashboard)/settings/property-form.tsx` | Add Cancellation Policy card (policy select + deadline input) |
| `src/app/(dashboard)/settings/actions.ts` | Extend `updatePropertySchema` and `db.update` call with policy fields |
| `src/app/(dashboard)/reservations/actions.ts` | Apply policy-aware refund logic to `cancelReservation` |
| `src/components/booking/step-confirm.tsx` | Add `cancellationPolicyLabel` helper and policy line under total |
