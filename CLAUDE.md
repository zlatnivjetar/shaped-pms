# Shaped PMS

Property Management System for hospitality. Features 1–18 complete.

## Current Phase: UI Overhaul

Full design-system standardization across dashboard, booking engine, auth, and email templates.
7 sessions, 16 milestones. Read these before starting any UI work:

| Document | Purpose |
|---|---|
| `/UI-OVERHAUL-PLAN.md` | Master plan — milestones, tasks, session scope, acceptance criteria |
| `/docs/color-palette.md` | All color tokens, derived from Shaped Brand Identity |
| `/docs/brand-identity.md` | Shaped brand identity (colors, type, spacing, shadows, motion) |

### Session Tracker

| Session | Milestones | Status |
|---|---|---|
| 1 | M1 (Tokens) + M2 (Primitives) + M3 (Typography) | Not started |
| 2 | M4 (Shell/Nav) + M6 (Tables/Filters) + M7 (Forms) | Not started |
| 3 | M5 (Dashboard Pages) | Not started |
| 4 | M8 (Booking) + M9 (Auth/Portal/Review) | Not started |
| 5 | M10 (States) + M14 (Motion) + M15 (Email) | Not started |
| 6 | M11 (Accessibility) + M12 (Responsive) | Not started |
| 7 | M13 (Dark Mode) + M16 (Final Audit) | Not started |

### UI Overhaul Rules

1. **Start every session** by reading the relevant milestones in `UI-OVERHAUL-PLAN.md`.
2. **Don't skip sessions.** Each builds on the last.
3. **All colors come from tokens.** Never use hardcoded hex or raw Tailwind palette classes for semantic meaning.
4. **Use shared primitives.** PageHeader, StatusBadge, DataTable, etc. — don't rebuild patterns that exist.
5. **UI only.** Do not modify database schema, API routes, or business logic during the overhaul.
6. **Commit working states.** Don't go hours without pushing.
7. **Run `/completed`** after finishing each session's milestones.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript strict |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Font | Manrope (variable, Google Fonts) + Geist Mono |
| Database | Neon + Drizzle ORM |
| Auth | Better Auth |
| Payments | Stripe |
| Email | Resend + React Email |
| Deployment | Vercel |

## Feature Development References

These are paused during the UI overhaul but preserved for later:

- `/docs/schema.md` — Database schema (source of truth)
- `/docs/gap-analysis.md` — Feature inventory for M16–M20
- `/docs/m*-summary.md` — Per-milestone build summaries
- `/docs/roomcloud-api-spec.md` — RoomCloud API (M19)