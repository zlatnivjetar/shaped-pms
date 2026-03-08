# Milestones 14 + 15 — Abandoned Booking Cleanup + Discount System

**Completed:** 2026-03-08

---

## Milestone 14 — Abandoned Booking Cleanup

### What was built

Detects and cleans up bookings that were started (payment flow initiated) but never completed.

**Schema change:**
- `checkout_started_at` (timestamp, nullable) added to `reservations` table — migration `0009_eminent_greymalkin.sql`

**Booking flow change (M14 architecture):**

`createPaymentIntentForBooking` now does all of the following before returning a Stripe client secret:
1. Upserts the guest record
2. Atomically locks inventory (`booked_units + 1`) for all nights
3. Creates a `pending` reservation with `checkout_started_at = now()`
4. Inserts the `reservation_room` row immediately (critical — see bug fix below)

`createReservation` (called after payment succeeds) finds the existing pending reservation by confirmation code and updates it to `confirmed`. No second inventory lock.

**Cron endpoint:** `GET /api/v1/cron/abandoned`
- Auth: `Authorization: Bearer $CRON_SECRET`
- Finds reservations with `status = 'pending'` and `checkout_started_at` older than 15 minutes
- Cancels each with `cancellation_reason = 'abandoned'`
- Rolls back `booked_units` via `GREATEST(booked_units - 1, 0)` for all nights

**Vercel config:**
- Cron removed from `vercel.json` — Vercel Hobby plan only supports daily crons
- Endpoint works correctly; trigger via external cron service (e.g. cron-job.org) every 15 minutes in production

### Bug fixed during testing

**Problem:** The cron was cancelling reservations (status updated correctly, `{"cleaned":1}` returned) but inventory was never rolled back. Rooms remained unselectable after cleanup.

**Root cause:** `reservation_room` was only inserted in `createReservation` (after payment). For abandoned bookings where payment never completes, `reservationRooms` was an empty array — the rollback loop never executed.

**Fix:** Moved `reservation_room` insert into `createPaymentIntentForBooking` alongside the pending reservation. Removed the duplicate insert from `createReservation`.

---

## Milestone 15 — Discount System

### What was built

Percentage-based discounts per room type (or all room types), with optional date ranges. Stacks on top of rate plan pricing.

**Schema change:**
- `discounts` table — migration `0009_eminent_greymalkin.sql`
  - `property_id`, `room_type_id` (nullable — null = all room types), `name`, `percentage` (1–100), `date_start` (nullable), `date_end` (nullable), `status` (active | inactive)

**Pricing engine (`src/lib/pricing.ts`):**
- `resolveRate()` accepts a 4th optional `DiscountForPricing[]` param
- `resolveDiscountPct()` picks the highest applicable discount for a given date (date range aware)
- `resolveRateWithoutDiscount()` helper computes pre-discount total for strikethrough display
- Partial-stay discounts work correctly: e.g. a discount covering 3 of 4 nights applies only to those nights

**Availability engine:**
- `getAvailableRoomTypes()` fetches active discounts per room type and returns `discountPercentage` and `originalTotalCents` alongside the discounted `totalCents`

**Dashboard UI (`/rates` → Discounts section):**
- Create / edit / delete discounts
- Room type selector: "All room types" (null) or specific room type
- Optional date range; leave blank for permanent discount
- Active / inactive status toggle

**Booking engine (`step-select.tsx`):**
- Shows "X% off" badge when a discount applies
- Strikethrough original total + discounted total displayed

**REST API (`POST /api/v1/properties/[slug]/availability`):**
- Response includes `discountPercentage` and `originalTotalCents` per room type

### Bugs fixed during testing

1. **`SelectItem value=""` crash** — shadcn Select does not allow empty string values. Changed the "All room types" option to use `"all"` as a sentinel value in the UI.

2. **`"all" || null` evaluates to `"all"`** — the `||` operator only catches falsy values; `"all"` is truthy, so it was passed directly to the DB as `room_type_id`, causing a FK violation. Fixed with an explicit check: `roomTypeId && roomTypeId !== "all" ? roomTypeId : null`.

---

## Other fixes made during this milestone session

- **Dynamic route conflict** — `reservations/[confirmationCode]/route.ts` and `reservations/[id]/cancel/route.ts` were siblings with different param names, crashing Next.js on startup. Renamed `[confirmationCode]` folder to `[id]`; param destructured as `{ id: confirmationCode }` inside the handler.

---

## Files changed

| File | Change |
|---|---|
| `src/db/schema.ts` | `checkoutStartedAt` on reservations, `discounts` table |
| `src/db/migrations/0009_eminent_greymalkin.sql` | Migration for above |
| `src/lib/pricing.ts` | `resolveRate()` discount param, `resolveDiscountPct()`, `resolveRateWithoutDiscount()` |
| `src/lib/availability.ts` | `getAvailableRoomTypes()` returns `discountPercentage` + `originalTotalCents` |
| `src/app/(booking)/[propertySlug]/actions.ts` | M14 flow: pending reservation + inventory lock + reservation_room in `createPaymentIntentForBooking`; bug fix removing duplicate reservation_room insert from `createReservation` |
| `src/app/api/v1/cron/abandoned/route.ts` | New cron endpoint for abandoned cleanup |
| `src/app/(dashboard)/rates/page.tsx` | Discounts section UI |
| `src/app/(dashboard)/rates/discount-dialogs.tsx` | Create/edit/delete discount dialogs; "all" sentinel fix |
| `src/app/(dashboard)/rates/actions.ts` | `createDiscount`, `updateDiscount`, `deleteDiscount` server actions; explicit null coercion fix |
| `src/components/booking/step-select.tsx` | Discount badge + strikethrough price |
| `src/app/api/v1/properties/[slug]/availability/route.ts` | Returns `discountPercentage` + `originalTotalCents` |
| `src/app/api/v1/reservations/[id]/route.ts` | Renamed from `[confirmationCode]` |
| `vercel.json` | Removed abandoned cron (Hobby plan incompatible) |

---

## Test results

| # | Test | Result |
|---|---|---|
| 1 | Abandoned cron responds 200, rejects without auth | Pass |
| 2 | Start booking, don't pay, run cron → reservation cancelled, inventory rolled back | Pass (after bug fix) |
| 3 | Full booking flow end-to-end, reservation confirmed, reservation_room present | Pass |
| 4 | Create discount in dashboard | Pass (after SelectItem fix) |
| 5 | Discount badge + strikethrough shown in booking engine | Pass |
| 6 | Date-scoped discount activates/deactivates correctly, partial-stay discount prorated | Pass |
| 7 | REST API returns discountPercentage + originalTotalCents | Pass |
| 8 | "All room types" discount applies across all room types, edit/delete works | Pass (after null coercion fix) |
