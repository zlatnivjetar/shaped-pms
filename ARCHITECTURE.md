# Architecture — Shaped PMS

**Version:** 1.0
**Last updated:** 2026-02-26

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Clients                                    │
│                                                                     │
│   Browser (Dashboard)   Browser (Booking Engine)   Channel Manager  │
│         │                        │                        │         │
└─────────┼────────────────────────┼────────────────────────┼─────────┘
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js 15 — Vercel Edge                        │
│                                                                     │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │  (dashboard)/  │  │  (booking)/     │  │  /api/v1/            │ │
│  │  Server        │  │  [propertySlug] │  │  REST API            │ │
│  │  Components +  │  │  Public booking │  │  (Node.js runtime)   │ │
│  │  Server Actions│  │  engine         │  │                      │ │
│  └───────┬────────┘  └───────┬─────────┘  └──────────┬───────────┘ │
└──────────┼───────────────────┼───────────────────────┼─────────────┘
           │                   │                        │
           ▼                   ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     External Services                             │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │  Neon         │  │  Stripe       │  │  Resend            │   │
│  │  Serverless   │  │  Payments     │  │  Transactional     │   │
│  │  Postgres     │  │  + Webhooks   │  │  Email             │   │
│  └───────────────┘  └───────────────┘  └────────────────────┘   │
│                                                                   │
│  ┌───────────────┐                                               │
│  │  Vercel Cron  │  (daily 8am UTC — pre-arrival + post-stay)   │
│  └───────────────┘                                               │
└──────────────────────────────────────────────────────────────────┘
```

### Key boundaries

- **Dashboard** (`/(dashboard)/`): authenticated Next.js server components + server actions. All mutations go through server actions, not API routes. Revalidation via `revalidatePath`.
- **Booking engine** (`/(booking)/[propertySlug]`): public, multi-step client-side flow backed by server actions.
- **REST API** (`/api/v1/`): Node.js runtime, JSON in/out, designed for channel manager integration.
- **Stripe webhooks** (`/api/v1/webhooks/stripe`): signature-verified, updates payment status in DB.

---

## 2. Data Model

```
properties ──────────────────────────────────────────────┐
    │                                                     │
    ├── room_types ──────────────────────────────┐        │
    │       │                                   │        │
    │       ├── rooms                           │        │
    │       ├── rate_plans                      │        │
    │       └── inventory                       │        │
    │           (property_id, room_type_id, date)        │
    │                                           │        │
    ├── guests                                  │        │
    │       │                                   │        │
    │       └── reservations ───────────────────┘        │
    │               │                                    │
    │               ├── reservation_rooms                │
    │               │       ├── room_type_id (fk)        │
    │               │       └── room_id (fk, nullable)   │
    │               │                                    │
    │               ├── payments                         │
    │               │                                    │
    │               ├── review_tokens                    │
    │               │       └── reviews ─────────────────┘
    │               │
    │               └── email_logs
    │
    └── users  (staff accounts)
```

### Key design choices

- **UUID primary keys** everywhere. Postgres `gen_random_uuid()` default.
- **Multi-tenancy via `property_id`** on every table. All queries always filter by property.
- **`reservation_rooms` join table** supports multi-room bookings (future) while `room_id` is nullable — room assignment happens at check-in, not at booking.
- **`inventory` is the source of truth** for availability, not a date-range query against reservations.
- **`confirmation_code`** (SHP-XXXXX) is human-readable; `id` is the UUID used internally.

---

## 3. Availability Engine

**File:** `src/lib/availability.ts`

### Why an inventory ledger?

Instead of computing availability by counting active reservations in a date range (fragile, slow, and prone to race conditions), we maintain an explicit counter per room type per night:

```
inventory
├── total_units    (how many rooms of this type exist)
├── booked_units   (incremented on booking, decremented on cancellation)
└── blocked_units  (manual blocks for maintenance etc.)

available = total_units - booked_units - blocked_units
```

**Benefits:**
- O(1) availability check per night — no subquery counting reservations
- Double-booking prevention is a single conditional UPDATE
- Blocking rooms for maintenance doesn't touch reservations

### Double-booking prevention

The classic problem: two requests read `available = 1` simultaneously and both proceed to book.

**Solution:** Atomic conditional UPDATE with a guard clause:

```sql
UPDATE inventory
SET booked_units = booked_units + 1
WHERE property_id = $1
  AND room_type_id = $2
  AND date = ANY($3)
  AND (total_units - booked_units - blocked_units) >= 1
RETURNING date
```

If the returned row count is less than the number of nights, some nights were already fully booked. We roll back any successful updates and reject the booking. No database transactions needed — the conditional UPDATE is atomic at the row level.

This works because Neon's HTTP driver does not support `db.transaction()`. The conditional UPDATE approach achieves equivalent safety for this use case.

### Rate resolution

**File:** `src/lib/pricing.ts` — `resolveRate(baseRateCents, date, ratePlans[])`

Resolution order (highest priority wins):
1. Manual date override (`inventory.rate_override_cents`) — checked before calling `resolveRate`
2. Highest-priority active `rate_plans` row whose date range covers the night
3. Room type `base_rate_cents`

Rate plans have an explicit `priority` field (integer, higher = wins). This allows overlapping promotional rates to coexist with seasonal plans, with deterministic winner selection.

---

## 4. Payment Flows

### Full payment at booking

```
Guest fills card details (Stripe Elements)
        │
        ▼
createPaymentIntent (capture_method: "automatic")
        │
        ▼
Stripe authorizes + captures immediately
        │
        ▼
Webhook: payment_intent.succeeded
        │
        ▼
DB: payments.status = "captured"
    reservations.status = "confirmed"
```

### Deposit at booking + capture at check-in

```
Guest fills card details (Stripe Elements)
        │
        ▼
createPaymentIntent (capture_method: "manual", amount = total × deposit%)
        │
        ▼
Stripe authorizes (hold on card) — no charge yet
        │
        ▼
Webhook: payment_intent.requires_capture
        │
        ▼
DB: payments.status = "requires_capture"
    reservations.status = "confirmed"
        │
        │  (at check-in, staff clicks Capture in dashboard)
        ▼
capturePaymentIntent(stripe_payment_intent_id)
        │
        ▼
DB: payments.status = "captured"
    payments.captured_at = now()
```

### Refund

```
Staff clicks Refund in dashboard
        │
        ▼
refundPayment(stripe_payment_intent_id, optional_amount)
        │
        ▼
Stripe issues refund to original payment method
        │
        ▼
DB: payments.status = "refunded"
    payments.refunded_at = now()
```

**Note:** API-created reservations (OTA bookings via channel manager) bypass Stripe entirely. OTA payments are collected externally. The `payments` table will have no row for these reservations.

---

## 5. Email System

**File:** `src/lib/email.ts`
**Templates:** `src/components/emails/` (React Email)
**Delivery:** Resend

### Trigger map

| Event | Email sent | Trigger location |
|---|---|---|
| Booking confirmed (direct) | Booking confirmation | `src/app/(booking)/[propertySlug]/actions.ts` |
| Booking confirmed (API) | Booking confirmation | `src/app/api/v1/reservations/route.ts` |
| Reservation cancelled | Cancellation confirmation | `src/app/(dashboard)/reservations/actions.ts` + cancel API |
| Guest checks out | Post-stay + review link | `src/app/(dashboard)/reservations/actions.ts` |
| 1 day before check-in | Pre-arrival instructions | Vercel Cron — `GET /api/v1/cron/daily` |
| 2 days after checkout, no review | Review request | Vercel Cron — `GET /api/v1/cron/daily` |

### Fire-and-forget pattern

Email sends are never awaited on the request path:

```typescript
void sendBookingConfirmation({ ... });
```

Rationale: email delivery failure should never block a booking from being created. Every send attempt is logged to `email_logs` regardless of success or failure, so failures are visible and retryable.

### Logging

Every `sendAndLog` call writes to `email_logs`:
- `type`: which template was sent
- `status`: `sent` | `failed`
- `recipient_email`, `subject`, `sent_at`

---

## 6. REST API

**Base path:** `/api/v1/`

### Purpose

The REST API is the **inbound** integration surface for channel managers (SiteMinder, Cloudbeds, etc.). A channel manager calls this API to push OTA reservations into the PMS. The PMS stores them with inventory locked and sends a confirmation email to the guest.

**Outbound push** (PMS → channel manager) is not implemented. Each reservation creation handler has a `// TODO: push confirmed reservation to channel manager webhook` comment.

### Authentication

Authenticated endpoints use a property-scoped Bearer token:

```
Authorization: Bearer sk_a1b2c3...
```

The token is validated against `properties.api_key`. Each property has a unique API key generated at seed time (`randomBytes(24).toString("hex")`). Staff can view and rotate their API key from the Settings page.

**Rate limiting** is not yet implemented. A `// TODO` comment in `src/lib/api-utils.ts` marks where Upstash Ratelimit should be added before production use.

### Response shape

All endpoints return:

```json
// Success
{ "data": { ... }, "meta": { "timestamp": "2026-07-10T08:00:00.000Z" } }

// Error
{ "error": "Human-readable message.", "meta": { "timestamp": "2026-07-10T08:00:00.000Z" } }
```

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/properties/[slug]` | No | Property info + rating |
| POST | `/properties/[slug]/availability` | No | Check room availability |
| GET | `/properties/[slug]/rooms` | No | List active room types |
| GET | `/properties/[slug]/reviews` | No | Published reviews |
| POST | `/reservations` | Yes | Create OTA reservation |
| GET | `/reservations/[confirmationCode]` | Yes | Fetch reservation |
| PATCH | `/reservations/[id]/cancel` | Yes | Cancel reservation |

---

## 7. Design Decisions

### Neon HTTP driver — no transactions

Neon's serverless driver uses HTTP, not WebSockets. The HTTP driver does not support multi-statement transactions (`db.transaction()`).

**How we work around it:**

1. **Conditional UPDATE for inventory:** Atomicity is achieved at the row level. A single `UPDATE ... WHERE available >= 1` is atomic and safe without a wrapping transaction.
2. **Insert ordering:** Guest upsert → reservation → reservation_rooms → payments. Each step depends on the previous, but each is idempotent or guarded. Failures after inventory lock trigger a manual rollback UPDATE.
3. **Acceptable risk:** For MVP scale (one property, low concurrency), this is a justified trade-off. At scale, move to a connection-pooled Postgres client or use a Neon compute endpoint with WebSocket support.

### Server actions for UI mutations

All dashboard mutations (create, update, delete, status transitions) use Next.js server actions rather than API routes. This means:
- No manual `fetch` or `useEffect` for form submissions
- Progressive enhancement (forms work without JS)
- Type-safe calls from client components
- `revalidatePath` keeps server component data fresh without client-side state

The REST API is a separate surface for external integrations only.

### Slugs for public URLs

Properties and room types both have human-readable slugs (e.g. `preelook-apartments`, `studio`). Slugs are used in public-facing booking engine URLs and API paths. Internal DB references always use UUIDs. This separation means slugs can be changed without affecting data integrity.

### Room assignment at check-in, not booking

`reservation_rooms.room_id` is nullable. When a guest books a "Studio Apartment", they're booking the room type — not a specific room. The front desk assigns an actual room (101, 102, etc.) at check-in. This models how real hotels work and avoids the complexity of room-level locking at booking time.
