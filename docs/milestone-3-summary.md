# Milestone 3: Guest-Facing Booking Engine

## What was built

### Database
- Added `guests`, `reservations`, and `reservation_rooms` tables with enums:
  - `reservation_status` (pending | confirmed | checked_in | checked_out | cancelled | no_show)
  - `reservation_channel` (direct | booking_com | airbnb | expedia | walk_in | phone)
- `guests` has a unique index on `(property_id, email)` — the upsert key for returning guests
- `reservations.confirmation_code` is unique; `reservation_rooms.room_id` is nullable (assigned at check-in)
- Migration `0002_milky_baron_zemo.sql` applied to Neon

### `src/lib/confirmation-code.ts`
- `generateConfirmationCode()` — generates `SHP-XXXXX` using `crypto.getRandomValues`; character set excludes ambiguous characters (0/O, 1/I)

### `src/lib/validators.ts`
- `searchParamsSchema` — validates check-in/out dates (YYYY-MM-DD) + adults/children counts
- `guestDetailsSchema` — first name, last name, email (validated), optional phone + special requests
- `createReservationSchema` — combined schema for the final reservation submission

### Booking engine (`/(booking)/[propertySlug]/`)
Server component at `page.tsx` fetches all step-specific data on the server and passes it down to `BookingFlow`. Step is driven by the `?step=` URL search parameter. Navigation between steps uses `router.push` with URL params carrying all state (`check_in`, `check_out`, `adults`, `children`, `room_type_id`, `code`).

**`BookingFlow` client component** — renders step indicator (4 steps: Dates → Room → Details → Confirm), manages `guestDetails` state in React with `sessionStorage` persistence across step transitions; clears on completion.

- **Step 1 — Search** (`step-search.tsx`): date pickers (HTML `<input type="date">`) with `min` validation; auto-advances checkout when check-in is set past it; guest count selects; client-side validation before navigating to `select`
- **Step 2 — Select** (`step-select.tsx`): displays available room types from `getAvailableRoomTypes()`; shows name, description, max occupancy, nightly rate, and total for the stay; each card navigates to `details` with `room_type_id`
- **Step 3 — Details** (`step-details.tsx`): guest info form (first/last name, email, phone, special requests) with Zod validation; updates `guestDetails` in parent state; navigates to `confirm`
- **Step 4 — Confirm** (`step-confirm.tsx`): two-stage component:
  - **Summary stage** — shows full booking summary card (room, dates, guest info, total); "Proceed to payment" calls `createPaymentIntentForBooking`
  - **Payment stage** — Stripe `<Elements>` + `<PaymentElement>`; on success calls `formRef.current.requestSubmit()` on a hidden form wired to the `createReservation` server action
  - 3DS return: `useEffect` detects `payment_intent` + `code` in URL search params, reconstructs `paymentInfo`, sets `autoSubmit`, then a second effect submits the hidden form
- **Step 5 — Complete** (`step-complete.tsx`): confirmation code displayed in monospace on dark card; full booking summary; "Make another booking" link back to search; email notice

The **search step** also renders published reviews (up to 5) with average rating below the search form — fetched on the server alongside other step data.

### `src/app/(booking)/[propertySlug]/actions.ts`
- **`createPaymentIntentForBooking()`** — computes total server-side using `resolveRate`, pre-generates a collision-checked reservation code (up to 10 attempts), creates Stripe PI with reservation code + property/room IDs in metadata; returns `clientSecret`, `paymentIntentId`, `chargedAmountCents`, `paymentType`, `reservationCode`
- **`createReservation()`** — the main booking server action:
  1. Validates form data with `createReservationSchema`
  2. Retrieves and verifies the Stripe PI (must be `succeeded` or `requires_capture`; metadata `reservation_code` must match)
  3. Pre-checks availability per night
  4. **Atomic double-booking prevention**: conditional `UPDATE inventory SET booked_units = booked_units + 1 WHERE (total - booked - blocked) >= 1` — if fewer rows update than expected nights, rolls back updated rows and returns an error
  5. Upserts guest by `(property_id, email)`
  6. Inserts reservation using the pre-generated code from PI metadata
  7. Inserts `reservation_rooms` row with locked `rate_per_night_cents`
  8. Inserts `payments` row
  9. Updates `guests.total_stays` and `guests.total_spent_cents` via SQL expressions
  10. Fire-and-forget `sendBookingConfirmation`
  11. Rolls back inventory on any non-redirect exception
  12. Redirects to `?step=complete&code=SHP-XXXXX`

### Dashboard — reservations list (`/reservations`)
- Status filter tab strip (All / Pending / Confirmed / Checked In / Checked Out / Cancelled / No Show) via `?status=` search param
- Table: confirmation code (link), guest name + email, room type, check-in, check-out, nights, status badge, payment badge, channel, total
- Payment column shows badge from joined `payments` rows (Pending / Auth held / Paid / Failed / Refunded)

### Dashboard — reservation detail (`/reservations/[id]`)
- Four cards: Guest (name, email, phone, country), Stay (room type, room number if assigned, dates, nights, guest count), Payment (rate × nights, total, payment rows with capture/refund actions), Notes (special requests + cancellation reason if present)
- **`ReservationActions`** client component — renders contextual status transition buttons:
  - `pending` → Confirm, Cancel
  - `confirmed` → Check In, No Show, Cancel reservation (with optional reason text input)
  - `checked_in` → Check Out
  - `checked_out` / `cancelled` / `no_show` → no actions shown
  - Cancel shows inline text input for reason before confirming

### `src/app/(dashboard)/reservations/actions.ts`
- `confirmReservation`, `checkInReservation` — simple status updates
- `checkOutReservation` — updates status, generates review token, fires `sendPostStay` (added in M5 but wired here)
- `cancelReservation` — rolls back inventory for each `reservation_rooms` row; if payment is `captured` calls `refundPayment`; if `requires_capture` calls `cancelPaymentIntent`; updates payment status; fires `sendCancellationConfirmation`
- `markNoShow` — rolls back inventory; updates status
- `capturePaymentAction`, `refundPaymentAction` — thin wrappers around `lib/payments`

### Dashboard — guests list (`/guests`)
- Table: name, email, phone, country, total stays, total spent
- `total_stays` and `total_spent_cents` updated on booking creation; read-only in this view

### `src/db/seed-reservations.ts`
- `npm run db:seed-reservations` — seeds 5 test guests and 7 reservations covering all key states:
  - 3 checked-out (past stays across studio, one-bedroom, penthouse; channels: direct, booking.com, airbnb)
  - 1 checked-in (current stay, two-bedroom, direct)
  - 2 confirmed (upcoming, direct and expedia)
  - 1 cancelled (with cancellation reason)
- Idempotent: skips reservations by confirmation code; upserts guests by email
- Increments `booked_units` in inventory for all non-cancelled reservations

## Double-booking prevention
neon-http does not support transactions. Double-booking is prevented by a single conditional SQL `UPDATE` that only increments `booked_units` when the available count is ≥ 1. If the update touches fewer nights than expected, any partial increments are rolled back immediately in a follow-up `UPDATE`.

## Verified working
- Guest visits `/preelook-apartments`, picks dates, selects room, enters details, pays via Stripe, receives confirmation code
- Reservation appears in dashboard immediately with correct status and payment badge
- Availability decrements in real-time; cancellation restores it
- Double-booking blocked at the database level — concurrent requests cannot both succeed
- All status transitions (confirm → check-in → check-out → cancel → no-show) work from the detail page
- Cancellation rolls back inventory and refunds or cancels the Stripe PI
