# Milestone 8 — Dashboard Live KPIs + Ops Dashboard

**Status:** Complete

---

## Overview

Replaced the hardcoded zero-value KPI cards on `/dashboard` with live database data and added two new sections: a revenue summary and a recent bookings table. No schema changes were required — all data comes from existing `reservations`, `inventory`, and `rooms` tables.

---

## Dashboard Query Library (`src/lib/dashboard.ts`)

New file exposing three async functions, all keyed by `propertyId` and called in parallel from the page via `Promise.all`.

### `getDashboardKPIs(propertyId)`

Fires five parallel queries:

| Metric | Query |
|---|---|
| Today's Arrivals | `COUNT(*) WHERE check_in = today AND status = 'confirmed'` |
| Today's Departures | `COUNT(*) WHERE check_out = today AND status = 'checked_in'` |
| In-House Guests | `COUNT(*) WHERE status = 'checked_in'` |
| 7-Day Occupancy | `SUM(booked_units) / SUM(total_units)` from `inventory` where `date ∈ [today, today+7)` |
| 30-Day Occupancy | `SUM(booked_units) / SUM(total_units)` from `inventory` where `date ∈ [today, today+30)` |

"Today" is `new Date().toISOString().slice(0, 10)` (UTC). The property `timezone` field is not used yet — deferred to a later milestone.

Occupancy percentages are rounded to the nearest integer. Returns `0%` if no inventory rows exist for the window.

Returns: `{ arrivals, departures, inHouse, occupancy7Days, occupancy30Days }`

### `getRecentBookings(propertyId)`

```ts
db.query.reservations.findMany({
  where: eq(reservations.propertyId, propertyId),
  with: { guest: true },
  orderBy: [desc(reservations.createdAt)],
  limit: 8,
})
```

### `getRevenueMetrics(propertyId)`

Two parallel queries summing `total_cents` from reservations where `status NOT IN ('cancelled', 'no_show')`, grouped by calendar month using `DATE_TRUNC`:

```ts
sql`DATE_TRUNC('month', ${reservations.checkIn}::timestamp) = DATE_TRUNC('month', CURRENT_DATE)`
sql`DATE_TRUNC('month', ${reservations.checkIn}::timestamp) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`
```

Returns: `{ thisMonthCents, lastMonthCents }`

---

## Dashboard Page (`src/app/(dashboard)/dashboard/page.tsx`)

Converted from a static component to an `async` server component. Resolution pattern mirrors `reservations/page.tsx`:

```ts
const [property] = await db.select().from(properties).limit(1);
const [kpis, recentBookings, revenue] = await Promise.all([...]);
```

### KPI Cards (5 cards, `lg:grid-cols-5`)

| Card | Value |
|---|---|
| Today's Arrivals | `kpis.arrivals` |
| Today's Departures | `kpis.departures` |
| In-House Guests | `kpis.inHouse` |
| 7-Day Occupancy | `kpis.occupancy7Days%` |
| 30-Day Occupancy | `kpis.occupancy30Days%` |

### Revenue Summary

Two shadcn `Card` components in a 2-column grid showing "This Month" and "Last Month" totals formatted via `Intl.NumberFormat`, excluding cancelled and no-show reservations.

### Recent Bookings Table

shadcn `Table` showing the last 8 reservations with columns: confirmation code (linked to `/reservations/[id]`), guest name + email, check-in date, check-out date, status badge, total amount. Empty state shown when no reservations exist. "View all →" link to `/reservations`.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/dashboard.ts` | **New** — KPI, recent-bookings, and revenue query functions |
| `src/app/(dashboard)/dashboard/page.tsx` | **Edit** — async server component with live data, revenue section, and recent bookings table |
