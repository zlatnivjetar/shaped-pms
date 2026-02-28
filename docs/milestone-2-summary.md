# Milestone 2: Rate Management + Availability Engine

## What was built

### Database
- Added `rate_plans` table with `rate_plan_type` enum (seasonal | length_of_stay | occupancy) and `rate_plan_status` enum (active | inactive)
- Added `inventory` table with a unique index on `(property_id, room_type_id, date)`
- Migration `0001_nosy_galactus.sql` applied to Neon
- Inventory available count defined as `total_units - booked_units - blocked_units`

### `src/lib/pricing.ts`
Pure pricing engine with no DB calls:
- `resolveRate(baseRateCents, date, ratePlans[])` — returns effective rate for a single date
- Resolution order: highest-priority matching active seasonal rate plan → base rate fallback
- Plans with `null` date boundaries or non-seasonal types are skipped (length_of_stay and occupancy plan types defined in schema but not implemented — documented with TODO)

### `src/lib/availability.ts`
Availability engine built from pure, testable layers:
- `computeNightly(nights, inventoryRows, ratePlans, baseRateCents)` — pure, no DB; resolves per-night availability and rate (rate override takes precedence over rate plans and base rate)
- `computeAvailabilityResult(nightly)` — pure; returns minimum available across all nights + night count
- `checkAvailability(propertyId, roomTypeId, checkIn, checkOut)` — DB-backed; parallel fetches inventory, active rate plans, and base rate, then delegates to pure functions
- `getAvailableRoomTypes(propertyId, checkIn, checkOut)` — returns all active room types with their availability for a date range; filters out fully booked types; used by the booking engine
- `getCalendarAvailability(propertyId, startDate, endDate)` — returns per-room-type, per-date cells for the calendar view; single parallel fetch for all room types

### `src/lib/inventory.ts`
- `upsertInventory(propertyId, roomTypeId)` — recalculates `total_units` from the live room count, upserts 365 rows in batches of 100 using `onConflictDoUpdate`; never touches `booked_units` or `blocked_units`
- Hooked into `addRoom` and `deleteRoom` server actions so inventory stays in sync whenever rooms are added or removed

### `src/db/init-inventory.ts`
- `npm run db:init-inventory` — standalone backfill script; iterates all properties + room types and upserts a full 365-day window; safe to run multiple times

### `src/db/seed.ts` (updated)
- Added seasonal rate plan seeding: 3 plans per room type (Summer 2026 at peak rate, Spring 2026, Autumn 2026); winter falls through to base rate
- Added inventory initialization inline with the seed (365 days per room type, batched)

### Rate plans dashboard (`/rates`)
- New top-level route added to sidebar secondary nav
- Server component fetches all rate plans grouped by room type, ordered by priority
- Table per room type: name, date range, rate (€/night), priority, status badge, edit/delete actions
- `CreateRatePlanDialog` — room type selector + date range + rate input (entered in euros, stored as cents) + priority + status
- `EditRatePlanDialog` — pre-populated modal; end-date validated to be ≥ start date via Zod refine
- `DeleteRatePlanButton` — immediate delete with `revalidatePath`
- `createRatePlan`, `updateRatePlan`, `deleteRatePlan` server actions with euro-to-cents conversion in the action layer

### Rate override via calendar
- `setRateOverride(propertyId, roomTypeId, date, rateCents | null)` server action — updates `inventory.rate_override_cents` for a single date; passing `null` clears the override

### Availability calendar (`/calendar`)
- New top-level route added to sidebar primary nav
- `AvailabilityCalendar` client component (`src/app/(dashboard)/rates/availability-calendar.tsx`):
  - Month-view grid: room types as rows, days as columns
  - Each cell shows available unit count + effective rate; color-coded green / amber (≤30%) / red (0%)
  - Month navigation via `router.push('/calendar?month=YYYY-MM')`
  - Click any cell → `RateOverrideDialog` to set or clear a per-date rate override
- `CalendarPage` (`/calendar`) — server component; reads `?month` search param (validated against `YYYY-MM` regex), computes month bounds, calls `getCalendarAvailability`, renders `AvailabilityCalendar`

### Navigation changes
- **Calendar** added to primary sidebar nav (was a non-functional entry in M1; now backed by a real page)
- **Rates** added to secondary sidebar nav as a standalone page (rate management previously had no dedicated route)

### Vitest tests
- `tests/pricing.test.ts` — 9 tests for `resolveRate`: base rate fallback, date boundary conditions, inactive plan ignored, unimplemented plan types ignored, priority resolution, zero-cent plan, null boundaries
- `tests/availability.test.ts` — 14 tests for `computeNightly` and `computeAvailabilityResult`: single-night, 30-night, season-boundary spans, fully booked, blocked rooms, rate override precedence, override of 0, missing inventory row, minimum-across-nights logic

## Verified working
- All 23 tests pass (`npm test`)
- Rate resolution handles priority-based overlapping plans correctly
- Rate override on a single date takes precedence over rate plans and base rate
- Availability calendar reflects seeded inventory and seasonal rate plans immediately
- Adding or removing a room updates `total_units` across the 365-day inventory window
