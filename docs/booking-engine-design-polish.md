# Booking Engine Design Polish

> **Status:** Ready to implement
> **Scope:** Visual layer only — no business logic changes

---

## Design System

| Token | Value | Notes |
|---|---|---|
| **Pattern** | Minimal Single Column | Single CTA, large type, whitespace, mobile-first |
| **Style** | Soft Glass | `backdrop-filter: blur(8px)` + `bg-white/90` on cards only — no morphing/chromatic aberration |
| **Primary** | `#1E3A8A` Navy | Step indicator, header, section labels |
| **CTA / Accent** | `#CA8A04` Gold | Primary action buttons, prices, discount badges, star ratings |
| **Background** | `#F8FAFC` | Replace current `bg-stone-50` |
| **Heading font** | Playfair Display (400/500/600/700) | Property name, step headings, confirmation code |
| **Body font** | Inter (keep existing) | Forms, labels, body copy |
| **Glass card** | `bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm` | Reusable class combo for all card surfaces |
| **Motion** | `transition-all duration-200` | Micro-interactions only. No infinite/decorative loops |
| **Reduced motion** | Required | Guard all animations with `prefers-reduced-motion` |

### Font Import

Add to `src/app/(booking)/layout.tsx` via `next/font/google`:

```ts
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});
```

Apply `playfair.variable` to the booking layout wrapper, then use `font-[family-name:--font-playfair]` (Tailwind 4 syntax) for headings. Keep it scoped to the booking engine — the dashboard doesn't need it.

---

## Anti-Patterns to Avoid

- No iridescent gradients, morphing shapes, or chromatic aberration
- No infinite/bounce animations on decorative elements
- No placeholder-only inputs — all inputs must have visible labels
- No `<select>` dropdowns where a stepper or calendar is more appropriate
- Only primary CTAs get gold (`bg-[#CA8A04]`); back/secondary actions stay `stone`
- No inline SVGs for card brand logos — a simple `Lock` icon + "Secured by Stripe" text is sufficient

---

## Files to Modify

```
src/app/(booking)/layout.tsx                  ← font import + background colour
src/components/booking/booking-flow.tsx       ← step indicator + property header + review cards
src/components/booking/step-search.tsx        ← shadcn Calendar + guest steppers + card wrap
src/components/booking/step-select.tsx        ← glass cards + gold CTA + price hierarchy
src/components/booking/step-details.tsx       ← summary bar + focus rings
src/components/booking/step-confirm.tsx       ← glass card + trust signal + gold button
src/components/booking/step-complete.tsx      ← Playfair heading + navy/gold code block + fade-in
src/components/booking/amenity-chip.tsx       ← pill background
src/app/(booking)/manage/[confirmationCode]/page.tsx  ← glass card treatment for consistency
```

**Do NOT touch:**
```
src/app/(booking)/[propertySlug]/actions.ts
src/lib/availability.ts
src/lib/pricing.ts
src/lib/payments.ts
src/db/
```

---

## Phase-by-Phase Implementation

Phases follow the booking flow order (search → select → details → confirm → complete) so each phase can be tested by walking through the flow up to that point.

### Phase 1 — Foundation (Font + Tokens + Dependencies)
**Files:** `src/app/(booking)/layout.tsx`
**Installs:** `npx shadcn@latest add calendar popover` (adds react-day-picker + Calendar + Popover)

1. Add `Playfair_Display` via `next/font/google` in the **booking layout** (not root layout — keep dashboard unaffected)
2. Expose as CSS var `--font-playfair` on the booking layout wrapper
3. Update booking layout background from `bg-stone-50` to `bg-[#F8FAFC]`
4. Install shadcn Calendar + Popover components (needed by Phase 3)

**Verify:** Booking engine loads, background is slightly bluer, no visual regressions. Font var exists in DevTools.

---

### Phase 2 — Step Indicator + Property Header
**File:** `src/components/booking/booking-flow.tsx`

**Step indicator** — replace numbered circles with dot-line pattern:
- Thin `h-px bg-[#1E3A8A]` connecting line between dots
- Completed step: small gold dot with checkmark
- Current step: filled navy circle (no number)
- Upcoming step: hollow circle `border-2 border-stone-300`
- Label below each dot (keep existing `STEP_LABELS`)

**Property header:**
- Property name: `font-[family-name:--font-playfair] text-xl font-semibold`
- City/country: `text-xs uppercase tracking-widest text-[#1E3A8A]`
- Phone: keep as-is

**Verify:** Navigate through all 4 visible steps — indicator updates correctly, labels readable, header styled.

---

### Phase 3 — Step Search (Calendar + Steppers)
**File:** `src/components/booking/step-search.tsx`

This is the biggest change — replacing native inputs with richer UI components.

**Date pickers** — replace both `<input type="date">` with shadcn Calendar in a Popover:
- Trigger: styled button showing formatted date (e.g. "Tue, 15 Apr")
- Calendar: shadcn `<Calendar>` component (uses `react-day-picker` internally)
- Disable past dates. Check-out calendar disables dates ≤ check-in
- Keep all existing date validation logic unchanged — only the input mechanism changes

**Guest count** — replace both `<select>` with stepper buttons:
```
[−]  2 adults  [+]
[−]  0 children  [+]
```
- Use shadcn `Button` variant="outline", size="icon" for +/−
- Min: adults=1, children=0. Max: adults=10, children=10
- Disable −/+ at min/max bounds

**Wrap form** in glass card: `bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6`

**Search button:** gold `bg-[#CA8A04] hover:bg-amber-700 text-white`

**Verify:** Select dates via calendar popovers, adjust guest counts with steppers, search produces results. Test mobile — popovers don't overflow viewport.

---

### Phase 4 — Step Select + Step Details + Amenity Chips
**Files:** `step-select.tsx`, `step-details.tsx`, `amenity-chip.tsx`

**Step Select — Room type cards:**
- Replace `border border-stone-200` with glass card treatment
- Unavailable/blocked cards: `opacity-60` only (remove `bg-stone-50`)
- Total price: `text-2xl font-semibold text-stone-900`
- Per-night rate: `text-sm text-stone-400`
- Discount badge: `bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs font-medium` (gold, not emerald)
- CTA button: `bg-[#CA8A04] hover:bg-amber-700 text-white`

**Amenity chips** (`amenity-chip.tsx`):
- Pill style: `bg-slate-50 rounded-full px-2.5 py-1` with `text-xs`

**Step Details:**
- Booking summary bar: glass pill `bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4`
- Input focus rings: `focus-visible:ring-[#1E3A8A]`
- Continue button: stays stone (secondary action — not a purchase CTA)

**Verify:** Select a room, see glass cards with gold pricing and amenity pills. Fill in guest details, see summary bar + navy focus rings.

---

### Phase 5 — Step Confirm + Step Complete + Reviews + Guest Portal
**Files:** `step-confirm.tsx`, `step-complete.tsx`, `booking-flow.tsx` (reviews), `manage/[confirmationCode]/page.tsx`

**Step Confirm:**
- Summary card: glass card treatment
- Section labels ("Stay", "Guest", "Price"): `text-sm font-medium text-[#1E3A8A] uppercase tracking-wide`
- "Proceed to payment" button: gold
- Trust signal below `<PaymentElement>`: `Lock` icon (from Phosphor, already installed) + `"Secured by Stripe"` in `text-xs text-stone-400`

**Step Complete:**
- Remove green checkmark circle
- Heading: `font-[family-name:--font-playfair] text-2xl` — `"Booking confirmed."` (period, not exclamation)
- Sub-heading: property name in Playfair, muted
- Confirmation code block: navy bg, Playfair font for the code, gold `<hr>` decorations above/below
- Summary card: glass treatment
- Fade-in on mount: start `opacity-0 translate-y-2`, transition to `opacity-100 translate-y-0`
  - Guard: `prefers-reduced-motion: reduce` → skip animation (start fully visible)

**Reviews section** (in `booking-flow.tsx`):
- Rating score: `text-5xl font-[family-name:--font-playfair] text-[#CA8A04]` (e.g. "4.8")
- Stars + review count below score
- Review cards: glass treatment, avatar circle with navy bg

**Guest Portal** (`manage/[confirmationCode]/page.tsx`):
- Apply same glass card treatment to booking summary card
- Confirmation code: Playfair font
- Keep cancel button red (it's a destructive action, not a CTA)

**Verify:** Full end-to-end flow with Stripe test card `4242 4242 4242 4242`. Check confirmation page fade-in. Visit guest portal — consistent styling.

---

## Verification Checklist

After all 5 phases:

- [ ] Walk full 5-step booking flow end-to-end with Stripe test card `4242 4242 4242 4242`
- [ ] Stripe payment intent created and captured correctly
- [ ] Mobile layout at 375px — no horizontal scroll, popovers contained
- [ ] `npm test` — all pricing/availability tests green (no logic changed)
- [ ] Guest portal at `/manage/[confirmationCode]` styled consistently
- [ ] Confirmation email still sends (check Resend dashboard)
- [ ] Amenity chips render as pills on room type cards
- [ ] All inputs have visible labels (no placeholder-only)
- [ ] Calendar popovers: past dates disabled, check-out ≤ check-in disabled
- [ ] Guest steppers respect min/max bounds
- [ ] `prefers-reduced-motion` respected on Step Complete fade-in
- [ ] Text contrast ≥ 4.5:1 on glass cards (white/90 bg is sufficient)
- [ ] Gold CTA buttons only on primary actions (search, select room, proceed to payment)
- [ ] Secondary actions (back, continue to details) remain stone/neutral
