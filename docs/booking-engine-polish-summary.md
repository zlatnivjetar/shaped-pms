# Booking Engine Design Polish

**Completed:** 2026-03-09

## What Was Built

Full visual and UX polish of the public booking engine. No business logic, schema, or API changes — visual layer only.

---

## Design System Applied

| Token | Value |
|---|---|
| Background | `#F8FAFC` (booking layout) |
| Primary | `#1E3A8A` Navy — step indicator, header, section labels |
| CTA / Accent | `#CA8A04` Gold — primary action buttons, prices, discount badges |
| Heading font | Playfair Display (400/500/600/700) via `next/font/google` |
| Glass card | `bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm` |
| Motion | `transition-all duration-200`, guarded by `prefers-reduced-motion` |

---

## Phase 1 — Foundation

**File:** `src/app/(booking)/layout.tsx`

- Playfair Display imported via `next/font/google`, exposed as `--font-playfair` CSS variable on the booking layout wrapper
- Background changed from `bg-stone-50` to `bg-[#F8FAFC]`
- Removed duplicate `bg-stone-50` from `BookingFlow` outer div that was overriding the layout
- shadcn Calendar + Popover components confirmed present

---

## Phase 2 — Step Indicator + Property Header

**File:** `src/components/booking/booking-flow.tsx`

**Step indicator** replaced numbered circles with dot-line pattern:
- Completed step: gold dot with checkmark, gold connecting line
- Current step: solid navy circle
- Upcoming step: hollow circle with stone border
- Labels below each dot

**Property header:**
- City/country: `text-xs uppercase tracking-widest text-[#1E3A8A]`
- Property name: Playfair Display `text-xl font-semibold`

---

## Phase 3 — Step Search

**File:** `src/components/booking/step-search.tsx`

- Native `<input type="date">` replaced with shadcn `<Calendar>` inside `<Popover>`. Past dates disabled on check-in; dates ≤ check-in disabled on check-out. Triggers show formatted date (e.g. "Tue, 15 Apr")
- `<select>` dropdowns replaced with `[−] N adults [+]` steppers using shadcn `Button` variant="outline" size="icon". Adults min 1, children min 0, both max 10
- Form wrapped in glass card
- Search button: gold (`#CA8A04`), `h-10`

---

## Phase 4 — Step Select + Step Details + Amenity Chips

**Files:** `step-select.tsx`, `step-details.tsx`, `amenity-chip.tsx`

**Step Select:**
- Room cards: glass card treatment; blocked cards use `opacity-60` only (no grey fill)
- Discount badge: gold (`bg-amber-100 text-amber-800 rounded-full`) replacing emerald
- Total price: `text-2xl font-semibold`; per-night rate: `text-sm text-stone-400`
- Select button: gold, `h-10`
- Empty state card: glass treatment

**Amenity chips:** Pill style — `bg-slate-50 rounded-full px-2.5 py-1 text-xs`

**Step Details:**
- Booking summary bar: glass pill (`bg-white/90 backdrop-blur-sm rounded-xl shadow-sm`)
- All inputs + textarea: `bg-white` + `focus-visible:ring-[#1E3A8A]/50`
- Continue button: gold, `h-10`

---

## Phase 5 — Step Confirm + Step Complete + Reviews + Guest Portal

**Files:** `step-confirm.tsx`, `step-complete.tsx`, `booking-flow.tsx`, `manage/[confirmationCode]/page.tsx`

**Step Confirm:**
- Summary card: glass treatment
- Section labels (Stay / Guest / Price): `text-sm font-medium text-[#1E3A8A] uppercase tracking-wide`
- Trust signal below `<PaymentElement>`: Lock icon + "Secured by Stripe"
- Both payment buttons: gold, `h-10`

**Step Complete:**
- Removed green checkmark circle
- Heading: Playfair Display — `"Booking confirmed."` (period, not exclamation)
- Sub-heading: property name in Playfair, muted
- Confirmation code block: navy background, Playfair font for the code, gold `<hr>` decorations above/below
- Summary card: glass treatment
- Fade-in on mount (`opacity-0 translate-y-2` → `opacity-100 translate-y-0`), guarded by `prefers-reduced-motion`

**Reviews section (`booking-flow.tsx`):**
- Rating score: `text-5xl font-[family-name:--font-playfair] text-[#CA8A04]`
- Review cards: glass treatment
- Avatar circle: navy background

**Guest Portal (`manage/[confirmationCode]/page.tsx`):**
- Background inherits `#F8FAFC` from booking layout
- Header: city in navy `tracking-widest`, property name in Playfair
- All cards: glass treatment
- Confirmation code: Playfair font

---

## Skeleton Loaders

Implemented `useTransition` in all three forward-navigation step components. Skeleton appears immediately on button click while the server component fetch happens in the background.

| From → To | Skeleton shown |
|---|---|
| Search → Select | 2 shimmer room cards with amenity pills + price area |
| Select → Details | Shimmer summary bar + form fields + button |
| Details → Confirm | Shimmer 3-section summary card + button |

`isPending` resets automatically when navigation completes or fails. Skeletons act as fallback for cache misses.

---

## Route Prefetching

`router.prefetch()` called ahead of navigation so pages load from cache when the user clicks.

| Step | When prefetched | Notes |
|---|---|---|
| Details → Confirm | On mount | All URL params are props — no waiting needed |
| Search → Select | 300ms debounce on every valid date/guest change | Fires as user adjusts the form |
| Select → Details | On mount, for every available (non-blocked) room type | Parallel prefetch for all options |

Combined with skeleton loaders: skeletons cover slow connections / first visits; prefetch delivers instant transitions on normal connections.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/(booking)/layout.tsx` | Playfair font + `#F8FAFC` background |
| `src/components/booking/booking-flow.tsx` | Step indicator, property header, reviews section |
| `src/components/booking/step-search.tsx` | Calendar popovers, guest steppers, glass card, gold button, prefetch |
| `src/components/booking/step-select.tsx` | Glass cards, gold CTA, discount badge, amenity pills, skeleton, prefetch |
| `src/components/booking/step-details.tsx` | Glass summary bar, white inputs, navy focus rings, gold button, skeleton, prefetch |
| `src/components/booking/step-confirm.tsx` | Glass card, navy labels, trust signal, gold buttons |
| `src/components/booking/step-complete.tsx` | Playfair heading, navy code block, gold hr, glass summary, fade-in |
| `src/components/booking/amenity-chip.tsx` | Pill style |
| `src/app/(booking)/manage/[confirmationCode]/page.tsx` | Glass cards, Playfair header + code, navy city label |
