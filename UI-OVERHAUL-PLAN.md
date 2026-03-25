# Shaped PMS — UI Overhaul Plan

> Complete design-system standardization and visual overhaul for the Shaped PMS dashboard,
> booking engine, authentication pages, guest portal, and email templates.

**Goal:** Make every surface in the product look and feel like it belongs to one cohesive
design system. Eliminate visual drift between pages built at different times. Establish
primitives and tokens that make future development faster and more consistent.

**Palette:** Defined in `docs/color-palette.md`, derived from the Shaped Brand Identity.
Gold (#E2BD27) primary, warm neutrals (Ink → Bone), unified booking/dashboard palette,
light sidebar, Manrope font. Dark mode deferred to Session 7 (M13).

---

## Table of Contents

1. [Current State Audit](#current-state-audit)
2. [Milestone 1 — Design Tokens & Color System](#milestone-1--design-tokens--color-system)
3. [Milestone 2 — Shared Primitives](#milestone-2--shared-primitives)
4. [Milestone 3 — Typography & Spacing System](#milestone-3--typography--spacing-system)
5. [Milestone 4 — Layout Shell & Navigation](#milestone-4--layout-shell--navigation)
6. [Milestone 5 — Dashboard Pages Overhaul](#milestone-5--dashboard-pages-overhaul)
7. [Milestone 6 — Data Tables & Filter System](#milestone-6--data-tables--filter-system)
8. [Milestone 7 — Forms & Input Patterns](#milestone-7--forms--input-patterns)
9. [Milestone 8 — Booking Engine Overhaul](#milestone-8--booking-engine-overhaul)
10. [Milestone 9 — Auth, Guest Portal & Review Pages](#milestone-9--auth-guest-portal--review-pages)
11. [Milestone 10 — State Treatments](#milestone-10--state-treatments)
12. [Milestone 11 — Accessibility Baseline](#milestone-11--accessibility-baseline)
13. [Milestone 12 — Responsive & Mobile](#milestone-12--responsive--mobile)
14. [Milestone 13 — Dark Mode Systemization](#milestone-13--dark-mode-systemization)
15. [Milestone 14 — Motion & Animation](#milestone-14--motion--animation)
16. [Milestone 15 — Email Template Alignment](#milestone-15--email-template-alignment)
17. [Milestone 16 — Final Audit & Polish](#milestone-16--final-audit--polish)

---

## Current State Audit

### What Exists

| Area | Current State |
|---|---|
| **CSS Variables** | oklch-based tokens in `globals.css` for background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring, chart-1–5, sidebar-*. Dark mode counterparts defined. |
| **Fonts** | Geist Sans + Geist Mono (via Google Fonts CSS vars). Booking flow adds Playfair Display. |
| **shadcn/ui** | 19 components: button, card, badge, table, input, label, textarea, select, dialog, alert-dialog, dropdown-menu, sheet, tooltip, popover, calendar, separator, skeleton, sidebar, sonner. |
| **Dashboard** | Sidebar layout with role-based nav. Pages: dashboard KPIs, reservations list + detail, guests, rates, reviews, calendar, settings (property/rooms/room-types/amenities). |
| **Booking Engine** | 5-step flow (search → select → details → confirm → complete). Uses hardcoded colors (#1E3A8A navy, #CA8A04 gold, stone palette). Separate Playfair Display font. |
| **Auth Pages** | Login + register with centered card layout. Uses shadcn card + input. |
| **Guest Portal** | Token-based self-service at `/manage/[confirmationCode]`. Matches booking flow styling. |
| **Review Page** | Token-based review submission. Uses native HTML inputs, stone color palette. |
| **Email Templates** | 5 React Email templates with hardcoded brand color (#1c1917). Shared utility file. |
| **Dark Mode** | CSS variables defined for dark mode but no toggle mechanism exists. Untested. |

### Key Problems Identified

1. **Two color worlds.** Dashboard uses shadcn semantic tokens (oklch). Booking engine uses
   hardcoded hex colors (#1E3A8A, #CA8A04, stone-*). These systems are completely disconnected.

2. **No semantic status colors.** Success, warning, and info have no dedicated tokens.
   Status indicators use ad-hoc color choices: emerald for discounts, amber for warnings,
   blue for info, red for errors — all as raw Tailwind classes, not tokens.

3. **Inconsistent badge styling.** Dashboard uses shadcn Badge with a `STATUS_VARIANTS` map
   inline in each page. Reviews page uses custom pill styles with stone colors. Booking flow
   uses its own amber badge for discounts. Payment status has a separate variant map.

4. **Inconsistent card surfaces.** Dashboard cards use shadcn Card (white bg, rounded-xl).
   Booking flow uses `bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm`. Reviews use
   `bg-white border border-stone-200 rounded-lg p-5`. Three different card languages.

5. **Inconsistent table patterns.** Each table page rebuilds column layouts, empty states,
   hover styles, and cell formatting from scratch. No shared pagination or sorting.

6. **No filter bar system.** Reservations uses pill-style status links. Reviews uses
   underline tabs + source filter pills. Rates has no filtering. Calendar has month nav only.

7. **Typography drift.** Page titles are mostly `text-2xl font-bold tracking-tight` but
   reviews uses `text-lg font-semibold` for subsections. Card labels vary between
   `text-sm font-medium`, `text-sm font-medium text-muted-foreground`, and custom stone colors.

8. **Spacing inconsistency.** Most pages use `space-y-6` but rates uses `space-y-8`.
   Card headers vary between `pb-2`, `pb-3`, `pb-6`. Grid gaps vary between `gap-2`, `gap-3`, `gap-4`.

9. **No empty/error/loading system.** Empty states differ per page: some use `py-10`,
   others `py-6`, `py-8`, or `py-12`. No shared component. No error boundaries.
   Skeletons exist as a primitive but are barely used.

10. **No dark mode toggle.** Variables exist but are untested. No UI control to switch themes.

11. **No responsive testing evidence.** Tables have `overflow-x-auto` but no card-layout
    fallback. Filter pills wrap but don't collapse. Sidebar uses Sheet on mobile but
    behavior is default shadcn, not customized.

12. **Booking flow is a styling island.** Different font, different colors, different card
    styles, different button styles. Shares almost nothing with the dashboard design system.

---

## Color Palette Input

Before Session 1 can begin, place a color palette file at:

```
docs/color-palette.md
```

Use the following format. Provide hex values — they will be converted to oklch for
`globals.css` and kept as hex for email templates and JS contexts.

```markdown
# Color Palette

## Brand
- **Primary:** #______          (main brand color — sidebar active, primary buttons)
- **Primary Foreground:** #______  (text on primary backgrounds)

## Neutrals
- **Background:** #______       (page background — light mode)
- **Foreground:** #______       (default text color — light mode)
- **Card:** #______             (card/panel surface)
- **Card Foreground:** #______  (text on cards)
- **Muted:** #______            (subtle backgrounds — inactive tabs, secondary surfaces)
- **Muted Foreground:** #______ (secondary text — descriptions, labels, timestamps)
- **Border:** #______           (default border color)
- **Input:** #______            (input field border)
- **Ring:** #______             (focus ring color)

## Semantic
- **Destructive:** #______      (errors, cancel, delete, no-show)
- **Destructive Foreground:** #______
- **Success:** #______          (confirmed, positive deltas, available)
- **Success Foreground:** #______
- **Warning:** #______          (pending, caution, low availability)
- **Warning Foreground:** #______
- **Info:** #______             (informational, scheduled, tips)
- **Info Foreground:** #______

## Accent
- **Accent:** #______           (hover backgrounds, highlighted rows)
- **Accent Foreground:** #______
- **Secondary:** #______        (secondary buttons, checked-out badges)
- **Secondary Foreground:** #______

## Booking Engine (Guest-Facing)
- **Booking Background:** #______   (page background for booking flow)
- **Booking Accent:** #______       (headings, step indicators, links)
- **Booking Accent Foreground:** #______
- **Booking CTA:** #______          (search/select/pay buttons)
- **Booking CTA Foreground:** #______
- **Booking Card:** #______         (card surfaces in booking flow)
- **Booking Muted:** #______        (secondary text in booking flow)

## Sidebar
- **Sidebar:** #______              (sidebar background)
- **Sidebar Foreground:** #______
- **Sidebar Primary:** #______      (active nav item)
- **Sidebar Primary Foreground:** #______
- **Sidebar Accent:** #______       (hover nav item)
- **Sidebar Accent Foreground:** #______
- **Sidebar Border:** #______
- **Sidebar Ring:** #______

## Charts
- **Chart 1:** #______
- **Chart 2:** #______
- **Chart 3:** #______
- **Chart 4:** #______
- **Chart 5:** #______

## Special
- **Rating Star:** #______       (star rating fill color)

## Dark Mode Overrides
(Provide hex values for any token that needs a different value in dark mode.
Any token not listed here will be auto-inverted.)

- **Background (dark):** #______
- **Foreground (dark):** #______
- **Card (dark):** #______
- **Muted (dark):** #______
- **Muted Foreground (dark):** #______
- **Border (dark):** #______
- **Primary (dark):** #______       (if different from light)
- **Destructive (dark):** #______
- **Success (dark):** #______
- **Warning (dark):** #______
- **Info (dark):** #______
- **Sidebar (dark):** #______
- **Booking Background (dark):** #______
- **Booking Card (dark):** #______
```

**Notes:**
- If you don't have dark mode values yet, leave them blank — I'll derive reasonable
  defaults during M13 (Dark Mode).
- If booking should share the same palette as the dashboard, just write "same as primary"
  etc. in the booking fields.
- Foreground variants are the text color used *on top of* that background color
  (e.g., white text on a dark primary button).

---

## Milestone 1 — Design Tokens & Color System

**Goal:** Establish the single source of truth for all colors, replacing both the oklch
defaults and the hardcoded hex values scattered through the booking flow.

**Depends on:** Color palette provisioned in `docs/color-palette.md`.

### Tasks

#### 1.1 Define semantic color tokens in `globals.css`

Replace the current oklch neutral palette with the provisioned brand palette. Add missing
semantic tokens that don't exist today:

```
/* Existing tokens to update with new palette values */
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring

/* NEW tokens to add */
--success            /* positive states, confirmed badges, revenue up */
--success-foreground
--warning            /* caution states, pending items, low availability */
--warning-foreground
--info               /* informational, scheduled actions, tips */
--info-foreground
```

Both `:root` (light) and `.dark` (dark) variants must be defined.

#### 1.2 Define chart color tokens

Update `--chart-1` through `--chart-5` to align with the new palette. Ensure sufficient
contrast between adjacent chart colors in both light and dark modes.

#### 1.3 Define sidebar tokens

Update all `--sidebar-*` tokens to derive from the new palette. The sidebar should feel
like part of the brand, not a generic gray panel.

#### 1.4 Map tokens to Tailwind theme

Update the `@theme` block in `globals.css` to register all new tokens:

```css
@theme {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

#### 1.5 Define booking engine tokens

Add dedicated tokens for the booking/public-facing surfaces. These may differ from the
dashboard palette (e.g., a guest-facing accent color vs. an admin accent color), but they
must be defined as tokens, not hardcoded hex values:

```
--booking-background       /* replaces hardcoded #F8FAFC */
--booking-accent           /* replaces hardcoded #1E3A8A */
--booking-accent-foreground
--booking-cta              /* replaces hardcoded #CA8A04 */
--booking-cta-foreground
--booking-card             /* replaces bg-white/90 */
--booking-muted            /* replaces stone-500 */
```

#### 1.6 Create a token reference file

Create `src/lib/design-tokens.ts` exporting token names as constants for use in
JavaScript contexts (e.g., Stripe Elements theming, chart configs, email templates):

```typescript
export const tokens = {
  primary: 'hsl(var(--primary))',
  destructive: 'hsl(var(--destructive))',
  success: 'hsl(var(--success))',
  // ... etc
} as const
```

#### 1.7 Audit and remove hardcoded colors

Search the entire codebase for hardcoded color values and create a replacement map:

| Hardcoded Value | Location(s) | Replace With |
|---|---|---|
| `#1E3A8A` | booking-flow, step-search, step-details, step-complete, manage page | `var(--booking-accent)` / `text-booking-accent` |
| `#CA8A04` | step-search, step-complete, booking-flow | `var(--booking-cta)` / `bg-booking-cta` |
| `#F8FAFC` | booking layout | `var(--booking-background)` / `bg-booking-background` |
| `#1c1917` | email shared.ts BRAND constant | `var(--primary)` equivalent |
| `#78716c` | email shared.ts MUTED constant | `var(--muted)` equivalent |
| `text-emerald-600` | rates page discount display | `text-success` |
| `text-amber-600` | reservation detail charge attempts | `text-warning` |
| `text-blue-600` | reservation detail scheduled charges | `text-info` |
| `text-red-600` | booking form errors, review form errors | `text-destructive` |
| `bg-green-50`, `text-green-800` | settings success alerts | `bg-success/10 text-success` |
| `bg-red-100`, `text-red-700` | calendar zero-availability cells | `bg-destructive/10 text-destructive` |
| `bg-amber-100`, `text-amber-800` | calendar low-availability cells | `bg-warning/10 text-warning` |
| `bg-green-100`, `text-green-800` | calendar available cells | `bg-success/10 text-success` |
| `text-stone-*` | reviews page, review form, amenity chips | semantic tokens |
| `text-amber-400` | star ratings | dedicated `--rating-star` token |

### Acceptance Criteria

- [ ] Zero hardcoded hex color values in any `.tsx` component file
- [ ] All semantic meanings (success, warning, info) use dedicated tokens
- [ ] Both light and dark mode tokens defined for every new token
- [ ] Booking engine uses tokens, not inline hex values
- [ ] `design-tokens.ts` exports all tokens for JS consumption

---

## Milestone 2 — Shared Primitives

**Goal:** Create thin wrapper components and centralized style maps so that badges,
cards, and status indicators look identical everywhere without inline style maps.

### Tasks

#### 2.1 Create centralized status style maps

Create `src/lib/status-styles.ts` with unified style maps:

```typescript
// Reservation status → badge variant + label
export const RESERVATION_STATUS_STYLES = {
  pending:     { variant: 'warning',     label: 'Pending',     dot: 'warning' },
  confirmed:   { variant: 'success',     label: 'Confirmed',   dot: 'success' },
  checked_in:  { variant: 'info',        label: 'Checked In',  dot: 'info' },
  checked_out: { variant: 'secondary',   label: 'Checked Out', dot: 'muted' },
  cancelled:   { variant: 'destructive', label: 'Cancelled',   dot: 'destructive' },
  no_show:     { variant: 'destructive', label: 'No Show',     dot: 'destructive' },
} as const

// Payment status → badge variant + label
export const PAYMENT_STATUS_STYLES = { ... } as const

// Room status → badge variant + label
export const ROOM_STATUS_STYLES = { ... } as const

// Rate plan status → badge variant + label
export const RATE_STATUS_STYLES = { ... } as const

// Review status → badge variant + label
export const REVIEW_STATUS_STYLES = { ... } as const

// Availability level → cell colors
export const AVAILABILITY_STYLES = { ... } as const
```

#### 2.2 Extend the Badge component variants

Update `src/components/ui/badge.tsx` to add `success`, `warning`, and `info` variants
alongside the existing `default`, `secondary`, `destructive`, `outline`:

```typescript
success:     "bg-success/10 text-success border-success/20",
warning:     "bg-warning/10 text-warning border-warning/20",
info:        "bg-info/10 text-info border-info/20",
```

#### 2.3 Create `StatusBadge` wrapper

Create `src/components/ui/status-badge.tsx`:

- Accepts a `status` string and a `styleMap` reference
- Looks up variant, label, and optional dot color from the map
- Renders the base `<Badge>` with correct variant and label
- Optional `dot` prop renders a colored indicator dot before the label
- Optional `showLabel` prop (default true) to allow icon-only on mobile

Usage: `<StatusBadge status={reservation.status} styleMap={RESERVATION_STATUS_STYLES} />`

This eliminates every inline `STATUS_VARIANTS` map in dashboard pages.

#### 2.4 Standardize Card component usage

Update `src/components/ui/card.tsx` to ensure:

- Consistent border radius: `rounded-xl` everywhere (not rounded-lg or rounded-2xl)
- Consistent shadow: `shadow-sm` (or none — pick one and enforce it)
- Card header padding: standardize to `px-6 pt-6 pb-4`
- Card content padding: standardize to `px-6 pb-6`
- Add a `variant` prop if needed: `default` (white bg) | `muted` (muted bg) | `outlined` (border only)

#### 2.5 Create `KpiCard` compound component

Create `src/components/dashboard/kpi-card.tsx`:

- Props: `title`, `value`, `subtitle`, `icon`, `trend` (optional up/down + percentage)
- Standardized layout: icon top-right, title small muted, value large bold, subtitle xs muted
- Replaces the repeated Card+CardHeader+CardContent pattern on the dashboard page

#### 2.6 Create `SectionHeader` component

Create `src/components/ui/section-header.tsx`:

- Props: `title`, `description` (optional), `action` (optional ReactNode for buttons)
- Standardized layout: flex justify-between, title + description left, action right
- Replaces the repeated flex header pattern on every dashboard page

#### 2.7 Create `PageHeader` component

Create `src/components/ui/page-header.tsx`:

- Props: `title`, `description` (optional), `breadcrumbs` (optional), `actions` (optional)
- Standardized h1 styling, consistent spacing below
- Optional breadcrumb trail above the title
- Replaces every `<h1 className="text-2xl font-bold tracking-tight">` in the codebase

#### 2.8 Create `DataPair` / `DetailRow` component

Create `src/components/ui/detail-row.tsx`:

- Props: `label`, `value`, `muted` (boolean)
- Renders a label-value pair in the consistent style used on detail pages
- Replaces the repeated `flex justify-between` + muted label pattern on reservation detail,
  guest detail, settings pages

### Acceptance Criteria

- [ ] All badge status mappings live in `status-styles.ts`, not inline in pages
- [ ] `StatusBadge` used on: dashboard, reservations list, reservation detail, reviews
- [ ] `KpiCard` used on dashboard page — no more raw Card composition for KPIs
- [ ] `PageHeader` used on every dashboard page
- [ ] `SectionHeader` used for every sub-section with a title + optional action
- [ ] Card border-radius and padding are consistent across all surfaces
- [ ] Zero inline status-to-variant mapping objects remain in page components

---

## Milestone 3 — Typography & Spacing System

**Goal:** Establish a typographic scale and spacing rhythm that every page follows,
eliminating per-page font size and spacing decisions.

### Tasks

#### 3.1 Define typography scale as Tailwind utilities

Create shared text utility classes or document the canonical scale. Every text element
in the app maps to one of these levels:

| Level | Class | Usage |
|---|---|---|
| Page Title | `text-2xl font-semibold tracking-tight` | H1 on every page |
| Section Title | `text-lg font-semibold` | Card groups, table sections |
| Card Title | `text-base font-medium` | Inside card headers |
| Card Label | `text-sm font-medium text-muted-foreground` | KPI labels, detail labels |
| Body | `text-sm` | Default text, table cells |
| Caption | `text-xs text-muted-foreground` | Helper text, timestamps, secondary info |
| Code | `text-sm font-mono` | Confirmation codes, slugs |
| KPI Value | `text-2xl font-bold` | Dashboard numbers |
| Price | `text-lg font-semibold` | Monetary amounts in prominent positions |

#### 3.2 Standardize heading usage across all pages

Audit every page and enforce the typography scale:

| Page | Current | Target |
|---|---|---|
| Dashboard h1 | `text-2xl font-bold tracking-tight` | Page Title level |
| Reservations h1 | `text-2xl font-bold tracking-tight` | Page Title level |
| Guests h1 | `text-2xl font-bold tracking-tight` | Page Title level |
| Rates h1 | `text-2xl font-bold tracking-tight` | Page Title level |
| Reviews h1 | `text-2xl font-bold tracking-tight` | Page Title level |
| Calendar h1 | `text-2xl font-bold tracking-tight` | Page Title level |
| Settings sections | `text-lg font-semibold` | Section Title level |
| Rates subsections | Mixed | Section Title level |
| Reviews average rating | `font-semibold text-stone-800` | Body + token color |

#### 3.3 Define spacing scale

Document and enforce a consistent spacing rhythm:

| Context | Spacing | Tailwind |
|---|---|---|
| Page padding (inside shell) | 24px | `p-6` |
| Section gap (between page sections) | 32px | `space-y-8` |
| Card grid gap | 16px | `gap-4` |
| Within-card gap (header to content) | 16px | `gap-4` |
| Between items in a list/stack | 12px | `space-y-3` |
| Between form fields | 16px | `space-y-4` |
| Between label and input | 6px | `space-y-1.5` |
| Inline element gap (icon + text) | 8px | `gap-2` |
| Tight inline gap (badge dot + label) | 6px | `gap-1.5` |

#### 3.4 Standardize page-level spacing

Update every dashboard page to use `space-y-8` between major sections (currently some
use `space-y-6`, rates uses `space-y-8`). Pick one and apply it everywhere.

#### 3.5 Standardize card internal spacing

Audit all Card usage and ensure:
- CardHeader: consistent padding `px-6 pt-6 pb-0` (with gap handled by the card's own gap)
- CardContent: consistent padding `px-6 pb-6`
- No mixing of `pb-2`, `pb-3`, `pb-6` on card headers

#### 3.6 Standardize grid column patterns

Document canonical grid layouts:

| Context | Pattern |
|---|---|
| KPI cards | `grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5` |
| Detail page info cards | `grid gap-4 md:grid-cols-2` |
| Form fields (two-column) | `grid gap-4 sm:grid-cols-2` |
| Full-width sections | Single column, `max-w-3xl` for forms |
| Settings pages | Single column, `max-w-3xl` |

### Acceptance Criteria

- [ ] Every text element maps to a defined typography level
- [ ] No page uses a font size/weight combination not in the scale
- [ ] All pages use the same section gap (`space-y-8`)
- [ ] Card padding is identical across all card instances
- [ ] Grid patterns follow documented canonical layouts
- [ ] stone-* color text classes replaced with semantic token classes

---

## Milestone 4 — Layout Shell & Navigation

**Goal:** Refine the application shell so the sidebar, header, and content area feel
intentionally designed and consistent.

### Tasks

#### 4.1 Redesign sidebar visual treatment

Update `src/components/dashboard/app-sidebar.tsx`:

- **Brand mark:** Replace the generic `Building2` icon with a proper logo area. Use the
  `--primary` token for the brand icon background, not raw `bg-primary`.
- **Navigation items:** Ensure all nav items use the same icon size (20px / `size-5`),
  the same label font (`text-sm font-medium`), and the same padding.
- **Active state:** Use a left border indicator or filled background from the palette —
  not just `bg-sidebar-accent`. Make the active state visually distinctive.
- **Hover state:** Subtle background shift on hover, consistent across all items.
- **Section dividers:** Replace `SidebarSeparator` with a labeled group header if the
  two nav sections represent different concerns (e.g., "Operations" vs. "Configuration").
- **Footer:** Style the user info section as a clear footer with border-top, consistent
  padding, and a visible sign-out action.

#### 4.2 Redesign dashboard header bar

Update the header bar in `src/app/(dashboard)/layout.tsx`:

- **Height:** Standardize to `h-14` (currently correct).
- **Left side:** Sidebar trigger + breadcrumb trail (not just property name text).
- **Right side:** Add utility actions area: theme toggle (dark mode), user avatar dropdown,
  optional notification indicator.
- **Border:** Keep `border-b` but ensure it uses `border-border` token.
- **Background:** Use `bg-background` to ensure correct theming.

#### 4.3 Add breadcrumb component

Create `src/components/ui/breadcrumb.tsx`:

- Slash-separated or chevron-separated trail
- Auto-generates from pathname or accepts explicit items
- Used in the header bar and on detail pages (replacing the back-link on reservation detail)
- Style: `text-sm text-muted-foreground` with last item in `text-foreground`

#### 4.4 Add theme toggle

Create `src/components/ui/theme-toggle.tsx`:

- Sun/Moon icon toggle button
- Persists preference to localStorage
- Applies `.dark` class to `<html>` element
- Uses `next-themes` or a minimal custom implementation
- Placed in the header bar's right-side utility area

#### 4.5 Refine content area

- Ensure the main content scroll region handles overflow correctly.
- Add a consistent max-width constraint on content for ultra-wide screens
  (e.g., `max-w-7xl mx-auto` on the content wrapper).
- Ensure padding is consistent: `p-6` on all sides.

#### 4.6 Sidebar collapse behavior

- Ensure collapsed sidebar shows icon-only with tooltips on hover.
- Persist collapse state in cookie (already exists via `sidebar_state`).
- On mobile, sidebar opens as a Sheet overlay — verify this works with new styling.
- Add keyboard shortcut indicator in sidebar footer (Cmd/Ctrl+B).

### Acceptance Criteria

- [ ] Sidebar has branded header, clear section groups, styled footer
- [ ] Active nav state is visually distinctive and consistent
- [ ] Header bar has breadcrumbs (left) and utility actions (right)
- [ ] Theme toggle exists and works (light/dark switch)
- [ ] Content area has max-width constraint for wide screens
- [ ] Sidebar collapse works with tooltips, keyboard shortcut noted
- [ ] All shell colors use semantic tokens

---

## Milestone 5 — Dashboard Pages Overhaul

**Goal:** Apply the new token system, primitives, and typography to every dashboard page.

### Tasks

#### 5.1 Dashboard home page (`dashboard/page.tsx`)

- Replace raw Card+CardHeader KPI blocks with `<KpiCard>` component.
- Replace inline `STATUS_VARIANTS` map with `<StatusBadge>`.
- Use `<PageHeader>` for the h1 + date display.
- Use `<SectionHeader>` for "Revenue" and "Recent Activity" sections.
- Apply standardized grid: `grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5` for KPIs.
- Revenue cards: same `<KpiCard>` component with currency formatting.
- Recent activity table: apply shared table styles (Milestone 6).
- Replace `hover:bg-muted/50` with the shared table row hover from the table system.
- Add trend indicators on KPI cards (up/down arrow + percentage if data supports it).

#### 5.2 Reservations list page (`reservations/page.tsx`)

- Use `<PageHeader>` with reservation count in description.
- Replace status filter pills with the shared filter bar (Milestone 6).
- Replace inline `STATUS_VARIANTS` and `PAYMENT_VARIANTS` with `<StatusBadge>`.
- Apply shared table system for consistent column sizing, hover, and empty state.
- Standardize confirmation code display: `font-mono text-sm`.
- Ensure channel column uses consistent capitalization and optional badge.

#### 5.3 Reservation detail page (`reservations/[id]/page.tsx`)

- Use `<PageHeader>` with breadcrumbs (Dashboard > Reservations > SHP-XXXXX).
- Replace the back-link with breadcrumb navigation.
- Use `<StatusBadge>` for the large status indicator.
- Use `<DetailRow>` for all label-value pairs in info cards.
- Standardize action button grouping: consistent sizing, spacing, variant usage.
- Payment section: use `<StatusBadge>` for payment status, semantic colors for
  scheduled/failed charge indicators.
- Replace raw `text-blue-600`, `text-amber-600`, `text-green-600` with token classes.

#### 5.4 Guests page (`guests/page.tsx`)

- Use `<PageHeader>` with guest count.
- Apply shared table system.
- Add search/filter capability (even if just a text search input) using shared filter bar.
- Right-align numeric columns consistently.
- Format currency values consistently using the same formatter.

#### 5.5 Rates page (`rates/page.tsx`)

- Use `<PageHeader>` for main heading.
- Use `<SectionHeader>` for "Rate Plans" and "Discounts" sub-sections.
- Apply shared table system to both rate plans and discounts tables.
- Replace `text-emerald-600` discount display with `text-success`.
- Standardize status badges with `<StatusBadge>` using `RATE_STATUS_STYLES`.
- Ensure action buttons (edit/delete) follow consistent icon button pattern.

#### 5.6 Reviews page (`reviews/page.tsx`)

- Use `<PageHeader>` with average rating display.
- Replace underline tab navigation with shared filter bar pattern.
- Replace source filter pills with shared filter pill component.
- Replace inline stone-* colors with semantic tokens.
- Review cards: use standardized Card component instead of custom `bg-white border border-stone-200`.
- Star display: use `text-[var(--rating-star)]` instead of `text-amber-400`.
- Property response section: use `bg-muted` instead of `bg-stone-50`.
- Ensure review actions (approve/reject/respond) use consistent button patterns.

#### 5.7 Calendar page (`calendar/page.tsx`)

- Use `<PageHeader>`.
- Replace hardcoded availability cell colors with semantic tokens:
  - Zero availability: `bg-destructive/10 text-destructive`
  - Low availability: `bg-warning/10 text-warning`
  - Available: `bg-success/10 text-success`
- Standardize month navigation buttons with consistent button component.
- Ensure rate override dialog uses standardized dialog pattern.

#### 5.8 Settings pages

**Property (`settings/property/page.tsx`):**
- Use `<PageHeader>`.
- Replace success/error alert banners with a shared `<Alert>` component using tokens:
  - Success: `bg-success/10 border-success/20 text-success`
  - Error: `bg-destructive/10 border-destructive/20 text-destructive`
- Form sections: use standardized Card with SectionHeader inside.
- Standardize all label/input styling per Milestone 7.

**Room Types (`settings/room-types/page.tsx`):**
- Use `<PageHeader>` with `<SectionHeader>` for table section.
- Apply shared table system.
- Standardize action icon buttons (4 actions: amenities, rules, edit, delete).

**Rooms (`settings/rooms/page.tsx`):**
- Use `<PageHeader>`.
- Room type cards: use standardized Card.
- Room rows: consistent height, padding, and action button placement.
- Empty state: use shared empty state component (Milestone 10).

**Amenities (`settings/amenities/page.tsx`):**
- Use `<PageHeader>`.
- Apply shared table system.
- Icon display: use standardized code-style display instead of raw `bg-muted` classes.

### Acceptance Criteria

- [ ] Every dashboard page uses `<PageHeader>` and `<SectionHeader>`
- [ ] All status badges use `<StatusBadge>` with centralized style maps
- [ ] All tables use the shared table system (Milestone 6)
- [ ] Zero raw semantic color classes (emerald, amber, blue, stone) remain
- [ ] Card surfaces look identical in border, radius, shadow, and padding
- [ ] Settings forms have consistent alert styling and field layout

---

## Milestone 6 — Data Tables & Filter System

**Goal:** Create a shared table system and filter bar that all data pages consume.

### Tasks

#### 6.1 Create `DataTable` wrapper component

Create `src/components/ui/data-table.tsx`:

- Wraps shadcn `<Table>` with consistent container styling: `rounded-xl border`
- Provides consistent header styling: `bg-muted/30` header background for visual separation
- Row hover: `hover:bg-muted/50 transition-colors cursor-pointer` (when rows are clickable)
- Standardized cell padding: `px-4 py-3` (slightly more generous than current `p-2`)
- Empty state slot: renders shared empty state component when no data
- Optional `caption` for accessibility
- Consistent header font: `text-xs font-medium text-muted-foreground uppercase tracking-wider`

#### 6.2 Create table cell formatters

Create `src/components/ui/table-cells.tsx` with formatted cell components:

- `<CurrencyCell>` — right-aligned, formatted with locale, consistent font
- `<DateCell>` — formatted date with `tabular-nums`, consistent format
- `<CodeCell>` — monospace font for confirmation codes, slugs
- `<UserCell>` — name + email stacked pattern (used on reservations, guests)
- `<StatusCell>` — wraps `<StatusBadge>` with correct alignment

#### 6.3 Create `FilterBar` component

Create `src/components/ui/filter-bar.tsx`:

- Container: `flex items-center gap-2 flex-wrap` with optional border/background
- Accepts filter definitions as props:
  - `tabs`: Array of `{ value, label, count? }` for primary segmented filter
  - `pills`: Array of `{ value, label }` for secondary multi-select filter
  - `search`: boolean to show search input
  - `dateRange`: boolean to show date range picker
  - `onFilterChange`: callback with current filter state
- Active tab/pill: uses `bg-primary text-primary-foreground`
- Inactive: `bg-muted text-muted-foreground hover:bg-muted/80`
- Consistent pill styling: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors`
- Clear/reset button when any filter is active

#### 6.4 Apply to reservations page

Replace the inline status filter links with `<FilterBar tabs={...}>`.
Replace the table with `<DataTable>` using cell formatters.

#### 6.5 Apply to reviews page

Replace the underline tabs with `<FilterBar tabs={...}>`.
Replace the source filter pills with `<FilterBar pills={...}>`.
Wrap review list in the same container pattern.

#### 6.6 Apply to guests page

Add a `<FilterBar search>` for guest name/email search.
Replace table with `<DataTable>`.

#### 6.7 Apply to rates page

Replace tables with `<DataTable>`.
Add filter if multiple room types exist.

#### 6.8 Apply to settings tables

Room types, rooms, and amenities tables all use `<DataTable>`.

#### 6.9 Pagination component

Create `src/components/ui/pagination.tsx`:

- Standardized pagination footer for tables with many rows
- Shows: "Showing X–Y of Z" + page navigation buttons
- Uses consistent button styling (ghost/outline variants, icon-sm size)
- Integrates as a footer slot in `<DataTable>`

Not all pages need pagination immediately, but the component should exist for when
data grows beyond a single page.

### Acceptance Criteria

- [ ] `<DataTable>` used on all tabular data pages (7+ pages)
- [ ] Consistent header styling, cell padding, hover, and empty state
- [ ] `<FilterBar>` used on reservations, reviews, and guests pages
- [ ] All filter interactions (tabs, pills, search) follow the same visual pattern
- [ ] Cell formatters eliminate duplicated formatting logic across pages
- [ ] Pagination component exists and can be integrated when needed

---

## Milestone 7 — Forms & Input Patterns

**Goal:** Standardize all form layouts, validation display, and input styling across
dashboard settings and booking flow forms.

### Tasks

#### 7.1 Create `FormField` wrapper component

Create `src/components/ui/form-field.tsx`:

- Props: `label`, `error`, `description`, `required`, `children` (input slot)
- Consistent layout: label above, input below, error/description below input
- Label: `text-sm font-medium` (no muted — labels should be readable)
- Required indicator: red asterisk or "(required)" text
- Error: `text-sm text-destructive mt-1.5` with destructive icon
- Description/helper: `text-xs text-muted-foreground mt-1`
- Wraps any input, textarea, or select

#### 7.2 Standardize input focus states

Ensure all inputs (input, textarea, select, calendar trigger) use identical focus ring:

```
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

Verify this across:
- shadcn `<Input>` — currently uses `ring-[3px]`, may need adjustment
- shadcn `<Textarea>` — same pattern
- shadcn `<Select>` trigger — same pattern
- Calendar date picker trigger (popover trigger)
- Custom inputs in booking flow (date pickers, guest steppers)

#### 7.3 Standardize form section layout

Define canonical form layout:

```
<Card>
  <CardHeader>
    <CardTitle>Section Name</CardTitle>
    <CardDescription>Section explanation</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">        /* standard field gap */
      <div className="grid gap-4 sm:grid-cols-2">  /* two-column fields */
        <FormField label="..." ...>
        <FormField label="..." ...>
      </div>
      <FormField label="..." ...>      /* full-width field */
    </div>
  </CardContent>
</Card>
```

#### 7.4 Apply to property settings form

Refactor `settings/property-form.tsx` to use `<FormField>` and the canonical layout.
Replace raw label+input pairs with `<FormField>` wrapper.
Replace success/error banners with shared `<Alert>` component.

#### 7.5 Apply to room type form

Refactor `room-types/room-type-form.tsx` to use `<FormField>` and canonical layout.

#### 7.6 Apply to rate plan form

Refactor `rates/rate-plan-form.tsx` to use `<FormField>` and canonical layout.

#### 7.7 Apply to booking flow details step

Refactor `step-details.tsx` to use `<FormField>` (or a booking-specific version that
inherits the same field-level consistency). Ensure error display matches the system.

#### 7.8 Standardize dialog forms

All dialog-based forms (room dialogs, rate dialogs, discount dialogs, amenity dialogs,
review response, import reviews) should:

- Use `<FormField>` inside dialog content
- Have consistent padding inside dialog body
- Have consistent footer button layout (cancel left, submit right)
- Use consistent loading states on submit buttons

#### 7.9 Create `SubmitButton` shared component

Create `src/components/ui/submit-button.tsx`:

- Uses `useFormStatus()` for pending state
- Shows spinner icon + "Saving..." text when pending
- Disabled during submission
- Consistent size and variant across all forms

### Acceptance Criteria

- [ ] `<FormField>` used in all settings forms, dialog forms, and booking flow
- [ ] Focus rings are identical across all input types
- [ ] Form section layout follows the canonical Card pattern
- [ ] All submit buttons use the shared `<SubmitButton>` component
- [ ] Error messages display identically across all forms
- [ ] Dialog forms have consistent internal layout

---

## Milestone 8 — Booking Engine Overhaul

**Goal:** Bring the guest-facing booking flow into the design system while preserving
its distinct public-facing personality. Replace all hardcoded colors with tokens.

### Tasks

#### 8.1 Replace hardcoded colors with booking tokens

Across all booking components, replace:

| File | Change |
|---|---|
| `booking-flow.tsx` | `#1E3A8A` → `text-booking-accent`, `#CA8A04` → `text-booking-cta` |
| `step-search.tsx` | `bg-[#CA8A04]` → `bg-booking-cta`, `hover:bg-amber-700` → `hover:bg-booking-cta/90` |
| `step-select.tsx` | Discount badge amber → `bg-booking-cta/10 text-booking-cta` |
| `step-details.tsx` | `focus-visible:ring-[#1E3A8A]/50` → `focus-visible:ring-booking-accent/50` |
| `step-complete.tsx` | All navy/gold hardcoded values → booking tokens |
| `booking layout` | `bg-[#F8FAFC]` → `bg-booking-background` |

#### 8.2 Standardize booking card surfaces

All booking cards currently use `bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm`.
Replace with `bg-booking-card rounded-xl shadow-sm` to align radius with the system
(rounded-xl, not rounded-2xl) and use a token for the background.

#### 8.3 Standardize step indicator

Refactor the step progress indicator in `booking-flow.tsx`:

- Extract into its own component: `src/components/booking/step-indicator.tsx`
- Use booking tokens for colors (completed, current, upcoming)
- Ensure labels are responsive (hidden on very small screens, visible on sm+)
- Improve accessibility: `aria-current="step"` on current step

#### 8.4 Standardize booking buttons

All booking CTAs should use the same button treatment:

- Primary CTA (search, select, continue, pay): `bg-booking-cta text-booking-cta-foreground`
- Secondary (back, change dates): `variant="outline"` or `variant="ghost"`
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: spinner icon + text change

#### 8.5 Standardize booking form inputs

Step-details and step-search inputs should use the same input components as the dashboard,
with booking-specific focus ring color (`ring-booking-accent` instead of `ring-ring`).

Ensure the guest stepper (+/- buttons) follows button system conventions.

#### 8.6 Refine room selection cards (step-select)

- Consistent card surface (booking-card token)
- Amenity chips: replace `bg-slate-50 text-stone-500` with `bg-muted text-muted-foreground`
- Pricing display: use consistent currency formatter
- Discount badge: use `<Badge variant="success">` or booking-specific variant
- Blocked rooms: use `opacity-50` with clear messaging
- Standardize spacing between card sections

#### 8.7 Refine confirmation page (step-complete)

- Replace hardcoded animation CSS with shared motion utilities (Milestone 14)
- Replace gold `<hr>` with a styled separator using booking tokens
- Confirmation code: consistent monospace treatment
- Summary card: use booking-card token
- "Make another booking" CTA: consistent link/button styling

#### 8.8 Refine payment step (step-confirm)

- Summary section: use `<DetailRow>` component for stay/guest/price details
- Stripe Elements: theme using tokens from `design-tokens.ts`
- "Secured by Stripe" disclaimer: consistent caption styling
- Error display: use shared error treatment

#### 8.9 Reviews section in booking flow

The search step shows recent reviews. Standardize:

- Star display using the `--rating-star` token
- Review cards using booking-card styling
- Source badge using `<Badge>` from the system
- Property response using `bg-muted` card

### Acceptance Criteria

- [ ] Zero hardcoded hex colors in any booking component
- [ ] All booking cards use `bg-booking-card rounded-xl` consistently
- [ ] Step indicator extracted into reusable component with token colors
- [ ] Booking buttons follow consistent CTA/secondary/ghost hierarchy
- [ ] Form inputs in booking flow match dashboard input styling (except focus color)
- [ ] Room cards, confirmation page, and payment step use token-based styling
- [ ] Stripe Elements themed with design tokens

---

## Milestone 9 — Auth, Guest Portal & Review Pages

**Goal:** Align authentication, guest self-service, and review submission pages with the
design system.

### Tasks

#### 9.1 Auth page redesign

**Login (`(auth)/login/page.tsx`):**

- Layout: keep centered card but apply system card styling.
- Brand mark: use proper logo or styled brand icon with `bg-primary` token.
- Card: standardize border, radius, shadow with system Card.
- Form fields: use `<FormField>` wrapper.
- Error display: use shared error styling (`text-destructive`).
- Submit button: use `<SubmitButton>` shared component.
- Register link: consistent link styling.
- Consider adding: subtle background pattern or brand color accent for visual interest.

**Register (`(auth)/register/page.tsx`):**

- Same treatment as login.
- Ensure both pages look like they belong to the same system.

**Auth layout (`(auth)/layout.tsx`):**

- Update `bg-muted/40` to use the correct token-based background.
- Consider adding a brand element (sidebar panel, logo, illustration) on larger screens
  (split layout: brand panel left, form right) — only if the user wants this level of change.

#### 9.2 Guest self-service portal redesign

**Manage page (`manage/[confirmationCode]/page.tsx`):**

- Replace hardcoded `#1E3A8A` header colors with booking tokens.
- Replace `bg-white/90 backdrop-blur-sm` cards with `bg-booking-card` token.
- Status badge: use `<StatusBadge>` from the system (or booking-appropriate variant).
  - Green for confirmed → `variant="success"`
  - Red for cancelled → `variant="destructive"`
  - Stone for other → `variant="secondary"`
- Replace stone-* text colors with semantic tokens.
- Confirmation code display: consistent monospace + tracking-wider.
- Cancellation section: use `bg-destructive/5` for the warning area.
- Use `<DetailRow>` for all check-in/check-out/room/duration/guests pairs.

**Cancel button (`cancel-button.tsx`):**

- Confirmation modal: use shadcn `<AlertDialog>` instead of custom modal states.
- Button states: use system button variants (destructive for cancel, default for keep).
- Success message: use shared success treatment.

#### 9.3 Review submission page redesign

**Review page (`review/[token]/page.tsx`):**

- Replace native HTML inputs with shadcn `<Input>` and `<Textarea>`.
- Replace stone-* colors with semantic tokens.
- Star rating component: extract to `src/components/ui/star-rating.tsx`
  - Interactive mode (click to rate) for submission
  - Display mode (read-only) for reviews list
  - Uses `--rating-star` token for filled stars
  - Accessible: `aria-label="Rate X out of 5 stars"`, keyboard navigable
- Character counter: consistent caption styling.
- Error display: use shared error treatment.
- Success state: use shared success illustration/treatment.
- Expired/used states: use shared empty state component pattern.

**Review form (`review-form.tsx`):**

- Use `<FormField>` wrapper for title and body fields.
- Use extracted `<StarRating>` component.
- Submit button: use shared `<SubmitButton>`.

#### 9.4 Error pages (404, 403, expired token)

Create consistent error page treatments:

- Shared layout: centered content with icon, heading, description, action
- 404: "Page not found" with link to home
- 403/unauthorized: "Access denied" with link to login
- Token expired: "This link has expired" with explanation
- Token used: "Already submitted" with confirmation

### Acceptance Criteria

- [ ] Auth pages use system card, form field, and button components
- [ ] Guest portal uses booking tokens instead of hardcoded colors
- [ ] Cancel flow uses shadcn AlertDialog
- [ ] Review page uses shadcn inputs and shared star rating component
- [ ] Star rating component is reusable (interactive + display modes)
- [ ] Error/expired/used pages have consistent treatment
- [ ] All pages use semantic token colors, not raw palette classes

---

## Milestone 10 — State Treatments

**Goal:** Create consistent empty, error, and loading states across all surfaces.

### Tasks

#### 10.1 Create `EmptyState` component

Create `src/components/ui/empty-state.tsx`:

- Props: `icon` (Lucide icon), `title`, `description`, `action` (optional CTA button)
- Layout: centered vertically, icon above title, description below, action button below
- Consistent sizing: icon `size-12 text-muted-foreground/50`, title `text-base font-medium`,
  description `text-sm text-muted-foreground max-w-sm mx-auto`
- Padding: `py-16` for table contexts, `py-24` for full-page contexts

#### 10.2 Apply `EmptyState` across all tables

Replace every inline empty state in the codebase:

| Page | Current Pattern | Replacement |
|---|---|---|
| Dashboard recent activity | `py-10` text | `<EmptyState icon={BookOpen} title="No recent bookings" />` |
| Reservations list | `py-10 text-sm` | `<EmptyState icon={BookOpen} title="No reservations found" />` |
| Guests list | `py-10 text-sm` | `<EmptyState icon={Users} title="No guests yet" />` |
| Rates - rate plans | `py-6 text-sm` | `<EmptyState icon={TrendingUp} title="No rate plans" action={...} />` |
| Rates - discounts | `py-6 text-sm` | `<EmptyState icon={Percent} title="No discounts" action={...} />` |
| Reviews list | `py-12` | `<EmptyState icon={Star} title="No reviews" />` |
| Settings room types | `py-8` | `<EmptyState icon={Bed} title="No room types" action={...} />` |
| Settings rooms | `border-dashed p-10` | `<EmptyState icon={DoorOpen} title="No rooms" action={...} />` |
| Settings amenities | `py-8` | `<EmptyState icon={Sparkles} title="No amenities" action={...} />` |
| Booking step-select | Custom "No rooms" | `<EmptyState icon={Search} title="No rooms available" />` |

#### 10.3 Create `ErrorBoundary` component

Create `src/components/ui/error-boundary.tsx`:

- React error boundary with fallback UI
- Fallback: centered icon + "Something went wrong" + "Try again" button
- Consistent with empty state visual language
- Optional `onReset` callback for retry logic

#### 10.4 Create inline error display component

Create `src/components/ui/inline-error.tsx`:

- For API errors, form errors, and action failures
- Icon (AlertCircle) + message in destructive color
- Consistent padding and border treatment
- Replaces the various inline error patterns across the codebase

#### 10.5 Standardize toast notifications

Audit sonner (toast) usage and ensure:

- Success toasts: green/success icon + message
- Error toasts: red/destructive icon + message
- Info toasts: blue/info icon + message
- Consistent duration (4 seconds default)
- Position: bottom-right on desktop, bottom-center on mobile
- Create helper functions: `showSuccess()`, `showError()`, `showInfo()`

#### 10.6 Create loading skeletons for each page type

Create page-specific skeleton components that match content shape:

- `DashboardSkeleton`: KPI card shapes + table skeleton
- `TableSkeleton`: header + N rows of cells with shimmer
- `DetailSkeleton`: header + card grid with shimmer
- `FormSkeleton`: label + input shapes with shimmer
- `CalendarSkeleton`: grid of cells with shimmer

All skeletons use the same `<Skeleton>` primitive with consistent:
- Background: `bg-muted`
- Animation: `animate-pulse`
- Border radius matching the element they replace

#### 10.7 Apply loading states to data-fetching pages

Wrap each dashboard page's data section with loading boundaries:

- Use Next.js `loading.tsx` files or Suspense boundaries
- Each loading state renders the appropriate skeleton
- Create `loading.tsx` for: dashboard, reservations, guests, rates, reviews, calendar, settings

### Acceptance Criteria

- [ ] `<EmptyState>` used in all 10+ empty data contexts
- [ ] All empty states have consistent icon, spacing, and optional CTA
- [ ] Error boundary exists and is applied to major page sections
- [ ] Inline error display is consistent across all forms and actions
- [ ] Toast notifications have consistent success/error/info styling
- [ ] Every dashboard route has a `loading.tsx` with appropriate skeleton
- [ ] Skeletons match the shape of the content they replace

---

## Milestone 11 — Accessibility Baseline

**Goal:** Ensure WCAG AA compliance across all interactive elements and data displays.

### Tasks

#### 11.1 Keyboard navigation audit

Test and fix keyboard navigation on:

- [ ] Sidebar: all nav items focusable and activatable with Enter/Space
- [ ] Tables: row focus and activation for clickable rows
- [ ] Filter bar: tab through tabs/pills, activate with Enter/Space
- [ ] Dialogs: focus trap, Escape to close, focus returns to trigger
- [ ] Date pickers: arrow key navigation, Enter to select
- [ ] Guest stepper (+/-): keyboard increment/decrement
- [ ] Star rating: arrow keys to change rating
- [ ] Dropdown menus: arrow key navigation
- [ ] Booking flow: step navigation via keyboard

#### 11.2 Focus ring audit

Ensure visible focus rings on every focusable element:

- [ ] All buttons (including icon-only buttons)
- [ ] All form inputs (input, textarea, select)
- [ ] All links (including table row links)
- [ ] Dialog close buttons
- [ ] Sidebar nav items
- [ ] Filter tabs and pills
- [ ] Calendar day cells
- [ ] Stepper +/- buttons

Focus ring style: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
(or the existing `ring-[3px]` pattern — pick one and apply consistently).

#### 11.3 ARIA labels on icon-only buttons

Add `aria-label` to every button that has no visible text:

| Component | Button | aria-label |
|---|---|---|
| Sidebar | SidebarTrigger | "Toggle sidebar" |
| Header | Theme toggle | "Toggle dark mode" |
| Tables | Edit icon button | "Edit {item name}" |
| Tables | Delete icon button | "Delete {item name}" |
| Room types | Manage amenities | "Manage amenities for {name}" |
| Room types | Manage rules | "Manage rules for {name}" |
| Rooms | Delete room | "Delete room {number}" |
| Amenities | Edit/Delete | "Edit/Delete {name}" |
| Rate plans | Edit/Delete | "Edit/Delete {name}" |
| Booking | Guest stepper +/- | "Increase/Decrease adults/children" |
| Calendar | Previous/Next month | "Previous/Next month" |

#### 11.4 Color contrast audit

Verify WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text):

- [ ] `muted-foreground` against `background` — most common secondary text pairing
- [ ] `muted-foreground` against `card` — labels inside cards
- [ ] Badge text against badge background — all variants
- [ ] Calendar cell text against colored backgrounds (red, amber, green)
- [ ] Booking accent text against booking background
- [ ] Booking CTA button text against CTA background
- [ ] Star rating color against both light and dark backgrounds
- [ ] Filter pill text (active and inactive states)

Fix any failing ratios by adjusting token values.

#### 11.5 Form label associations

Ensure every input has an associated label:

- [ ] All `<Input>` elements have a matching `<Label htmlFor={id}>`
- [ ] All `<Textarea>` elements have labels
- [ ] All `<Select>` elements have labels
- [ ] Search input in filter bar has `aria-label="Search"`
- [ ] Date picker triggers have labels
- [ ] Guest stepper has associated label text

#### 11.6 Data visualization text alternatives

- [ ] Calendar grid: add `aria-label` to cells describing availability
  (e.g., "Studio apartment, March 25: 2 of 3 available, €85/night")
- [ ] KPI cards: ensure screen readers can parse the value + context
- [ ] Star ratings: `aria-label="Rated X out of 5 stars"`
- [ ] Status badges: ensure badge text is sufficient without color

#### 11.7 Touch target sizes

Verify all interactive elements meet 44x44px minimum:

- [ ] Icon-only buttons (especially `icon-xs` and `icon-sm` variants)
- [ ] Filter pills
- [ ] Calendar day cells
- [ ] Stepper +/- buttons
- [ ] Table row tap targets on mobile
- [ ] Dialog close button

Increase padding or minimum dimensions where targets are too small.

### Acceptance Criteria

- [ ] Full keyboard navigation works on every interactive element
- [ ] Visible focus rings on all focusable elements
- [ ] All icon-only buttons have `aria-label`
- [ ] All color pairings meet WCAG AA contrast ratios
- [ ] All form inputs have associated labels
- [ ] Data visualizations have text alternatives
- [ ] All touch targets meet 44x44px minimum

---

## Milestone 12 — Responsive & Mobile

**Goal:** Ensure every surface is usable at 375px width with intentional responsive
behavior, not accidental wrapping.

### Tasks

#### 12.1 Define breakpoint strategy

Document and enforce consistent breakpoints:

| Breakpoint | Width | Usage |
|---|---|---|
| Default | 0–639px | Mobile-first base styles |
| `sm` | 640px+ | Two-column forms, label visibility |
| `md` | 768px+ | Sidebar visible, detail grids |
| `lg` | 1024px+ | Full table columns, wider grids |
| `xl` | 1280px+ | 5-column KPI grid, max content width |

#### 12.2 Sidebar responsive behavior

- **< md:** Sidebar hidden, hamburger menu in header opens Sheet overlay
- **md+:** Sidebar visible, collapsible to icon-only mode
- Verify Sheet overlay works with new sidebar styling
- Ensure no horizontal overflow when sidebar is open on tablet

#### 12.3 Table responsive strategy

Pick one pattern and apply everywhere:

**Option A — Horizontal scroll (recommended for data-heavy tables):**
- Wrap all tables in `overflow-x-auto` container (already exists)
- Set `min-w-[600px]` on the table element to prevent column crushing
- Add scroll shadow indicators on left/right edges

**Option B — Card layout on mobile (for simpler tables):**
- Below `md` breakpoint, render each row as a stacked card
- Show key fields (name, status, amount) prominently
- Collapse secondary fields into expandable section

Apply chosen pattern to: reservations, guests, rates, settings tables.

#### 12.4 KPI cards responsive layout

- **Mobile (< sm):** 2-column grid (already exists)
- **Tablet (sm–lg):** 2 or 3 columns
- **Desktop (lg+):** 4 or 5 columns
- Ensure card content doesn't overflow at narrow widths
- KPI values may need to shrink: `text-xl` on mobile, `text-2xl` on desktop

#### 12.5 Filter bar responsive behavior

- **Mobile:** Stack filters vertically or collapse into a disclosure ("Filters" button
  that expands to show filter options)
- **Tablet+:** Horizontal layout with wrapping
- Search input: full width on mobile, fixed width on desktop
- Test at 375px: ensure no horizontal overflow

#### 12.6 Booking flow responsive layout

- **Step indicator:** Already hides labels on mobile (good). Verify dot sizes are
  touch-friendly (44px minimum).
- **Date pickers:** Calendar popover should be full-width on mobile, or use a Sheet/drawer
  from the bottom instead of a popover.
- **Room cards:** Single column on mobile, ensure images (if added later) scale correctly.
- **Payment summary:** Three-column layout should stack on mobile to single column.
- **Guest form:** Two-column name fields should stack on mobile (already `sm:grid-cols-2`).

#### 12.7 Dialog responsive behavior

- **Mobile:** Dialogs should be full-width (minus padding) with larger tap targets.
- Currently `sm:max-w-lg` — verify this works well on 375px screens.
- Consider using Sheet (bottom drawer) instead of centered Dialog on mobile for
  form-heavy interactions.

#### 12.8 Calendar page responsive

- Month grid with 31+ columns is inherently problematic on mobile.
- **Mobile option:** Show 7-day view instead of full month, with swipe to navigate.
- **Or:** Horizontal scroll with frozen room-type column on the left.
- Ensure rate override dialog works on mobile (touch input for currency field).

#### 12.9 Settings pages responsive

- Property form: already `max-w-3xl` — verify field labels don't truncate.
- Room cards with room rows: ensure action buttons are accessible on mobile.
- Amenity table: apply chosen table responsive pattern.

#### 12.10 Test at key widths

Systematic testing checklist at 375px, 768px, 1024px, 1440px:

- [ ] No horizontal overflow on any page
- [ ] All text readable without zooming
- [ ] All buttons and links tappable (44px minimum)
- [ ] Tables scrollable or stacked appropriately
- [ ] Dialogs usable and closeable
- [ ] Booking flow completable end-to-end
- [ ] Sidebar opens/closes correctly
- [ ] Filter interactions work via touch

### Acceptance Criteria

- [ ] All pages tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal overflow at any breakpoint
- [ ] Tables have intentional responsive behavior (scroll or stack)
- [ ] Filter bars collapse or stack on mobile
- [ ] All touch targets meet 44px minimum
- [ ] Booking flow is fully completable on mobile
- [ ] Calendar has a usable mobile representation

---

## Milestone 13 — Dark Mode Systemization

**Goal:** Make dark mode fully functional and visually coherent on every surface.

### Tasks

#### 13.1 Audit all token pairings in dark mode

Verify every token defined in `:root` has a `.dark` counterpart and that the
dark values provide correct contrast:

| Token | Light Value | Dark Value | Verify |
|---|---|---|---|
| --background | white | dark surface | Must work as page bg |
| --foreground | dark | light | Must have 4.5:1 contrast on bg |
| --card | white | slightly elevated dark | Must differ from bg |
| --muted | light gray | dark gray | Must differ from card |
| --primary | brand color | brand color (adjusted for dark) | Must be visible |
| --destructive | red | adjusted red | Must contrast on dark bg |
| --success | green | adjusted green | New token |
| --warning | amber | adjusted amber | New token |
| --info | blue | adjusted blue | New token |
| --border | light gray | subtle dark line | Must be visible |
| --booking-* | all booking tokens | dark counterparts | Must be defined |

#### 13.2 Fix known dark mode issues

Common problems to check and fix:

- [ ] Shadows invisible in dark mode → adjust shadow color or add subtle border
- [ ] Borders disappearing against dark backgrounds → ensure `--border` is visible
- [ ] Booking cards (`bg-white/90`) → must use token, not hardcoded white
- [ ] Review cards (`bg-white border-stone-200`) → must use token
- [ ] Success alerts (`bg-green-50`) → must use `bg-success/10`
- [ ] Calendar cells with colored backgrounds → verify text contrast in dark mode
- [ ] Star rating color (`amber-400`) → verify visibility on dark backgrounds
- [ ] Amenity chips (`bg-slate-50`) → must use `bg-muted`
- [ ] Auth pages (`bg-muted/40`) → verify in dark mode
- [ ] Stripe Elements → must be themed for dark mode via appearance API

#### 13.3 Dark mode for Stripe Elements

Update `step-confirm.tsx` to pass dark mode appearance to Stripe Elements:

```typescript
const appearance = {
  theme: isDark ? 'night' : 'stripe',
  variables: {
    colorPrimary: tokens.primary,
    // ... other token mappings
  },
}
```

#### 13.4 Dark mode for email templates

Email templates don't support dark mode (email clients handle this), but ensure:

- Email background colors are explicit (not transparent)
- Text colors have sufficient contrast on both light and dark email client backgrounds
- Test in Apple Mail, Gmail, and Outlook dark modes

#### 13.5 Dark mode toggle persistence

- Persist theme choice in localStorage
- Apply theme class on initial load (prevent flash of wrong theme)
- Respect `prefers-color-scheme` as default when no user preference is saved
- Add system preference option (auto/light/dark)

#### 13.6 Visual testing in dark mode

Test every surface in dark mode:

- [ ] Dashboard home page (KPIs, revenue, table)
- [ ] Reservations list and detail
- [ ] Guests list
- [ ] Rates page (tables, dialogs)
- [ ] Reviews page (cards, filters, star ratings)
- [ ] Calendar (colored cells, rate override dialog)
- [ ] All settings pages (forms, tables)
- [ ] Booking flow (all 5 steps)
- [ ] Guest self-service portal
- [ ] Review submission page
- [ ] Auth pages (login, register)
- [ ] Sidebar and header
- [ ] All dialogs and modals
- [ ] All empty states
- [ ] All error states
- [ ] Toast notifications

### Acceptance Criteria

- [ ] Every CSS token has a dark mode counterpart
- [ ] Zero hardcoded color values that break in dark mode
- [ ] All surfaces tested and visually coherent in dark mode
- [ ] Theme toggle works with three options: light/dark/system
- [ ] No flash of wrong theme on page load
- [ ] Stripe Elements themed for dark mode
- [ ] Contrast ratios verified in dark mode

---

## Milestone 14 — Motion & Animation

**Goal:** Define a consistent motion system with appropriate reduced-motion support.

### Tasks

#### 14.1 Define motion tokens

Add CSS custom properties for animation durations and easings:

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

#### 14.2 Apply consistent hover transitions

Standardize all hover transitions to use motion tokens:

```css
transition: all var(--duration-fast) var(--ease-default);
```

Apply to:
- Buttons: background-color, box-shadow transitions
- Table rows: background-color transition
- Links: color transition
- Cards: box-shadow transition (subtle lift on hover, if desired)
- Filter pills: background-color, color transition
- Sidebar items: background-color transition

#### 14.3 Dialog/Sheet enter/exit animations

Ensure dialog and sheet components use consistent timing:

- Dialog overlay: fade in `var(--duration-normal)`, fade out `var(--duration-fast)`
- Dialog content: scale + fade in `var(--duration-normal)`, scale + fade out `var(--duration-fast)`
- Sheet: slide in `var(--duration-normal)`, slide out `var(--duration-fast)`
- These should already be handled by shadcn defaults — verify consistency.

#### 14.4 Page transition animations

Consider subtle page-level transitions for dashboard navigation:

- Content fade-in on route change: `opacity 0→1` over `var(--duration-normal)`
- Optional: staggered content entrance for card grids
- Keep it subtle — avoid anything that slows perceived navigation speed.

#### 14.5 Booking flow step transitions

Refine the booking flow step transitions:

- Current: some steps have fade-in + slide-up animations.
- Standardize: all steps use `opacity 0→1, translateY 8px→0` over `var(--duration-normal)`.
- Confirmation page: keep the celebratory entrance but use motion tokens for timing.

#### 14.6 Skeleton animation

Standardize skeleton pulse animation:

- Use `animate-pulse` with `var(--duration-slow)` timing
- Or use a shimmer gradient animation for a more polished feel
- Consistent across all skeleton instances

#### 14.7 Reduced motion support

Add global reduced motion respect:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Verify:
- [ ] Skeleton animations stop (or reduce to simple opacity change)
- [ ] Dialog transitions are instant
- [ ] Page transitions are instant
- [ ] Booking flow step changes are instant
- [ ] Hover transitions still work but are instant

### Acceptance Criteria

- [ ] Motion tokens defined in CSS custom properties
- [ ] All hover transitions use consistent timing from tokens
- [ ] Dialog/sheet animations use consistent timing
- [ ] Booking flow transitions use motion tokens
- [ ] `prefers-reduced-motion` fully respected
- [ ] No animation feels jarring or too slow

---

## Milestone 15 — Email Template Alignment

**Goal:** Align email template branding with the new design system colors.

### Tasks

#### 15.1 Update shared email constants

Update `src/components/emails/shared.ts`:

- Replace `BRAND = "#1c1917"` with the primary brand color from the palette
- Replace `MUTED = "#78716c"` with the muted color from the palette
- Add `SUCCESS`, `WARNING`, `INFO` color constants for email use
- Add `CTA_BG`, `CTA_TEXT` for email button colors

Note: Email templates cannot use CSS variables — they need static hex values.
The values should match the design tokens but must be hardcoded as hex.

#### 15.2 Update header styling across all templates

All 5 email templates have a header section. Standardize:

- Background: brand primary color
- Text: white or brand-foreground
- Font: system sans-serif (emails can't use custom fonts reliably)
- Consistent padding and text size across all templates

#### 15.3 Update CTA button styling

All templates with CTA buttons (booking confirmation, review request, post-stay):

- Background: CTA color from palette
- Text: CTA foreground
- Border-radius: 8px (consistent with system `rounded-lg`)
- Padding: 12px 24px
- Font: bold, consistent size

#### 15.4 Update information display in templates

- Confirmation code boxes: consistent border, background, font
- Detail sections: consistent label/value alignment
- Dividers: consistent color and spacing

#### 15.5 Test email rendering

- Test in: Apple Mail, Gmail web, Gmail mobile, Outlook desktop, Outlook web
- Verify: brand colors render correctly, text is readable, buttons are clickable,
  layout doesn't break on narrow email clients

### Acceptance Criteria

- [ ] Email brand colors match the design system palette
- [ ] All templates use the same header, button, and typography treatment
- [ ] Templates tested in major email clients
- [ ] Shared constants updated with palette-derived values

---

## Milestone 16 — Final Audit & Polish

**Goal:** Comprehensive review to catch any remaining inconsistencies and ensure the
entire product feels like one cohesive system.

### Tasks

#### 16.1 Visual consistency audit

Walk through every page and verify:

- [ ] Dashboard home
- [ ] Reservations list
- [ ] Reservation detail
- [ ] Guests list
- [ ] Rates page
- [ ] Reviews page
- [ ] Calendar
- [ ] Settings > Property
- [ ] Settings > Room Types
- [ ] Settings > Rooms
- [ ] Settings > Amenities
- [ ] Login page
- [ ] Register page
- [ ] Booking flow (all 5 steps)
- [ ] Guest self-service portal
- [ ] Review submission page

For each, check:
- Typography matches the defined scale
- Colors use semantic tokens only
- Cards have identical surface treatment
- Tables have identical styling
- Badges use StatusBadge
- Empty states use EmptyState
- Forms use FormField
- Buttons use consistent variants and sizes
- Spacing follows the defined scale
- Page header uses PageHeader component

#### 16.2 Hardcoded color sweep

Run a final search for any remaining hardcoded colors:

```bash
# Search for hardcoded hex colors
grep -rn '#[0-9a-fA-F]\{3,6\}' src/ --include='*.tsx' --include='*.ts'

# Search for raw Tailwind palette colors used semantically
grep -rn 'text-red-\|text-green-\|text-amber-\|text-blue-\|text-stone-\|text-emerald-\|text-slate-' src/ --include='*.tsx'
grep -rn 'bg-red-\|bg-green-\|bg-amber-\|bg-blue-\|bg-stone-\|bg-emerald-\|bg-slate-' src/ --include='*.tsx'
```

Any remaining matches must be justified or replaced with tokens.

#### 16.3 Component usage audit

Verify shared components are actually used everywhere intended:

| Component | Expected Usage Count | Check |
|---|---|---|
| `PageHeader` | 10+ pages | Every dashboard page, auth, booking |
| `SectionHeader` | 8+ sections | Dashboard, rates, settings |
| `StatusBadge` | 6+ pages | Dashboard, reservations, reviews, rates, portal |
| `KpiCard` | 7+ cards | Dashboard page |
| `DataTable` | 7+ tables | All tabular data pages |
| `FilterBar` | 3+ pages | Reservations, reviews, guests |
| `EmptyState` | 10+ contexts | Every table and data view |
| `FormField` | All forms | Settings, dialogs, booking, review |
| `SubmitButton` | All forms | Settings, dialogs, booking, auth |
| `StarRating` | 2 contexts | Review submission, reviews list |
| `DetailRow` | 2+ pages | Reservation detail, guest portal |

#### 16.4 Overflow and truncation audit

Check every data display for overflow behavior:

- [ ] Long guest names in tables: truncate with ellipsis + tooltip
- [ ] Long room type names: truncate with ellipsis
- [ ] Confirmation codes: never truncate (monospace, fixed width)
- [ ] Email addresses in tables: truncate with ellipsis + tooltip
- [ ] Review body text: truncate to N lines with "Show more"
- [ ] Property description: truncate to N lines in cards, full in detail
- [ ] Special requests text: wrap (never truncate user input)
- [ ] Currency amounts: never truncate, right-align
- [ ] Date values: never truncate, use `whitespace-nowrap`

Apply consistent rules:
- Table cells: `truncate` class with `max-w-[200px]` + tooltip
- Card titles: `line-clamp-1`
- Descriptions: `line-clamp-2` or `line-clamp-3`
- User-generated content: wrap, don't truncate

#### 16.5 Remove dead code

Clean up any components, utility functions, or style classes that are no longer used
after the overhaul:

- Old inline status variant maps
- Unused CSS classes
- Redundant wrapper divs
- Commented-out code from the migration

#### 16.6 Performance check

Verify that the UI overhaul hasn't introduced performance regressions:

- Bundle size: new shared components shouldn't significantly increase bundle
- Render performance: shared components with many props shouldn't cause excessive re-renders
- Font loading: ensure Playfair Display and Geist fonts load efficiently (preload, swap)
- Animation performance: verify animations use `transform` and `opacity` (GPU-accelerated)

#### 16.7 Cross-browser testing

Test in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Safari iOS (mobile)
- [ ] Chrome Android (mobile)

Verify:
- oklch colors render correctly (fallback for older browsers if needed)
- CSS custom properties work
- Animations render smoothly
- Fonts load correctly
- Dark mode works

#### 16.8 Documentation

Update project documentation:

- **CLAUDE.md:** Update project structure section with new shared components
- **README.md:** Add design system section describing the token system and shared components
- **Component files:** Each shared component has a brief JSDoc comment explaining its purpose

### Acceptance Criteria

- [ ] Every page passes the visual consistency audit
- [ ] Zero unjustified hardcoded colors remain
- [ ] All shared components are used at their expected frequency
- [ ] Overflow behavior is intentional and consistent
- [ ] No dead code from the migration
- [ ] No performance regressions
- [ ] Works across all target browsers
- [ ] Documentation updated

---

## Implementation Order & Dependencies

```
M1 (Tokens) ─────────────────────────────────────────────────────────┐
  │                                                                  │
  ├─► M2 (Primitives) ──► M5 (Dashboard Pages) ──► M10 (States)     │
  │                         │                        │               │
  │   M3 (Typography) ─────┘                        │               │
  │                                                  │               │
  │   M4 (Shell/Nav) ───────────────────────────────┘               │
  │                                                                  │
  ├─► M6 (Tables/Filters) ──► M5 (applied on pages)                 │
  │                                                                  │
  ├─► M7 (Forms) ──► M8 (Booking) ──► M9 (Auth/Portal/Review)       │
  │                                                                  │
  ├─► M11 (Accessibility) ─ can start after M5                       │
  │                                                                  │
  ├─► M12 (Responsive) ─ can start after M5                          │
  │                                                                  │
  ├─► M13 (Dark Mode) ─ requires M1 tokens defined first             │
  │                                                                  │
  ├─► M14 (Motion) ─ can run in parallel with M11–M13                │
  │                                                                  │
  ├─► M15 (Email) ─ requires M1 palette, otherwise independent       │
  │                                                                  │
  └─► M16 (Audit) ─ after all other milestones complete              │
```

### Parallelization Opportunities

These milestones can run concurrently:

- **M2 + M3 + M6 + M7**: All create shared primitives, no dependencies on each other
- **M4 (Shell) + M8 (Booking)**: Dashboard shell and booking engine are separate surfaces
- **M11 + M12 + M14**: Accessibility, responsive, and motion are cross-cutting concerns
  that can be addressed in parallel after pages are updated
- **M15 (Email)**: Independent of all other milestones except M1

### Estimated Scope Per Milestone

| Milestone | Files Touched | New Components | Complexity |
|---|---|---|---|
| M1 — Tokens | 1–3 | 1 (design-tokens.ts) | Medium |
| M2 — Primitives | 5–8 | 5–6 new components | High |
| M3 — Typography | 10–15 (all pages) | 0 | Low-Medium |
| M4 — Shell/Nav | 3–5 | 2–3 (breadcrumb, theme toggle) | Medium |
| M5 — Dashboard | 10–12 (all dashboard pages) | 0 (uses M2 primitives) | High |
| M6 — Tables/Filters | 8–10 | 3–4 (DataTable, FilterBar, cells) | High |
| M7 — Forms | 8–10 | 2–3 (FormField, SubmitButton) | Medium |
| M8 — Booking | 8–10 | 1 (step-indicator) | High |
| M9 — Auth/Portal | 5–7 | 1 (star-rating) | Medium |
| M10 — States | 10–15 | 4–5 (EmptyState, ErrorBoundary, etc.) | Medium |
| M11 — Accessibility | 15–20 (audit + fixes) | 0 | Medium |
| M12 — Responsive | 10–15 (audit + fixes) | 0 | High |
| M13 — Dark Mode | 5–10 (token fixes + testing) | 0 | Medium |
| M14 — Motion | 3–5 (globals + key components) | 0 | Low |
| M15 — Email | 5–6 | 0 | Low |
| M16 — Audit | 0–10 (fixes only) | 0 | Medium |

### Session Plan

Each session batches milestones that share context and have minimal cross-dependencies.
Start each session by confirming what was completed in the previous one.

#### Session 1 — Foundation (M1 + M2 + M3)

| Milestone | What Happens |
|---|---|
| **M1 — Tokens** | Define all CSS custom properties (semantic, booking, chart, sidebar). Create `design-tokens.ts`. Map tokens to Tailwind theme. |
| **M2 — Primitives** | Build StatusBadge, KpiCard, PageHeader, SectionHeader, DetailRow. Create `status-styles.ts`. Extend Badge variants (success/warning/info). |
| **M3 — Typography** | Define and document the type scale. Standardize spacing rhythm. Audit all pages for heading/spacing consistency. |

**Why together:** These three milestones define the vocabulary everything else consumes.
No page-level work yet — just building the toolkit. Low risk of merge conflicts since
each touches different files (globals.css, new component files, existing page class tweaks).

**Prerequisite:** Color palette must be provisioned before this session starts.

---

#### Session 2 — Infrastructure (M4 + M6 + M7)

| Milestone | What Happens |
|---|---|
| **M4 — Shell/Nav** | Redesign sidebar, add breadcrumbs, add theme toggle, refine header bar. |
| **M6 — Tables/Filters** | Build DataTable, FilterBar, table cell formatters, pagination. |
| **M7 — Forms** | Build FormField, SubmitButton. Define canonical form layout. |

**Why together:** These create the three major infrastructure patterns (navigation,
data display, data entry) that every page needs. Each is self-contained — shell touches
layout files, tables touch `components/ui/`, forms touch `components/ui/` — minimal overlap.

---

#### Session 3 — Dashboard Pages (M5)

| Milestone | What Happens |
|---|---|
| **M5 — Dashboard Pages** | Apply all primitives from Sessions 1–2 to every dashboard page: dashboard home, reservations (list + detail), guests, rates, reviews, calendar, all settings pages. |

**Why alone:** This is the highest-touch milestone — every dashboard page gets modified.
Having the full session's context for this ensures consistency across all pages. This is
where the visual transformation becomes visible.

---

#### Session 4 — Public-Facing Surfaces (M8 + M9)

| Milestone | What Happens |
|---|---|
| **M8 — Booking Engine** | Replace all hardcoded colors with booking tokens. Standardize cards, buttons, inputs, step indicator. Theme Stripe Elements. |
| **M9 — Auth/Portal/Review** | Align login, register, guest portal, review submission with the system. Extract StarRating component. Create error pages. |

**Why together:** Both milestones cover the guest-facing / public surfaces that share
the booking token set. They don't touch dashboard pages (those are done in Session 3),
so the blast radius is contained to `(booking)/`, `(auth)/`, `(review)/` routes.

---

#### Session 5 — State Treatments & Polish (M10 + M14 + M15)

| Milestone | What Happens |
|---|---|
| **M10 — States** | Build EmptyState, ErrorBoundary, inline error, toast helpers. Create loading.tsx skeletons for every route. Apply EmptyState to all 10+ data views. |
| **M14 — Motion** | Define duration/easing tokens. Standardize hover transitions. Add reduced-motion support. |
| **M15 — Email** | Update email brand constants, header/button/layout styling across all 5 templates. |

**Why together:** These are additive — they layer polish on top of the already-converted
pages without restructuring anything. States and motion are cross-cutting, emails are
independent. None conflict with each other.

---

#### Session 6 — Accessibility & Responsive (M11 + M12)

| Milestone | What Happens |
|---|---|
| **M11 — Accessibility** | Keyboard nav audit, focus rings, ARIA labels, contrast ratios, form labels, touch targets. |
| **M12 — Responsive** | Breakpoint strategy, table mobile patterns, filter collapse, calendar mobile, test at 375/768/1024/1440px. |

**Why together:** Both are audit-and-fix milestones that sweep across the entire codebase.
They don't create new components — they refine existing ones. Doing them together means
one comprehensive pass through every page rather than two.

---

#### Session 7 — Dark Mode & Final Audit (M13 + M16)

| Milestone | What Happens |
|---|---|
| **M13 — Dark Mode** | Audit all token pairings, fix dark mode issues, theme Stripe for dark, implement toggle persistence, test every surface. |
| **M16 — Final Audit** | Visual consistency sweep, hardcoded color grep, component usage audit, overflow/truncation audit, dead code removal, performance check, cross-browser testing. |

**Why together:** Dark mode is the last major feature. The final audit immediately follows
to catch anything missed across all 15 prior milestones. This session produces the
shippable result.

---

#### Session Summary

| Session | Milestones | Focus | Weight |
|---|---|---|---|
| 1 | M1 + M2 + M3 | Foundation: tokens, primitives, typography | Medium |
| 2 | M4 + M6 + M7 | Infrastructure: shell, tables, forms | Medium-High |
| 3 | M5 | Dashboard pages overhaul | High |
| 4 | M8 + M9 | Public-facing surfaces | Medium-High |
| 5 | M10 + M14 + M15 | States, motion, email | Medium |
| 6 | M11 + M12 | Accessibility + responsive | Medium-High |
| 7 | M13 + M16 | Dark mode + final audit | Medium |

---

## Files Created by This Overhaul

### New Shared Components

```
src/components/ui/
├── breadcrumb.tsx              # Breadcrumb navigation (M4)
├── data-table.tsx              # Shared table wrapper (M6)
├── detail-row.tsx              # Label-value pair display (M2)
├── empty-state.tsx             # Empty data state (M10)
├── error-boundary.tsx          # React error boundary (M10)
├── filter-bar.tsx              # Shared filter container (M6)
├── form-field.tsx              # Form field wrapper (M7)
├── inline-error.tsx            # Inline error display (M10)
├── page-header.tsx             # Page title + breadcrumbs (M2)
├── pagination.tsx              # Table pagination (M6)
├── section-header.tsx          # Section title + action (M2)
├── star-rating.tsx             # Interactive/display star rating (M9)
├── status-badge.tsx            # Status badge with style maps (M2)
├── submit-button.tsx           # Form submit with loading (M7)
├── table-cells.tsx             # Formatted table cells (M6)
└── theme-toggle.tsx            # Dark/light/system toggle (M4)
```

### New Dashboard Components

```
src/components/dashboard/
└── kpi-card.tsx                # KPI metric card (M2)
```

### New Booking Components

```
src/components/booking/
└── step-indicator.tsx          # Step progress indicator (M8)
```

### New Library Files

```
src/lib/
├── design-tokens.ts            # Token constants for JS (M1)
└── status-styles.ts            # Centralized status style maps (M2)
```

### New Loading Files

```
src/app/(dashboard)/
├── dashboard/loading.tsx       # Dashboard skeleton (M10)
├── reservations/loading.tsx    # Reservations skeleton (M10)
├── guests/loading.tsx          # Guests skeleton (M10)
├── rates/loading.tsx           # Rates skeleton (M10)
├── reviews/loading.tsx         # Reviews skeleton (M10)
├── calendar/loading.tsx        # Calendar skeleton (M10)
└── settings/
    ├── property/loading.tsx    # Property skeleton (M10)
    ├── room-types/loading.tsx  # Room types skeleton (M10)
    ├── rooms/loading.tsx       # Rooms skeleton (M10)
    └── amenities/loading.tsx   # Amenities skeleton (M10)
```

---

## Success Criteria (Full Overhaul)

When all 16 milestones are complete, the following must be true:

- [ ] **Token-driven:** Every color in the UI derives from a CSS custom property
- [ ] **Consistent primitives:** Badges, cards, tables, and filters look identical everywhere
- [ ] **Unified typography:** Every text element maps to a defined level in the type scale
- [ ] **Coherent spacing:** Page sections, card padding, and grid gaps follow one rhythm
- [ ] **Intentional shell:** Sidebar, header, and content area feel designed, not default
- [ ] **Status system:** Every status indicator uses the same visual language
- [ ] **Form system:** Every form uses the same field wrapper, validation, and submit pattern
- [ ] **Booking integration:** Guest-facing pages use tokens, not hardcoded colors
- [ ] **State coverage:** Every data view has empty, error, and loading states
- [ ] **Accessible:** WCAG AA compliance on all interactive elements
- [ ] **Responsive:** All surfaces usable at 375px width
- [ ] **Dark mode:** Fully functional with no visual artifacts
- [ ] **Motion:** Consistent, subtle, with reduced-motion support
- [ ] **Email alignment:** Templates reflect the brand palette
- [ ] **No drift:** A new page built with the shared components automatically looks right
