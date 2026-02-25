# Shaped PMS

You are helping build a PMS (Property Management System). Read the full build plan below before doing anything.

Current milestone: 3

## Build Plan

# Shaped PMS — Build Plan

**Version:** 1.0
**Created:** 2026-02-25
**Status:** LOCKED — reference document for all build sessions

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | Next.js 15 (App Router) |
| Database | Neon |
| ORM | Drizzle ORM |
| Payments | Stripe |
| Email | Resend + React Email |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Deployment | Vercel |
| Auth | Better Auth |
| Validation | Zod |
| Testing | Vitest |
| Repository | GitHub (public) |

---

## Database Schema

All tables use UUIDs as primary keys. All timestamps are UTC.
`property_id` is present on nearly every table — multi-tenancy from day one.

### Core Entities

```
properties
├── id (uuid, pk)
├── name
├── slug (unique, used in booking engine URLs)
├── description
├── address, city, country
├── currency (default "EUR")
├── timezone (default "Europe/Zagreb")
├── check_in_time (time)
├── check_out_time (time)
├── deposit_percentage (int, default 30, used by Stripe logic)
├── payment_mode (full_at_booking | deposit_at_booking)
├── status (active | inactive)
├── stripe_account_id (nullable, for Stripe Connect)
├── api_key (unique, for REST API auth)
├── created_at
└── updated_at

room_types
├── id (uuid, pk)
├── property_id (fk → properties)
├── name (e.g. "Double Sea View")
├── slug
├── description
├── base_occupancy
├── max_occupancy
├── base_rate_cents (default nightly rate in cents)
├── sort_order
├── status (active | inactive)
├── created_at
└── updated_at

rooms
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── room_number (e.g. "101", "A2")
├── floor (nullable)
├── status (available | maintenance | out_of_service)
├── created_at
└── updated_at

rate_plans
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── name (e.g. "Summer 2026", "Early Bird")
├── type (seasonal | length_of_stay | occupancy)
├── date_start (date, nullable)
├── date_end (date, nullable)
├── min_nights (nullable)
├── rate_cents (overrides base_rate_cents when active)
├── priority (higher number wins on overlap)
├── status (active | inactive)
├── created_at
└── updated_at

inventory
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── date (date)
├── total_units (int)
├── booked_units (int, default 0)
├── blocked_units (int, default 0)
├── rate_override_cents (nullable, per-date manual price)
├── created_at
└── updated_at
UNIQUE: (property_id, room_type_id, date)
Available = total_units - booked_units - blocked_units

guests
├── id (uuid, pk)
├── property_id (fk → properties)
├── email
├── first_name
├── last_name
├── phone (nullable)
├── country (nullable)
├── notes (nullable)
├── total_stays (int, default 0)
├── total_spent_cents (int, default 0)
├── created_at
└── updated_at
UNIQUE: (property_id, email)

reservations
├── id (uuid, pk)
├── property_id (fk → properties)
├── guest_id (fk → guests)
├── confirmation_code (unique, e.g. "SHP-A7K2M")
├── check_in (date)
├── check_out (date)
├── nights (int)
├── adults (int)
├── children (int, default 0)
├── status (pending | confirmed | checked_in | checked_out | cancelled | no_show)
├── channel (direct | booking_com | airbnb | expedia | walk_in | phone)
├── total_cents (int)
├── currency
├── special_requests (text, nullable)
├── cancelled_at (nullable)
├── cancellation_reason (nullable)
├── created_at
└── updated_at

reservation_rooms
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── room_type_id (fk → room_types)
├── room_id (fk → rooms, nullable — assigned at check-in)
├── rate_per_night_cents (locked at booking time)
├── created_at
└── updated_at

payments
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── property_id (fk → properties)
├── stripe_payment_intent_id
├── type (deposit | full_payment | refund)
├── amount_cents (int)
├── currency
├── status (pending | requires_capture | captured | failed | refunded)
├── captured_at (nullable)
├── refunded_at (nullable)
├── created_at
└── updated_at

review_tokens
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── property_id (fk → properties)
├── token (unique, random string)
├── expires_at (30 days after checkout)
├── used_at (nullable)
├── created_at
└── updated_at

reviews
├── id (uuid, pk)
├── property_id (fk → properties)
├── reservation_id (fk → reservations)
├── guest_id (fk → guests)
├── review_token_id (fk → review_tokens)
├── rating (int, 1-5)
├── title (nullable)
├── body (text)
├── stay_date_start (date)
├── stay_date_end (date)
├── status (pending | published | hidden)
├── property_response (nullable)
├── property_responded_at (nullable)
├── created_at
└── updated_at

users
├── id (uuid, pk)
├── property_id (fk → properties)
├── email
├── name
├── role (owner | manager | front_desk)
├── created_at
└── updated_at

email_logs
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── property_id (fk → properties)
├── type (confirmation | pre_arrival | post_stay | review_request | cancellation)
├── recipient_email
├── subject
├── status (sent | failed)
├── sent_at
├── created_at
└── updated_at
```

---

## Project Structure

```
shaped-pms/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Authenticated property dashboard
│   │   │   ├── properties/
│   │   │   ├── rooms/
│   │   │   ├── rates/
│   │   │   ├── reservations/
│   │   │   ├── guests/
│   │   │   ├── reviews/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── (booking)/            # Public guest-facing booking engine
│   │   │   ├── [propertySlug]/
│   │   │   └── layout.tsx
│   │   ├── api/v1/               # REST API
│   │   ├── auth/                 # Better Auth routes
│   │   └── layout.tsx
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── migrations/
│   │   ├── seed.ts               # Preelook Apartments seed data
│   │   └── index.ts              # DB connection + Drizzle client
│   ├── lib/
│   │   ├── availability.ts       # Availability engine
│   │   ├── pricing.ts            # Rate resolution logic
│   │   ├── payments.ts           # Stripe integration
│   │   ├── email.ts              # Resend integration
│   │   ├── reviews.ts            # Token generation + validation
│   │   ├── confirmation-code.ts  # Human-readable code generator
│   │   └── validators.ts         # Zod schemas
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── dashboard/
│   │   └── booking/
│   └── types/
│       └── index.ts
├── tests/
│   ├── availability.test.ts
│   ├── pricing.test.ts
│   └── api/
├── drizzle.config.ts
├── .env.local
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

---

## Milestones

### Milestone 1: Foundation + Property & Room Management

**You learn:** Next.js App Router, server components, server actions, Drizzle ORM, PostgreSQL, Tailwind, shadcn/ui, CRUD patterns.

**You build:**
- Initialize project: Next.js 15, TypeScript strict, Tailwind 4, Drizzle, Neon
- Install and configure shadcn/ui
- Drizzle schema for: `properties`, `room_types`, `rooms`
- First migration
- Seed script with Preelook Apartments (real room types, real room numbers)
- Dashboard layout: sidebar nav, top bar, responsive shell
- Property settings page: view/edit property details via server actions
- Room types page: list, create, edit, delete
- Rooms page: list grouped by type, add/remove individual rooms
- Deploy to Vercel with Neon connected

**Done when:**
- Dashboard is live on Vercel
- You can create a property, add room types, add rooms, edit and delete them
- Preelook Apartments is seeded with real data
- All mutations use server actions

---

### Milestone 2: Rate Management + Availability Engine

**You learn:** Complex TypeScript business logic, date arithmetic, inventory management, calendar UI, pure function design, unit testing with Vitest.

**You build:**
- Drizzle schema for: `rate_plans`, `inventory`
- Inventory initialization utility: when rooms are added/removed, generate/update `inventory` rows for a rolling 365-day window
- Availability engine (`lib/availability.ts`):
  - `checkAvailability(propertyId, roomTypeId, checkIn, checkOut)` → available count + resolved nightly rates
  - `getCalendarAvailability(propertyId, startDate, endDate)` → per-room-type per-date availability and rates
  - Pure functions. No side effects. Fully testable.
- Pricing engine (`lib/pricing.ts`):
  - `resolveRate(roomTypeId, date, ratePlans[])` → effective rate for a date
  - Resolution order: manual date override > highest-priority matching rate plan > base rate
- Vitest tests: overlapping rate plans, single-night stays, 30-night stays, fully booked, blocked rooms
- Dashboard rate plans UI: list per room type, create seasonal rate, set date overrides
- Dashboard availability calendar: month view, per-room-type availability counts and rates, color-coded by occupancy

**Done when:**
- Availability engine passes all test cases
- Rate resolution handles priority-based pricing correctly
- Dashboard calendar shows real availability data
- Seasonal rates reflect in the calendar immediately

---

### Milestone 3: Guest-Facing Booking Engine

**You learn:** Public Next.js pages, dynamic routing, multi-step forms, React state management, mobile-first design, conversion UI patterns, database transactions.

**You build:**
- Drizzle schema for: `guests`, `reservations`, `reservation_rooms`
- Booking flow at `/(booking)/[propertySlug]/`:
  - Step 1 — Search: date picker, guest count. Shows available room types with descriptions, nightly rate, total.
  - Step 2 — Select: pick room type(s) and quantity. Running total.
  - Step 3 — Details: guest info form (name, email, phone, special requests). Zod validation.
  - Step 4 — Confirm: order summary, terms. Payment placeholder (Stripe comes in Milestone 4, booking confirms directly for now).
  - Step 5 — Confirmation: confirmation code and booking summary.
- Reservation creation logic:
  - Upsert guest by property_id + email
  - Generate confirmation code (format: SHP-XXXXX)
  - Create reservation + reservation_rooms in a transaction
  - Decrement `inventory.booked_units` for each night (transactional, reject if insufficient)
- Dashboard reservations page: list with status badges, filter by date/status, click into detail
- Reservation detail: guest info, room assignment, dates, status transition buttons (confirm, check-in, check-out, cancel, no-show)
- Inventory rollback on cancellation

**Done when:**
- Guest visits `[vercel-url]/preelook-apartments`, picks dates, selects room, enters details, gets confirmation code
- Reservation appears in dashboard immediately
- Availability updates in real-time (booking reduces, cancellation restores)
- Double-booking is impossible (transactional inventory)
- Works cleanly on mobile

---

### Milestone 4: Stripe Payments

**You learn:** Stripe Payment Intents, delayed capture, webhook handling, idempotency, payment state machines, handling money safely.

**You build:**
- Drizzle schema for: `payments`
- Stripe integration (`lib/payments.ts`):
  - Create payment intent on booking (amount from property config: full or deposit percentage)
  - Two modes: full_at_booking (authorize + capture) and deposit_at_booking (authorize deposit, capture remainder later)
  - Delayed capture: `capture_method: 'manual'`, capture via dashboard or automated trigger
- Stripe Elements in booking Step 4: real card input via `@stripe/react-stripe-js`
- Webhook endpoint (`/api/v1/webhooks/stripe`):
  - Handle: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
  - Signature verification on all webhooks
- Dashboard payment actions on reservation detail:
  - View payment status
  - Capture held deposit
  - Issue full or partial refund
- Payment status displayed on reservation list

**Done when:**
- Guest completes real Stripe test-mode payment during booking
- Payment visible in both Stripe dashboard and PMS dashboard
- Deposit flow works: hold at booking, capture at check-in
- Refund on cancellation works
- Webhooks update status reliably
- No booking confirms without successful payment authorization

---

### Milestone 5: Guest Communication + Reviews

**You learn:** Transactional email with React Email + Resend, email templating, token-based auth, cron jobs on Vercel.

**You build:**
- Drizzle schema for: `review_tokens`, `reviews`, `email_logs`
- Email templates (React Email):
  - Booking confirmation (code, dates, property details, amount paid)
  - Pre-arrival (check-in time, directions, contact — 1 day before)
  - Post-stay (thank you + review link — on checkout)
  - Review request (2 days after checkout if no review)
  - Cancellation confirmation
- Email logic (`lib/email.ts`):
  - Send via Resend, log every attempt in `email_logs`
  - Confirmation email triggers on reservation creation
  - Cancellation email triggers on cancellation
- Automated emails via Vercel Cron:
  - Daily job: send pre-arrival for tomorrow's check-ins, post-stay for today's check-outs
- Review system:
  - Generate `review_token` on check-out (one per reservation, 30-day expiry)
  - Public review page: `/review/[token]` — star rating, optional title, body
  - Token validated and marked used on submission
  - Review created with status `pending`
- Dashboard review management: list, publish/hide, add property response
- Show published reviews in booking engine with average rating

**Done when:**
- Confirmation email auto-sends on booking
- Pre-arrival email sends for next-day check-ins
- Post-stay email contains working review link
- Guest submits review via token, property responds from dashboard
- Reviews display on booking engine with average rating
- All sends logged in `email_logs`

---

### Milestone 6: REST API + Documentation + Portfolio Polish

**You learn:** RESTful API design, API authentication, technical writing, architecture documentation.

**You build:**
- REST API under `/api/v1/`:
  - `GET /properties/[slug]` — public property info
  - `POST /properties/[slug]/availability` — check availability
  - `GET /properties/[slug]/rooms` — room types and rates
  - `POST /reservations` — create booking
  - `GET /reservations/[confirmationCode]` — lookup
  - `PATCH /reservations/[id]/cancel` — cancel
  - `GET /properties/[slug]/reviews` — published reviews
  - Consistent response shape: `{ data, error, meta }`
- API key auth via Bearer token (from `properties.api_key`)
- Rate limiting via Upstash Ratelimit
- `ARCHITECTURE.md`:
  - System overview diagram
  - Data model diagram
  - Availability engine explanation (inventory ledger approach)
  - Payment flow diagrams (full vs deposit + delayed capture)
  - Design decisions and trade-offs
- `README.md`:
  - One-paragraph description
  - Screenshots (dashboard + booking engine)
  - Tech stack
  - Local dev setup
  - API overview with example curl requests
  - Link to live demo
- GitHub polish: clean commits, topics, description, pinned repo

**Done when:**
- Every feature accessible via API
- Clean, consistent API responses
- ARCHITECTURE.md readable by a senior engineer cold
- README makes someone want to explore the repo
- Live demo with Preelook Apartments data
- Repo looks like production software

---

## Seed Data: Preelook Apartments

Every milestone uses real data:

- **Property:** Preelook Apartments, Rijeka, Croatia
- **Room types:** Actual types from the property
- **Rooms:** Real room numbers
- **Rates:** Realistic seasonal pricing (summer high, winter low, shoulder months)
- **Test reservations:** Mix of confirmed, checked-out, cancelled across date ranges and channels

Update the seed script as new tables are added per milestone.

---

## Build Rules

1. **Start every session by confirming** which milestone you're on and what's next within it.
2. **Don't skip ahead.** Each milestone builds on the last.
3. **Commit working states.** Don't go hours without pushing.
4. **Deploy after every milestone.** The Vercel URL always reflects the latest completed milestone.
5. **Write tests alongside code** for availability and pricing. Everything else: manual testing for MVP.
6. **When stuck, isolate.** Build logic in a standalone file, verify it, then integrate.
7. **This schema is the source of truth.** Change this document first, then change the code.
