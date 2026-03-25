# Implementation Log

## Session 1 — Foundation (M1 + M2 + M3)
**Date:** 2026-03-25

### M1 — Design Tokens & Color System
- Rewrote `src/app/globals.css` with Shaped brand palette: Gold `#E2BD27` (primary), Ink `#11110F` (foreground), Light Base `#FBFBF9` (background), Bone `#EFEEEC` (muted/secondary), Dividers `#E5E3DC` (border)
- Added semantic tokens: `--success`, `--warning`, `--info`, `--booking-cta`, `--booking-accent`, `--booking-card`, `--rating-star`
- Changed `--radius` from `0.625rem` → `0.5rem` (brand: sm=4px, md=8px)
- Changed font from Geist Sans → Manrope variable; updated `src/app/layout.tsx`
- Created `src/lib/design-tokens.ts` — CSS var references for JS contexts (Stripe Elements) and hex values for email templates
- Removed all hardcoded hex colors from booking flow (`booking-flow.tsx`, `step-*.tsx`, `step-complete.tsx`, `step-confirm.tsx`, `step-details.tsx`, `step-search.tsx`, `step-select.tsx`), guest portal, and dashboard pages
- Replaced all `stone-*` Tailwind classes with semantic tokens across every component

### M2 — Shared Primitives
- Created `src/lib/status-styles.ts` — centralized `StatusStyle` maps for reservation, payment, review, rate, and room statuses; `CHANNEL_LABELS` map
- Extended `src/components/ui/badge.tsx` with `success`, `warning`, and `info` variants using `bg-*/10 text-* border-*/20` pattern
- Created `src/components/ui/status-badge.tsx` — thin wrapper: takes `status` + `styleMap`, renders `Badge` with optional dot indicator
- Created `src/components/ui/page-header.tsx` — `PageHeader` with `title`, `description`, `breadcrumbs`, `actions`, `titleClassName` props
- Created `src/components/ui/section-header.tsx` — `SectionHeader` with `title`, `description`, `action` props
- Created `src/components/ui/detail-row.tsx` — label/value pair for detail pages
- Created `src/components/dashboard/kpi-card.tsx` — KPI card with icon, value, subtitle, and trend indicator
- Replaced all inline `STATUS_VARIANTS`/`STATUS_LABELS` maps in dashboard, reservations, reviews, and settings pages with `StatusBadge` + centralized style maps

### M3 — Typography & Spacing
- Standardized all page `h1` elements to `text-2xl font-semibold tracking-tight` (was `font-bold`) across 8 dashboard pages
- Applied `space-y-8` top-level section gap to all dashboard pages (was `space-y-6` on most)
- Verified zero `stone-*` classes remain in any `.tsx` file
- Verified zero `CardHeader` padding overrides — DataTable and FilterBar handle internal spacing consistently
- All dashboard pages now use `PageHeader`, `SectionHeader`, `DataTable`, and `FilterBar` primitives from M2/infrastructure work
