# Shaped PMS

A full-featured Property Management System built with Next.js 15, designed for independent accommodation operators. It handles room management, real-time availability, direct bookings with Stripe payments, automated guest communication via email, and a review system — all in a single deployable application. A REST API allows channel managers (Booking.com, Airbnb, Expedia) to push OTA reservations directly into the system.

**Live demo:** https://shaped-pms.vercel.app (seeded with Preelook Apartments, Rijeka, Croatia)

---

## Screenshots

| Dashboard | Booking Engine |
|-----------|---------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Booking Engine](docs/screenshots/booking-engine.png) |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | Next.js 15 (App Router) |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Payments | Stripe |
| Email | Resend + React Email |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Deployment | Vercel |
| Auth | Better Auth |
| Validation | Zod |
| Testing | Vitest |

---

## Local Dev Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/shaped-pms.git
cd shaped-pms

# 2. Install dependencies
npm install

# 3. Copy the example env file and fill in your values
cp .env.example .env.local

# 4. Run database migrations
npm run db:migrate

# 5. Seed Preelook Apartments (property, rooms, rates, inventory)
npm run db:seed

# 6. (Optional) Seed test reservations and reviews
npm run db:seed-reservations
npm run db:seed-reviews

# 7. Start the dev server
npm run dev
```

Open http://localhost:3000.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon connection string (pooled) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (sk_test_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (pk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | Yes | Verified sender address (e.g. noreply@yourdomain.com) |
| `CRON_SECRET` | Yes | Secret token for Vercel Cron job authentication |
| `BETTER_AUTH_SECRET` | Yes | Random secret for Better Auth session signing |
| `BETTER_AUTH_URL` | Yes | Public URL of the app (e.g. https://shaped-pms.vercel.app) |

---

## REST API

Base URL: `https://shaped-pms.vercel.app/api/v1`

Authenticated endpoints require a Bearer token matching the property's `api_key` field.

### Public Endpoints

#### Get property info
```bash
curl https://shaped-pms.vercel.app/api/v1/properties/preelook-apartments
```

#### Check availability
```bash
curl -X POST https://shaped-pms.vercel.app/api/v1/properties/preelook-apartments/availability \
  -H "Content-Type: application/json" \
  -d '{"checkIn":"2026-07-01","checkOut":"2026-07-05","adults":2,"children":0}'
```

#### List room types
```bash
curl https://shaped-pms.vercel.app/api/v1/properties/preelook-apartments/rooms
```

#### Get published reviews
```bash
curl https://shaped-pms.vercel.app/api/v1/properties/preelook-apartments/reviews
```

### Authenticated Endpoints

#### Create a reservation (OTA booking)
```bash
curl -X POST https://shaped-pms.vercel.app/api/v1/reservations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "propertySlug": "preelook-apartments",
    "roomTypeId": "ROOM_TYPE_UUID",
    "checkIn": "2026-07-10",
    "checkOut": "2026-07-14",
    "adults": 2,
    "children": 0,
    "channel": "booking_com",
    "guest": {
      "firstName": "Ana",
      "lastName": "Kovač",
      "email": "ana@example.com",
      "phone": "+385911234567"
    },
    "specialRequests": "Late check-in requested"
  }'
```

#### Look up a reservation
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://shaped-pms.vercel.app/api/v1/reservations/SHP-A7K2M
```

#### Cancel a reservation
```bash
curl -X PATCH https://shaped-pms.vercel.app/api/v1/reservations/RESERVATION_UUID/cancel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Guest cancelled via OTA"}'
```

All responses use the shape `{ data: {...}, meta: { timestamp: "..." } }` or `{ error: "...", meta: { timestamp: "..." } }`.

---

## Running Tests

```bash
npm test
```

23 tests covering the availability engine and pricing logic (Vitest).

---

## Other Scripts

```bash
npm run db:studio        # Open Drizzle Studio (DB browser)
npm run db:generate      # Generate a migration from schema changes
npm run db:migrate       # Apply pending migrations
npm run db:init-inventory  # Backfill 365-day inventory for all room types
```
