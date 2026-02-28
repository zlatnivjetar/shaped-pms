# Milestone 9 — Dashboard Activity Feed

**Status:** Complete

---

## Overview

Upgraded the dashboard "Recent Bookings" table to a "Recent Activity" feed ordered by `updatedAt` DESC so that any status change (cancel, check-in, check-out, no-show) surfaces to the top immediately after it happens — not just new bookings ordered by creation time. Added `revalidatePath("/dashboard")` to every write path so the dashboard and KPI cards reflect reality the moment a booking or status change is saved. Also added a duplicate-send guard to `sendBookingConfirmation` so confirmation emails are never sent twice for the same reservation.

No schema changes. No new tables.

---

## Recent Activity Feed (`src/lib/dashboard.ts`)

`getRecentBookings` renamed to `getRecentActivity`. Two changes to the query:

| Before | After |
|---|---|
| `orderBy: [desc(reservations.createdAt)]` | `orderBy: [desc(reservations.updatedAt)]` |
| `limit: 8` | `limit: 10` |

Ordering by `updatedAt` means any status transition — cancel, check-in, check-out, no-show — immediately floats a reservation to the top of the feed, making it act as an activity log rather than a creation-ordered booking list.

---

## Cache Invalidation (`revalidatePath("/dashboard")`)

The dashboard is a Next.js server component. Without explicit revalidation after writes, it serves stale cached output — causing new bookings and status changes to appear invisible until a full page reload. `revalidatePath("/dashboard")` was added to every write path that mutates reservation state.

### Booking engine (`src/app/(booking)/[propertySlug]/actions.ts`)

`createReservation` now calls `revalidatePath("/dashboard")` immediately before `redirect(...)`. This ensures the new booking appears in Recent Activity and KPI counts (arrivals, occupancy) update as soon as the guest lands on the confirmation screen.

### Reservation actions (`src/app/(dashboard)/reservations/actions.ts`)

`revalidatePath("/dashboard")` added to all five status-changing actions:

| Action | Trigger |
|---|---|
| `confirmReservation` | Pending → Confirmed |
| `checkInReservation` | Confirmed → Checked In |
| `checkOutReservation` | Checked In → Checked Out |
| `cancelReservation` | Any → Cancelled |
| `markNoShow` | Any → No Show |

Every action already called `revalidatePath("/reservations")` and `revalidatePath("/reservations/[id]")` — `/dashboard` was simply missing.

---

## Duplicate-Send Guard (`src/lib/email.ts`)

`sendBookingConfirmation` now checks `email_logs` for an existing `confirmation` record for the same `reservationId` before calling `sendAndLog`. If one exists, it returns `false` immediately without sending or logging.

```ts
const existing = await db.query.emailLogs.findFirst({
  where: and(
    eq(emailLogs.reservationId, params.reservationId),
    eq(emailLogs.type, "confirmation")
  ),
});
if (existing) return false;
```

This prevents duplicate guest confirmation emails if `sendBookingConfirmation` is called more than once for the same reservation (e.g. retries, webhook double-fire).

---

## Dashboard Page (`src/app/(dashboard)/dashboard/page.tsx`)

- Import updated: `getRecentBookings` → `getRecentActivity`
- `Promise.all` call updated: `recentBookings` → `recentActivity`
- Section heading changed from `"Recent Bookings"` to `"Recent Activity"`
- Table body map and empty-state check updated to use `recentActivity`

No changes to table columns or status badge logic — the existing `STATUS_VARIANTS` map already handles all statuses including `cancelled` (destructive) and `no_show` (destructive).

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/dashboard.ts` | Rename `getRecentBookings` → `getRecentActivity`; order by `updatedAt` DESC; limit 8 → 10 |
| `src/app/(dashboard)/dashboard/page.tsx` | Update import, call site, variable name, and section heading |
| `src/app/(booking)/[propertySlug]/actions.ts` | Import `revalidatePath`; call `revalidatePath("/dashboard")` before redirect in `createReservation` |
| `src/app/(dashboard)/reservations/actions.ts` | Add `revalidatePath("/dashboard")` to `confirmReservation`, `checkInReservation`, `checkOutReservation`, `cancelReservation`, `markNoShow` |
| `src/lib/email.ts` | Import `and`, `eq` from `drizzle-orm`; add duplicate-send guard to `sendBookingConfirmation` |
