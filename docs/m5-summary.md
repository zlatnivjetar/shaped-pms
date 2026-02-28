# Milestone 5 — Guest Communication + Reviews

**Status:** Complete

---

## Schema (`src/db/schema.ts` → migration `0004`)

- 3 new enums: `review_status`, `email_type`, `email_status`
- `review_tokens` — one per reservation, 48-char hex token, 30-day expiry, `used_at` set on submission
- `reviews` — rating (1–5), optional title, body, stay dates, status (pending/published/hidden), property response
- `email_logs` — every send attempt logged with type, recipient, status (sent/failed), timestamp
- Updated relations on `reservations`, `guests`, `properties` to include the three new tables

---

## Email System

**`src/lib/email.ts`**
- Lazy Resend singleton — no key needed at build time
- `sendAndLog()` renders the React Email template, calls Resend, logs the result to `email_logs` in a `finally` block — never rethrows
- 5 named senders: `sendBookingConfirmation`, `sendCancellationConfirmation`, `sendPreArrival`, `sendPostStay`, `sendReviewRequest`

**`src/components/emails/`**
- `shared.ts` — `formatCurrency()`, `formatEmailDate()`, brand color constants
- `booking-confirmation.tsx` — confirmation code block, stay detail table, payment summary (with deposit note if applicable), check-in time, property address footer
- `pre-arrival.tsx` — reminder of tomorrow's check-in, time, address, booking reference
- `post-stay.tsx` — thank-you message, prominent "Leave a Review" button
- `review-request.tsx` — 2-day follow-up with star CTA
- `cancellation.tsx` — cancelled booking details, optional reason, refund note if payment was captured

---

## Email Triggers

**`src/app/(booking)/[propertySlug]/actions.ts`**
- After `createReservation` completes, fire-and-forget `sendBookingConfirmation`

**`src/app/(dashboard)/reservations/actions.ts`**
- `cancelReservation` — fetches guest + property, builds refund note if payment was captured, fire-and-forget `sendCancellationConfirmation`
- `checkOutReservation` — inserts a `review_tokens` row, fire-and-forget `sendPostStay` with the review URL

---

## Review Library (`src/lib/reviews.ts`)

- `generateReviewToken()` — 48-char cryptographically random hex
- `getReviewTokenExpiry()` — 30 days from now
- `buildReviewUrl(token)` — uses `NEXT_PUBLIC_APP_URL` env var

---

## Public Review Page (`/review/[token]`)

- Route group `(review)` — no dashboard layout
- Server component validates token: shows "already submitted" or "link expired" states where appropriate
- `ReviewForm` client component — 5 clickable SVG stars with hover, optional title, required body (min 10 chars), inline success message on submission
- `submitReview` server action — validates input, inserts review with `status: "pending"`, marks token `used_at`

---

## Dashboard Reviews Page (`/reviews`)

- Status filter tabs — All / Pending / Published / Hidden via `?status=` search param
- Average rating shown in header across all reviews
- Review cards — guest name, star display, title, body (truncated at 300 chars), stay dates, status badge, submission date
- Property response shown inline if present
- `ReviewActions` client component (uses `useTransition`):
  - Publish / Hide toggle
  - Respond — inline textarea, collapses on save
- `actions.ts` — `publishReview`, `hideReview`, `respondToReview` server actions

---

## Booking Engine Reviews Section

- `page.tsx` fetches up to 5 published reviews + computes average rating
- Passed as props to `BookingFlow`
- On the search step, renders below the search form: average rating line, review cards with guest initial avatar, stars, title, body excerpt, property response if present

---

## Vercel Cron (`src/app/api/v1/cron/daily/route.ts`)

- `GET /api/v1/cron/daily` — auth via `Authorization: Bearer $CRON_SECRET`
- **Pre-arrival job** — queries reservations checking in tomorrow, skips if `email_logs` already has a `pre_arrival` entry for that reservation
- **Review request job** — queries unused, non-expired tokens for guests who checked out 2+ days ago, skips if `review_request` already logged
- Returns `{ processed: { preArrival: N, reviewRequests: N } }`
- `vercel.json` schedules it at `0 8 * * *` (8am UTC)

---

## Seed Data

- `src/db/seed-reviews.ts` — seeds 3 published reviews against existing checked-out reservations, complete with property responses on two of them
- `npm run db:seed-reviews` added to `package.json`

---

## New Env Vars

| Var | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender name + address |
| `CRON_SECRET` | Bearer token for cron endpoint auth |
| `NEXT_PUBLIC_APP_URL` | Used to build review URLs (already existed) |
