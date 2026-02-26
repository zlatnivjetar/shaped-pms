# Milestone 6 — REST API + Documentation + Portfolio Polish

**Status:** Complete

---

## Shared API Utilities (`src/lib/api-utils.ts`)

- `apiResponse<T>(data, status?)` — wraps any value in `{ data, meta: { timestamp } }`, defaults to HTTP 200
- `apiError(message, status)` — returns `{ error, meta: { timestamp } }` with the given status code
- `getAuthenticatedProperty(req, slug)` — extracts the `Authorization: Bearer <token>` header, validates it against `properties.api_key` + slug match; returns the property or an error response
- `// TODO` comment marking where Upstash Ratelimit should be wired before production

---

## Validator Addition (`src/lib/validators.ts`)

- `apiReservationSchema` — Zod schema for OTA booking requests: `propertySlug`, `roomTypeId`, `checkIn`/`checkOut` (YYYY-MM-DD), `adults` (1–10), `children` (0–10, default 0), `channel` (enum, default `"direct"`), `guest` object (firstName, lastName, email, optional phone), optional `specialRequests`

---

## REST API Endpoints (`src/app/api/v1/`)

All routes use `runtime = "nodejs"` and `dynamic = "force-dynamic"`.

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/properties/[slug]` | Property info + average rating and review count from published reviews |
| POST | `/properties/[slug]/availability` | Calls `getAvailableRoomTypes()` — returns room types with available count, nightly rate, total |
| GET | `/properties/[slug]/rooms` | Active room types ordered by `sort_order` |
| GET | `/properties/[slug]/reviews` | Published reviews with guest name, property responses, average rating, total count |

### Authenticated (Bearer token = `properties.api_key`)

| Method | Path | Description |
|---|---|---|
| POST | `/reservations` | Create OTA reservation — no Stripe, same inventory locking pattern as booking engine |
| GET | `/reservations/[confirmationCode]` | Fetch full reservation with guest and room details |
| PATCH | `/reservations/[id]/cancel` | Cancel + inventory rollback + fire-and-forget cancellation email |

### `POST /reservations` flow

1. Parse + validate body with `apiReservationSchema`
2. Auth check via `getAuthenticatedProperty()`
3. Verify `roomTypeId` belongs to the authenticated property
4. Call `checkAvailability()` — validates dates and computes `totalCents`
5. Generate unique confirmation code (same `SHP-XXXXX` format, collision-safe retry loop)
6. Lock inventory: conditional UPDATE `WHERE available >= 1`, rollback partials on failure
7. Upsert guest (`property_id + email` unique)
8. Insert `reservations` row (status: `confirmed`, no payment row)
9. Insert `reservation_rooms` row
10. Update guest `total_stays` + `total_spent_cents`
11. Fire-and-forget `sendBookingConfirmation` (`amountPaidCents: 0` — OTA payment external)
12. Return `{ confirmationCode, reservationId, totalCents, currency, nights }` with HTTP 201
13. `// TODO: push confirmed reservation to channel manager webhook`

---

## Documentation

### `README.md`

- One-paragraph project description
- Live demo link
- Screenshots section (placeholder paths — user fills in)
- Tech stack table
- Local dev setup (clone → env → migrate → seed → dev)
- Environment variables table with all 9 vars and descriptions
- API overview with 7 `curl` examples (public + authenticated)
- Running tests section
- Other scripts reference

### `ARCHITECTURE.md`

- **System overview** — ASCII diagram: Browser / Channel Manager → Next.js → Neon / Stripe / Resend / Vercel Cron
- **Data model** — ASCII entity-relationship diagram of all 13 tables and their relationships, with key design choices (UUID PKs, multi-tenancy via `property_id`, nullable `room_id` on `reservation_rooms`)
- **Availability engine** — why inventory ledger beats date-range counting; double-booking prevention via conditional UPDATE; why no DB transaction is needed
- **Payment flows** — ASCII flow diagrams for full payment and deposit + delayed capture; refund path; note on API reservations bypassing Stripe
- **Email system** — trigger map (6 events → 5 email types), fire-and-forget rationale, `email_logs` logging
- **REST API** — channel manager integration pattern, inbound vs outbound architecture, auth via `api_key`, response shape, endpoint table
- **Design decisions** — Neon HTTP driver (no transactions → conditional UPDATE), server actions for UI mutations vs API routes for external integrations, slugs for public URLs, room assignment at check-in not booking

---

## Tests (`tests/api.test.ts`)

26 new tests — total suite goes from 23 to 49.

**`apiResponse` (6 tests)**
- Defaults to HTTP 200
- Accepts custom status code
- Shape is `{ data, meta.timestamp }`
- Timestamp is a valid ISO string within call bounds
- No `error` key on success responses
- Array data serialises correctly

**`apiError` (3 tests)**
- Uses the provided status code (404, 401, 400, 409)
- Shape is `{ error, meta.timestamp }`
- No `data` key on error responses

**`apiReservationSchema` (17 tests)**
- Valid full input accepted
- `channel` defaults to `"direct"`
- `children` defaults to `0`
- Optional fields (`phone`, `specialRequests`) can be omitted
- Invalid `roomTypeId` (not UUID) rejected
- Malformed `checkIn` / `checkOut` rejected
- `adults` bounds: 0 and 11 rejected
- `children` < 0 rejected
- Unknown channel value rejected
- All 6 valid channel values accepted
- Missing `guest` object rejected
- Invalid guest email rejected
- Empty `firstName` rejected
- String `adults` coerced to number
- Missing `propertySlug` rejected

---

## Known Gap

**Better Auth not implemented.** The dashboard is currently publicly accessible — no session check or login redirect exists. A `// TODO` comment is placed at the top of `src/app/(dashboard)/layout.tsx` with a link to the Better Auth installation docs.

---

## Remaining Manual Steps

| Step | Notes |
|---|---|
| Add README screenshots | Replace `docs/screenshots/dashboard.png` and `booking-engine.png` with real captures |
| GitHub polish | Add repo description, topics, pin the repo |
