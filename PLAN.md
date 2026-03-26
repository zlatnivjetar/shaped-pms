# Performance Optimization Plan for Dashboard and Booking Flow

## Summary
- Keep the current App Router + server action model, but move high-churn reads to a hybrid pattern: server-prefetch the first screen, hydrate a client query cache, and keep later filter/month/page changes client-side.
- The current biggest issues are architectural, not raw row count: dashboard filters trigger full route navigations and full-page skeleton swaps, session/property reads are repeated across layout and pages, booking step changes re-render the whole public route, and the booking bundle eagerly pulls Stripe before payment is needed.
- `EXPLAIN` confirms the current risk profile: reservation/guest/review list queries still seq-scan in their current shape, while booking availability already uses the existing `inventory(property_id, room_type_id, date)` index correctly.
- Success for this pass means adjacent dashboard routes feel warm, filter changes never blank the UI, booking steps stay on-page until completion, and the refactor ships with the indexes/query shapes needed to hold up at production scale.

## Interfaces
- Add a scoped query layer only under dashboard and booking. New query keys:
  - `dashboard.summary`
  - `dashboard.reservations({ status, query, page, pageSize })`
  - `dashboard.guests({ query, page, pageSize })`
  - `dashboard.reviews({ status, source, page, pageSize })`
  - `dashboard.calendar({ month })`
  - `booking.availability({ slug, checkIn, checkOut, adults, children })`
- Add internal UI read endpoints only at:
  - `/api/internal/dashboard/summary`
  - `/api/internal/dashboard/reservations`
  - `/api/internal/dashboard/guests`
  - `/api/internal/dashboard/reviews`
  - `/api/internal/dashboard/calendar`
  - `/api/internal/booking/[slug]/availability`
- Default endpoint shapes:
  - List endpoints return `{ rows, totalCount, page, pageSize, hasNextPage }`
  - Reviews also return `{ averageRating, totalCount }`
  - Calendar returns `{ month, roomTypes }`
  - Booking availability returns `{ checkIn, checkOut, adults, children, roomTypes[] }`, and each room type already includes the fields needed by select/details/confirm, including amenities and rule-violation text
- Add two shared server loaders:
  - `getDashboardContext()` for request-scoped session + active property
  - `getBookingShellData(slug)` for request-scoped property shell, top reviews/review summary, and stable room-type reference data
- Do not change the public `/api/v1` contract in this pass.

## Implementation Changes
- `Foundation`: add `@tanstack/react-query` and mount a query provider only in dashboard and booking layouts. Server-prefetch and hydrate the first visible data for dashboard home, reservations, guests, reviews, calendar, and the booking landing screen. Use `staleTime` defaults of 30s for dashboard lists, 5m for stable reference data, and 15s for booking availability/calendar month data.
- `Navigation`: add a dashboard prewarmer in the authenticated shell. On idle and on sidebar hover/focus, call `router.prefetch()` plus query prefetch for `dashboard`, `reservations`, `guests`, `reviews`, and `calendar`. Skip aggressive warming when `navigator.connection.saveData` is true or the connection is slow. Rates and settings stay server-rendered in v1 but still get route prefetch and shared-context caching.
- `Dashboard filtering and pagination`: replace Link/form-driven full-route filters on reservations, guests, reviews, and calendar month navigation with client controllers that sync URL state through the native History API, not soft navigation. Use `placeholderData`, 200ms debounced search, `pageSize = 25`, next-page prefetch, inline loading indicators, and paginated queries instead of loading full tables up front.
- `Dashboard query shape`: stop using page-wide `findMany(... with: ...)` for list screens. Create list-specific queries that select only the columns actually shown. Collapse dashboard home into purpose-built aggregate loaders instead of multiple ad hoc queries plus repeated property lookups. Replace all `properties.limit(1)` reads on dashboard screens and actions with `getDashboardContext()`.
- `Booking engine`: refactor booking so step changes are client state + URL sync inside one mounted `BookingFlow`, not `router.push()` transitions that rerender the full page tree. The server page should only load the property shell once. Availability becomes a client query with debounced prefetch from the search step, stale-request cancellation, and cached reuse in select/details/confirm. Do not refetch published reviews or selected room-type data on non-search steps. Keep the final completion URL (`?step=complete&code=...`) for refresh/shareability.
- `Booking bundles`: dynamically import `StepConfirm` and the Stripe Elements stack only when the user advances to payment. Keep `StepSearch` in the initial bundle and lazy-load later steps. Prefetch the next step chunk when the current step becomes valid, but do not preload Stripe on the landing step.
- `Mutation UX`: keep server actions as the source of truth, but wrap reservation status changes, review actions, room status changes, and rate/discount CRUD in client mutations with optimistic cache updates for the visible list/detail view. After success, invalidate only the affected query keys plus dependent dashboard aggregates. Keep `revalidatePath` only for pure server-rendered routes or hard-refresh correctness.
- `Server caching`: use request `cache()` for session/property loaders and tagged cross-request caching only for stable property-scoped reference data such as room types, amenities, booking shell data, and published-review summaries. Invalidate those tags from existing settings/reviews/rates mutation paths.
- `Database`: add these indexes in the first data-layer pass:
  - `reservations(property_id, updated_at DESC)` for recent activity
  - `reservations(property_id, status, created_at DESC)` for the reservation list
  - `reviews(property_id, status, source, created_at DESC)` for reviews filtering
  - `inventory(property_id, date)` for calendar month loads across all room types
  - `rate_plans(property_id, room_type_id, status)` for booking/rates lookups
  - `discounts(property_id, status, room_type_id)` for booking/rates lookups
  Keep the existing unique `inventory(property_id, room_type_id, date)` index unchanged because booking availability already benefits from it.
- `Non-goals`: do not convert the whole dashboard to a SPA, do not change business rules or payment flows, and do not add materialized views unless post-refactor measurements still show slow dashboard aggregates.

## Test Plan
- Navigation: verify first visit after login shows hydrated content on dashboard home; hover/focus on sidebar items warms adjacent routes; navigating `dashboard -> reservations/guests/reviews/calendar` no longer shows a cold full-page skeleton on warm paths.
- Filters: verify reservation status changes, guest search, review status/source changes, and calendar month switches keep current rows/grid visible while new data loads; URL stays shareable; browser back/forward restores the correct state.
- Pagination: verify next-page prefetch works, page N stays visible during page N+1 fetch, and rapid typing does not create request storms.
- Booking: verify search -> select -> details -> confirm does not remount the whole page, availability requests are debounced and stale ones are ignored, and hard-refreshing a deep-linked step reconstructs the same state from URL + cached loaders.
- Bundle behavior: confirm Stripe/PaymentElement code is absent from the initial booking step and only loads when entering payment.
- Mutations: verify reservation status changes, review publish/hide/respond, room status changes, and rate/discount CRUD update visible UI immediately, roll back on error, and refresh dashboard aggregates correctly.
- Backend: run `npm run build`, the existing Vitest suite, and targeted `EXPLAIN ANALYZE` on the new reservation/review/guest/calendar queries to confirm the new indexes are used.

## Assumptions
- Recommended default: use a hybrid RSC + client-query approach rather than a full client rewrite or a pure-RSC-only solution.
- Preserve the current public `/api/v1` API behavior; all new read endpoints are internal UI routes.
- Preserve the current single-property dashboard behavior for now, but centralize active-property resolution so a later switch to `session.user.propertyId` is isolated.
- Defer trigram/full-text guest search and materialized views until production-like data shows the paginated query shapes still need them.
