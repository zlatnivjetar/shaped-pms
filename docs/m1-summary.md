# Milestone 1: Foundation + Property & Room Management

## What was built

### Database
- Added `properties`, `room_types`, and `rooms` tables with enums:
  - `property_status` (active | inactive)
  - `payment_mode` (full_at_booking | deposit_at_booking)
  - `room_type_status` (active | inactive)
  - `room_status` (available | maintenance | out_of_service)
- Migration `0000_dizzy_maginty.sql` applied to Neon
- All tables use UUID primary keys, UTC timestamps, and cascade deletes from `properties` downward

### `src/db/seed.ts`
Idempotent seed script (bails early if property already exists via `onConflictDoNothing`):
- **Property:** Preelook Apartments, Rijeka, Croatia — slug `preelook-apartments`, timezone `Europe/Zagreb`, check-in 15:00 / check-out 11:00, deposit mode 30%
- **Room types:** 4 types — Studio (€75), One-Bedroom (€105), Two-Bedroom (€150), Penthouse (€220)
- **Rooms:** 13 rooms across 5 floors — 5 studios (101–103, 201–202), 4 one-bedrooms (203, 301–303), 3 two-bedrooms (401–403), 1 penthouse (501)
- Auto-generates a random `api_key` (`sk_` + 48 hex chars) on first run

### Dashboard shell
- `src/app/(dashboard)/layout.tsx` — `SidebarProvider` wrapping `AppSidebar` + top header with `SidebarTrigger` and property name
- `src/components/dashboard/app-sidebar.tsx` — collapsible sidebar with:
  - Primary nav: Dashboard, Calendar, Reservations, Guests
  - Secondary nav: Rates, Reviews
  - Footer: Settings link
  - Active state driven by `usePathname()`

### Dashboard overview (`/dashboard`)
- Static KPI card grid: Today's Arrivals, Today's Departures, In-House Guests, Tonight's Occupancy
- All values hardcoded to `0` / `0%` — live data connected in later milestones

### Settings section (`/settings`)
- `src/app/(dashboard)/settings/layout.tsx` — shared heading + `SettingsNav` tab strip
- Sub-pages under `/settings/property`, `/settings/room-types`, `/settings/rooms`
- Root `/settings` redirects to `/settings/property`

### Property settings (`/settings/property`)
- `PropertyForm` client component — `useActionState` + `useFormStatus` (React 19)
- Four card sections: Basic Information, Location, Operations (check-in/out times, currency, timezone), Payment Settings
- `updateProperty` server action with Zod validation:
  - Slug format enforced (`/^[a-z0-9-]+$/`)
  - Currency must be a 3-letter code
  - Deposit percentage 0–100
  - Field-level errors surfaced inline, success banner on save

### Room types (`/settings/room-types`)
- Server component fetches all room types ordered by `sort_order` + `created_at`; joins `rooms` for count per type
- Table: name/slug, occupancy range, base rate (€), room count, status badge, edit/delete actions
- `CreateRoomTypeDialog` — modal form for new room types
- `EditRoomTypeDialog` — pre-populated modal for edits
- `DeleteRoomTypeButton` — immediate delete with `revalidatePath`
- `createRoomType`, `updateRoomType`, `deleteRoomType` server actions with shared Zod schema

### Rooms (`/settings/rooms`)
- Server component fetches all room types + rooms, groups rooms by type in memory
- Card per room type showing base rate, max occupancy, room count; list of rooms inside each card
- `AddRoomDialog` — modal to add a room (room number, floor, initial status)
- `RoomStatusSelect` — inline select to toggle available / maintenance / out_of_service
- `DeleteRoomButton` — removes a room; inventory sync added in Milestone 2
- Top-level `/rooms` route redirects to `/settings/rooms`

## Verified working
- Property settings editable and persisted via server action
- Room types can be created, edited, and deleted from the dashboard
- Rooms can be added, have their status changed, and be deleted
- Preelook Apartments seeded with 4 room types and 13 rooms
- Dashboard and settings shell live on Vercel at https://shaped-pms.vercel.app
