# M16 + M17 Summary: Property Branding & JSON-LD Structured Data

## What was built

### M16: Property Branding & Configuration

**Schema changes** (`src/db/schema.ts`, migration `0010_lush_gambit.sql`):
- Added 9 nullable columns to `properties`: `tagline`, `phone`, `email`, `logo_url`, `maps_url`, `latitude` (real), `longitude` (real), `check_in_instructions`, `website_url`

**Settings form** (`src/app/(dashboard)/settings/property-form.tsx` + `actions.ts`):
- New "Branding & Contact" card with all 9 fields
- Zod validation for email, URLs, lat/lng range (-90/90, -180/180)
- Fields persisted via `updateProperty` action

**Email templates updated**:
- `pre-arrival.tsx` — added `checkInInstructions` section (pre-formatted, appears before "How to Find Us"), `propertyPhone` in address footer
- `booking-confirmation.tsx` — added `propertyPhone` to footer alongside address

**Email senders updated** (`src/lib/email.ts`):
- `sendPreArrival` accepts `propertyPhone?` and `checkInInstructions?`
- `sendBookingConfirmation` accepts `propertyPhone?`

**Cron updated** (`src/app/api/v1/cron/daily/route.ts`):
- `sendPreArrival` now passes `property.phone` and `property.checkInInstructions`

**Booking engine** (`src/components/booking/booking-flow.tsx`):
- Header shows `property.tagline` and `property.phone` (as tel: link) when set

### M17: JSON-LD Structured Data

**New file** `src/lib/jsonld.ts`:
- `buildLodgingBusinessJsonLd(property, roomTypes, amenities, baseUrl)` — generates schema.org JSON-LD
- LodgingBusiness entity: name, url, description, image/logo, telephone, email, geo (GeoCoordinates), hasMap, checkinTime, checkoutTime, amenityFeature[]
- containsPlace: Accommodation[] — one per active room type with occupancy + Offer (price/night)

**New file** `src/app/(booking)/[propertySlug]/layout.tsx`:
- Server component layout for booking engine route
- Fetches property + active room types + unique amenities
- Injects `<script type="application/ld+json">` in `<head>` before `{children}`

## Acceptance criteria

- [x] Property settings form includes all 9 new fields with validation
- [x] Email templates use phone, check-in instructions from property record
- [x] Booking engine header shows tagline and phone
- [x] Booking engine pages include valid JSON-LD in `<head>`
- [x] LodgingBusiness with name, address, geo, amenities, price range
- [x] Accommodation entities per room type with occupancy and offers
- [x] All 57 tests passing, TypeScript strict clean

## Files changed / created

| File | Change |
|---|---|
| `docs/schema.md` | +9 columns on properties |
| `src/db/schema.ts` | +9 columns, import `real` |
| `src/db/migrations/0010_lush_gambit.sql` | Generated migration |
| `src/app/(dashboard)/settings/actions.ts` | Extended schema + DB update |
| `src/app/(dashboard)/settings/property-form.tsx` | Branding & Contact card |
| `src/components/emails/pre-arrival.tsx` | checkInInstructions + propertyPhone |
| `src/components/emails/booking-confirmation.tsx` | propertyPhone in footer |
| `src/lib/email.ts` | Extended sendPreArrival + sendBookingConfirmation params |
| `src/app/api/v1/cron/daily/route.ts` | Pass phone + checkInInstructions |
| `src/app/(booking)/[propertySlug]/actions.ts` | Pass phone to confirmation email |
| `src/components/booking/booking-flow.tsx` | Tagline + phone in header |
| `src/lib/jsonld.ts` | NEW — JSON-LD generator |
| `src/app/(booking)/[propertySlug]/layout.tsx` | NEW — inject JSON-LD |
