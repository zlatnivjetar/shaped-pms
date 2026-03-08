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
  9. **Commit and push to GitHub after writing summary**

  ## Seed Data: Preelook Apartments

  Every milestone uses real data:

  - **Property:** Preelook Apartments, Rijeka, Croatia
  - **Room types:** Actual types from the property
  - **Rooms:** Real room numbers
  - **Rates:** Realistic seasonal pricing (summer high, winter low, shoulder months)
  - **Test reservations:** Mix of confirmed, checked-out, cancelled across date ranges and channels

  Update the seed script as new tables are added per milestone.