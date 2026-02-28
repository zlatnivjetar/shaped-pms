# Shaped PMS                                                                                                                                                                                                                                                                                                                                      
  Property Management System replacing a WordPress hospitality stack (MotoPress Hotel Booking + Shaped Core plugin).                                                         
  ## Current Status                                                                                                                                                       
                                                                                                                                                                          
  Milestones 1–6 complete. See `/docs/m[1-6]-summary.md` for what was built.
  Milestones 7–20 defined in `/docs/gap-analysis.md` — produced by analyzing the
  Shaped Core plugin against this PMS to identify every missing feature.

  ## Reference Documents

  | Document | Purpose |
  |---|---|
  | `/docs/m1-summary.md` – `m6-summary.md` | What was built and verified per milestone |
  | `/docs/gap-analysis.md` | Feature inventory + implementation plan for M7–M20 |
  | `/docs/roomcloud-api-spec.md` | RoomCloud XML OTA API v3.8 — full spec for channel manager integration (M19) |

  Read the relevant milestone summaries and gap analysis before starting work.
  The RoomCloud spec is only needed for Milestone 19.

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

  ## Database Schema (Source of Truth)

  All tables use UUIDs as primary keys. All timestamps are UTC.
  `property_id` is present on nearly every table — multi-tenancy from day one.

  ### Core Entities

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

  ## Project Structure

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

  ## Build Rules

  1. **Start every session by confirming** which milestone you're on and what's next within it.
  2. **Don't skip ahead.** Each milestone builds on the last.
  3. **Commit working states.** Don't go hours without pushing.
  4. **Deploy after every milestone.** The Vercel URL always reflects the latest completed milestone.
  5. **Write tests alongside code** for availability and pricing. Everything else: manual testing for MVP.
  6. **When stuck, isolate.** Build logic in a standalone file, verify it, then integrate.
  7. **This schema is the source of truth.** Change this document first, then change the code.
  8. **Read the gap analysis** before starting any milestone M7+. It contains architecture decisions, spec references, and acceptance criteria.

  ## Seed Data: Preelook Apartments

  Every milestone uses real data:

  - **Property:** Preelook Apartments, Rijeka, Croatia
  - **Room types:** Actual types from the property
  - **Rooms:** Real room numbers
  - **Rates:** Realistic seasonal pricing (summer high, winter low, shoulder months)
  - **Test reservations:** Mix of confirmed, checked-out, cancelled across date ranges and channels

  Update the seed script as new tables are added per milestone.