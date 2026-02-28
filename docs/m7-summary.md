# Milestone 7 — Amenities & Room Details

**Status:** Complete

---

## Schema (`src/db/schema.ts` → migration `0005`)

- `amenities` — per-property amenity registry: `id`, `property_id`, `name`, `slug`, `icon` (Phosphor icon name, default `"tag"`), `sort_order`, `created_at`, `updated_at`; UNIQUE on `(property_id, slug)`
- `roomTypeAmenities` — junction table linking room types to amenities: composite PK on `(room_type_id, amenity_id)`, cascade deletes on both FKs
- Extended `propertiesRelations` with `amenities: many(amenities)`
- Extended `roomTypesRelations` with `amenityLinks: many(roomTypeAmenities)`
- Added `amenitiesRelations` and `roomTypeAmenitiesRelations` for `.with()` query support
- Exported types: `Amenity`, `NewAmenity`, `RoomTypeAmenity`, `NewRoomTypeAmenity`

---

## Amenities Settings Page (`/settings/amenities`)

**`src/app/(dashboard)/settings/amenities/actions.ts`**

- `createAmenity` — validates with Zod, inserts row, wraps in try/catch to return a user-friendly message on slug conflict; revalidates `/settings/amenities` and `/settings/room-types`
- `updateAmenity(amenityId, ...)` — bound server action, validates and updates; revalidates both paths (critical: ensures newly created amenities appear in the room-type assignment dialog immediately)
- `deleteAmenity(amenityId)` — deletes row; revalidates both paths
- `AmenityFormState` type: `{ success?, error?, fieldErrors? }`
- Zod schema enforces: name non-empty, slug `^[a-z0-9-]+$`, icon non-empty, sortOrder non-negative integer

**`src/app/(dashboard)/settings/amenities/amenity-form.tsx`**

- Client form using `useActionState<AmenityFormState, FormData>` + `useFormStatus`
- Name field auto-generates slug on change (kebab-case, strips non-alphanumeric) when creating a new amenity; slug field is free-form when editing
- Fields: Name, Slug, Icon (Phosphor kebab-case name), Sort Order
- Per-field error display via `FieldError` component

**`src/app/(dashboard)/settings/amenities/amenity-dialogs.tsx`**

- `CreateAmenityDialog` — dialog with `AmenityForm` (no amenity prop); closes on `state.success`
- `EditAmenityDialog` — dialog with `AmenityForm` pre-populated from the existing `Amenity` row
- `DeleteAmenityButton` — calls `deleteAmenity` via `startTransition`, shows spinner while pending

**`src/app/(dashboard)/settings/amenities/page.tsx`**

- Server component; queries amenities ordered by `sort_order` then `created_at`
- Table columns: Name, Icon (shown as `<code>`), Slug, Sort, Actions (Edit + Delete)
- Empty state prompt when no amenities exist

**`src/app/(dashboard)/settings/settings-nav.tsx`**

- Added `{ label: "Amenities", href: "/settings/amenities" }` as the 4th settings tab

---

## Room Type Amenity Assignment

**`src/app/(dashboard)/room-types/actions.ts`**

- `updateRoomTypeAmenities(roomTypeId, prevState, formData)` — bound server action; deletes all existing assignments for the room type, then batch-inserts new ones from `formData.getAll("amenityIds")`; revalidates `/settings/room-types`
- `AmenityAssignState` type: `{ success?, error? }`

**`src/app/(dashboard)/room-types/room-type-dialogs.tsx`**

- `ManageAmenitiesDialog` — outer component with open/close state
- `ManageAmenitiesForm` — inner client component using `useActionState`; renders a checkbox grid of all property amenities with current assignments pre-checked; calls `onSuccess()` (closes dialog) on save
- `SaveAmenitiesButton` — uses `useFormStatus` to show "Saving…" while pending
- Checkbox pattern: `<input type="checkbox" name="amenityIds" value={amenity.id} defaultChecked={...} />`

**`src/app/(dashboard)/settings/room-types/page.tsx`**

- Fetches `allAmenities` and all `roomTypeAmenities` assignments in parallel
- Builds `Map<roomTypeId, string[]>` of current amenity IDs per room type
- Renders `<ManageAmenitiesDialog>` as the first action button on each room type row

---

## Booking Engine — Amenity Chips

**`src/components/booking/amenity-chip.tsx`**

- `AmenityChip({ icon, name })` — resolves `icon` (Phosphor kebab-case slug) against `ICON_MAP`; falls back to `CircleDashed` for unknown names
- `ICON_MAP` — 88-entry `Record<string, Icon>` covering all 81 registry icons plus legacy Lucide aliases (`tag`, `car`, `home`, `wind`, `utensils`, `wifi`, `tv`) for backwards compatibility

**`src/components/booking/step-select.tsx`**

- Added `amenitiesByRoomType: Record<string, AmenityInfo[]>` prop
- Renders a wrapping flex row of `<AmenityChip>` components below the occupancy/availability line on each room card, hidden when a room type has no amenities assigned

**`src/components/booking/booking-flow.tsx`**

- Added `amenitiesByRoomType` to `Props` interface and passes it down to `<StepSelect>`

**`src/app/(booking)/[propertySlug]/page.tsx`**

- On the select step, queries `roomTypeAmenities` for all displayed room type IDs using `inArray`, builds `amenitiesByRoomType` record, passes it to `<BookingFlow>`

---

## Icon Pack — Phosphor Icons

Replaced Lucide with `@phosphor-icons/react` (v2.1.10) as the icon library for amenity display.

- All icons are rendered with `size={14} weight="regular"`
- `ICON_MAP` uses kebab-case keys matching the `icon` column value in the DB
- 9 Phosphor substitutes used for icon names that don't exist in the package:

| DB icon name | Phosphor component used |
|---|---|
| `hand-towel` | `Towel` |
| `dumbbell` | `Barbell` |
| `spa` | `Flower` |
| `restaurant` | `ForkKnife` |
| `drops` | `Drop` |
| `archive-box` | `Archive` |
| `cocktail` | `Wine` |
| `pillows` | `CircleDashed` |
| `fridge` | `Package` |

---

## Seed Data

**`src/db/seed-amenities-registry.ts`**

- Seeds 81 amenities from the full registry (ordered by `sort_order` 1–81) without any room type assignments
- Uses `onConflictDoUpdate` on `(property_id, slug)` — safe to re-run; updates `name`, `icon`, `sort_order` on conflict
- `npm run db:seed-amenities-registry` added to `package.json`

**`src/db/seed-amenities.ts`**

- Standalone idempotent script (skips if amenities already exist) that seeds the original 8 amenities + 25 room type assignments for existing properties
- `npm run db:seed-amenities` added to `package.json`

**`src/db/seed.ts`**

- Added amenity seeding block: 8 amenities + 25 room type assignments inserted as part of the main property seed

**`src/db/fix-legacy-icons.ts`**

- One-time fix script for the 4 amenities inserted by the old seed with Lucide icon names not present in the registry (different slugs, so `onConflictDoUpdate` didn't reach them)
- Updates `kitchen → cooking-pot`, `parking → car-simple`, `balcony → buildings`, `washing-machine → washing-machine`
- `npm run db:fix-legacy-icons` added to `package.json`

---

## Bug Fixes During Development

**Cross-route cache invalidation** — `createAmenity` and `updateAmenity` initially only called `revalidatePath("/settings/amenities")`. The room-types settings page served a stale cached response, so newly created amenities didn't appear in the assignment dialog until a hard refresh. Fixed by also calling `revalidatePath("/settings/room-types")` in both actions.

**Vercel `prefer-const` lint error** — `amenitiesByRoomType` was declared with `let` but never reassigned (only mutated via index assignment). Fixed to `const`.

**Legacy icon names not rendering** — The original seed used Lucide icon names (`utensils`, `car`, `home`, `wind`) for 4 amenity slugs that had no match in the registry. Fixed in two layers: the `fix-legacy-icons` script updates the DB records, and `ICON_MAP` now includes Lucide aliases as a safety net for any future stragglers.
