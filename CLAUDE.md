# Shaped PMS                                                                                                                                                                                                                                                                                                                                      
  Property Management System replacing a WordPress hospitality stack (MotoPress Hotel Booking + Shaped Core plugin).                                                         
  ## Current Status                                                                                                                                                       
                                                                                                                                                                          
  Milestones 1–15 complete. See `/docs/m*-summary.md` for what was built per milestone.
  Milestones 16–20 defined in `/docs/gap-analysis.md` — produced by analyzing the
  Shaped Core plugin against this PMS to identify every missing feature.

  ## Reference Documents

  | Document | Purpose |
  |---|---|
  | `/docs/schema.md` | Database schema — source of truth for all tables |
  | `/docs/m1-summary.md` – `m15-summary.md` | What was built and verified per milestone |
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

  See `/docs/schema.md` for the full schema — all tables, columns, and constraints.
  **Change that file first, then change the code.**

  ## Project Structure

  shaped-pms/
  ├── src/
  │   ├── app/
  │   │   ├── (dashboard)/                  # Authenticated property dashboard
  │   │   │   ├── dashboard/                # Live KPIs + recent bookings
  │   │   │   ├── room-types/               # Room type CRUD + booking rules
  │   │   │   ├── rooms/                    # Room CRUD + status toggle
  │   │   │   ├── rates/                    # Rate plans + availability calendar + discounts
  │   │   │   ├── reservations/             # List + [id] detail with status transitions
  │   │   │   ├── guests/                   # Guest list with lifetime stats
  │   │   │   ├── reviews/                  # Review moderation + property responses
  │   │   │   ├── calendar/                 # Availability calendar (standalone)
  │   │   │   ├── settings/                 # Property settings + amenities
  │   │   │   └── layout.tsx
  │   │   ├── (booking)/                    # Public guest-facing booking engine
  │   │   │   ├── [propertySlug]/           # 5-step booking flow
  │   │   │   ├── manage/[confirmationCode] # Guest self-service portal
  │   │   │   └── layout.tsx
  │   │   ├── (review)/                     # Token-based review submission
  │   │   │   └── review/[token]/
  │   │   ├── api/v1/                       # REST API
  │   │   │   ├── properties/[slug]/        # GET property, availability, rooms, reviews
  │   │   │   ├── reservations/             # POST create OTA reservation
  │   │   │   ├── reservations/[id]/        # GET by confirmation code
  │   │   │   ├── reservations/[id]/cancel/ # PATCH cancel + rollback
  │   │   │   ├── cron/daily/               # Pre-arrival + review request emails
  │   │   │   ├── cron/abandoned/           # Abandoned booking cleanup
  │   │   │   └── webhooks/stripe/          # Stripe webhook handler
  │   │   └── layout.tsx
  │   ├── db/
  │   │   ├── schema.ts                     # Drizzle schema (source of truth)
  │   │   ├── migrations/                   # Generated SQL migrations (0000–0009)
  │   │   ├── index.ts                      # Neon HTTP connection + Drizzle client
  │   │   ├── seed.ts                       # Preelook Apartments base seed
  │   │   ├── seed-reservations.ts          # Test guests + reservations
  │   │   ├── seed-reviews.ts               # Test published reviews
  │   │   ├── seed-amenities.ts             # Amenity assignments for Preelook
  │   │   └── init-inventory.ts             # Backfill 365-day inventory
  │   ├── lib/
  │   │   ├── availability.ts               # Availability engine + booking rules
  │   │   ├── pricing.ts                    # Rate + discount resolution
  │   │   ├── payments.ts                   # Stripe: PI, SetupIntent, capture, refund
  │   │   ├── email.ts                      # Resend integration + sendAndLog
  │   │   ├── reviews.ts                    # Review token generation + validation
  │   │   ├── cancellation.ts               # Manage token + refund policy calculation
  │   │   ├── dashboard.ts                  # Live KPI queries
  │   │   ├── inventory.ts                  # upsertInventory() helper
  │   │   ├── api-utils.ts                  # apiResponse(), apiError(), getAuthenticatedProperty()
  │   │   ├── confirmation-code.ts          # SHP-XXXXX generator
  │   │   └── validators.ts                 # Zod schemas
  │   ├── components/
  │   │   ├── ui/                           # shadcn/ui primitives
  │   │   ├── dashboard/                    # app-sidebar.tsx
  │   │   ├── booking/                      # booking-flow + step-* components
  │   │   └── emails/                       # React Email templates
  │   └── hooks/
  │       └── use-mobile.ts
  ├── docs/
  │   ├── schema.md                         # Database schema (source of truth)
  │   ├── gap-analysis.md                   # M7–M20 feature inventory + plans
  │   ├── m*-summary.md                     # Per-milestone build summaries
  │   └── roomcloud-api-spec.md             # RoomCloud XML OTA API v3.8 (M19)
  ├── tests/
  │   ├── availability.test.ts
  │   └── pricing.test.ts
  ├── drizzle.config.ts
  ├── vercel.json
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
  9. **After writing a milestone summary**, review the Project Structure section in this file and update it if new routes, lib files, or components were added.
  10. **Commit and push to GitHub after writing summary**

  ## Seed Data: Preelook Apartments

  Every milestone uses real data:

  - **Property:** Preelook Apartments, Rijeka, Croatia
  - **Room types:** Actual types from the property
  - **Rooms:** Real room numbers
  - **Rates:** Realistic seasonal pricing (summer high, winter low, shoulder months)
  - **Test reservations:** Mix of confirmed, checked-out, cancelled across date ranges and channels

  Update the seed script as new tables are added per milestone.