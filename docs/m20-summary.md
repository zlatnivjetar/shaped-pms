# Milestone 20: OTA Review Syndication

**Completed:** 2026-03-09

## What Was Built

Import and display reviews from OTA platforms (Booking.com, Google, Airbnb, TripAdvisor, Expedia) alongside direct reviews.

## Schema Changes

4 new columns + `reviewer_name` added to `reviews` table; `reservation_id`, `guest_id`, `review_token_id` made nullable to support OTA reviews without a reservation record.

```
reviews (additions)
├── source (enum: direct | booking_com | google | tripadvisor | airbnb | expedia, default 'direct')
├── external_id (varchar(255), nullable — deduplication key)
├── source_url (text, nullable — link to original OTA review)
├── source_rating_raw (real, nullable — raw scale rating, e.g. 9.2 for Booking.com)
├── reviewer_name (text, nullable — display name for OTA reviews without a guest record)
UNIQUE INDEX: (property_id, external_id)
```

Migration: `src/db/migrations/0012_yielding_vulcan.sql`

## Features Delivered

### Import (Admin Action)
- `importOtaReviews(rawJson)` server action in `src/app/(dashboard)/reviews/actions.ts`
- Accepts a JSON array; validates each row with Zod
- Deduplicates by `external_id` — skips already-imported reviews
- Rating normalization: Booking.com 0–10 → 1–5 stars; all others 1–5 passthrough
- Imported reviews default to `published` status
- Import dialog at `/reviews` — paste JSON, see import/skip counts and row-level errors

### Dashboard (`/reviews`)
- **Source filter pills**: All sources / Booking.com / Google / TripAdvisor / Airbnb / Expedia / Direct
- Source badge on each OTA review card
- Raw rating shown next to normalized stars for OTA reviews
- "View original ↗" link when `source_url` is set
- Source filter preserved when switching status tabs

### Booking Engine (`/[propertySlug]`)
- Mixed direct + OTA reviews displayed on the search step
- OTA reviews use `reviewer_name` (e.g. "Maria K.") since there is no guest record
- Source badge (e.g. "Booking.com") shown next to reviewer name

### REST API (`GET /api/v1/properties/[slug]/reviews`)
- Switched from `INNER JOIN` to `LEFT JOIN` on guests — OTA reviews now appear in API responses
- Response includes `source` and `source_url` fields
- `reviewer` field: `{ firstName, lastName }` for direct reviews, `{ name }` for OTA reviews

## Rating Normalization

| Source       | Raw scale | Normalized to 1–5     |
|--------------|-----------|------------------------|
| booking_com  | 0–10      | `round(raw / 2)`       |
| All others   | 1–5       | `round(raw)` (clamped) |

## Import JSON Format

```json
[
  {
    "reviewer_name": "Maria K.",
    "rating": 9.2,
    "title": "Wonderful stay",
    "body": "Clean rooms, great location.",
    "stay_date_start": "2025-07-10",
    "stay_date_end": "2025-07-14",
    "external_id": "bdc_123456",
    "source": "booking_com",
    "source_url": "https://www.booking.com/..."
  }
]
```

## Files Changed / Created

| File | Change |
|------|--------|
| `docs/schema.md` | Added 5 new columns + nullable FK notes |
| `src/db/schema.ts` | Added `reviewSourceEnum`, 5 new columns, made 3 FKs nullable |
| `src/db/migrations/0012_yielding_vulcan.sql` | Generated migration |
| `src/lib/reviews.ts` | Added `normalizeOtaRating()` + `SOURCE_LABELS` |
| `src/app/(dashboard)/reviews/actions.ts` | Added `importOtaReviews()` server action |
| `src/app/(dashboard)/reviews/import-reviews-dialog.tsx` | New — import UI dialog |
| `src/app/(dashboard)/reviews/page.tsx` | Source filter, import button, source badges |
| `src/components/booking/booking-flow.tsx` | OTA reviewer name + source badge in review cards |
| `src/app/api/v1/properties/[slug]/reviews/route.ts` | LEFT JOIN, added source/sourceUrl/reviewer fields |
| `docs/gap-analysis.md` | M19 marked as TODO (skipped) |

## Notes

- M19 (RoomCloud Channel Manager) was skipped and marked TODO in `docs/gap-analysis.md`
- Direct reviews are unaffected — all existing FK relationships and behavior preserved
