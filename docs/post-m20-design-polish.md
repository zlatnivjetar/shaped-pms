# Post-M20: Booking Engine Visual Polish Plan

> **When to run:** After Milestone 20 is complete and all features are stable.
> **Goal:** Elevate the booking engine from functional-and-minimal to polished and memorable.

---

## Tools to Use (in order)

### 1. UI UX Pro Max
- GitHub: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- A design system generator with curated databases: 67 styles, 96 palettes, 57 font pairings, 100 industry-specific reasoning rules
- Has explicit hospitality/hotel rules in its reasoning engine
- **Run with a prompt like:**
  > "hotel booking engine, boutique apartments Croatia, Next.js Tailwind, warm minimal luxury"
- Output: style direction, color palette, font pairing, layout patterns, anti-patterns checklist

### 2. Anthropic `frontend-design` Plugin
- Skill: https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
- Takes the design system spec from step 1 and implements it with craft
- Forces bold, distinctive choices on typography, motion, spatial composition, backgrounds
- Prevents generic "AI slop" aesthetics (stock Inter font, purple gradients, etc.)

### Combined Workflow
```
UI UX Pro Max → design system spec (style + palette + fonts + effects + checklist)
    ↓
Anthropic frontend-design plugin → implements the spec with intentionality
    ↓
shadcn/ui primitives (already in use) → wired into existing booking logic (untouched)
```

---

## What to Polish (Prioritised)

| Priority | Component | Current State | Opportunity |
|----------|-----------|--------------|-------------|
| 1 | `step-select.tsx` | Functional but dense | Visual breathing room, imagery, clearer pricing hierarchy |
| 2 | `step-complete.tsx` | Checkmark + monospace code | Celebratory, memorable — motion, special layout |
| 3 | `step-search.tsx` | Plain form | First impression — hero area, distinctive date picker |
| 4 | `step-confirm.tsx` | Bare Stripe Elements | Trust signals: card logos, security copy |
| 5 | `booking-flow.tsx` | Numbered circles step indicator | More elegant progress indicator |
| 6 | Review display | Text-heavy | Large rating score, compact visual cards |
| 7 | `step-details.tsx` | Already solid | Minimal changes needed |

**Non-visual but part of the same pass:**
- Replace native `<input type="date">` with a proper calendar component (`react-day-picker` or shadcn Calendar)
- Add payment method icons (Visa, Mastercard, etc.) to the payment screen

---

## Files to Modify (Visual Layer Only)

```
src/components/booking/step-search.tsx
src/components/booking/step-select.tsx
src/components/booking/step-details.tsx
src/components/booking/step-confirm.tsx
src/components/booking/step-complete.tsx
src/components/booking/booking-flow.tsx     ← step indicator + layout shell
src/components/booking/amenity-chip.tsx
src/app/(booking)/layout.tsx               ← background, global font import
src/app/(booking)/[propertySlug]/page.tsx  ← review card layout
```

**Do NOT touch (business logic — must remain stable):**
```
src/app/(booking)/[propertySlug]/actions.ts
src/lib/availability.ts
src/lib/pricing.ts
src/lib/payments.ts
src/db/
```

---

## Verification Checklist

- [ ] Walk the full 5-step booking flow end-to-end with Stripe test card `4242 4242 4242 4242`
- [ ] Confirm Stripe payment intent is created and captured correctly
- [ ] Check mobile layout at 375px width (Chrome DevTools)
- [ ] Run `pnpm test` — all pricing/availability tests must remain green
- [ ] Check guest portal at `/manage/[confirmationCode]` renders correctly
- [ ] Check confirmation email still sends (Resend)
- [ ] Verify amenity chips still display correctly on room type cards
