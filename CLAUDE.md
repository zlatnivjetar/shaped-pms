# Shaped PMS

Property Management System for hospitality. Features 1–18 complete.

## Design System

All colors come from CSS custom properties defined in `globals.css` and exported as JS constants in `src/lib/design-tokens.ts`. Never use hardcoded hex or raw Tailwind palette classes for semantic meaning.

### Design References

| Document | Purpose |
|---|---|
| `/docs/color-palette.md` | All color tokens, derived from Shaped Brand Identity |
| `/docs/brand-identity.md` | Shaped brand identity (colors, type, spacing, shadows, motion) |
| `/UI-OVERHAUL-PLAN.md` | Full overhaul plan (16 milestones, all complete) |

### Shared Components

Use these instead of rebuilding patterns:

| Component | Location | Purpose |
|---|---|---|
| `PageHeader` | `ui/page-header.tsx` | Page title + breadcrumbs + actions |
| `SectionHeader` | `ui/section-header.tsx` | Section title + optional action |
| `StatusBadge` | `ui/status-badge.tsx` | Status indicator with centralized style maps |
| `KpiCard` | `dashboard/kpi-card.tsx` | Metric card for dashboard |
| `DataTable` | `ui/data-table.tsx` | Typed table with columns, empty state, footer |
| `FilterBar` | `ui/filter-bar.tsx` | Filter container with fields and actions |
| `EmptyState` | `ui/empty-state.tsx` | Empty data view with icon, title, description |
| `ErrorBoundary` | `ui/error-boundary.tsx` | React error boundary + error state card |
| `InlineError` | `ui/inline-error.tsx` | Inline error message |
| `SubmitButton` | `ui/submit-button.tsx` | Form submit with loading spinner |
| `StarRating` | `ui/star-rating.tsx` | Interactive or display star rating |
| `DetailRow` | `ui/detail-row.tsx` | Label-value pair display |
| `StepIndicator` | `booking/step-indicator.tsx` | Booking flow step progress |

Status style maps live in `src/lib/status-styles.ts`. Toast helpers in `src/components/ui/toast.ts`.
Loading skeletons in `src/components/ui/loading-skeletons.tsx`.
Booking surface styles in `src/components/booking/styles.ts`.
Email layout primitives in `src/components/emails/shared.tsx`.

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