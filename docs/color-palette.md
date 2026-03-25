# Color Palette — Shaped PMS

Derived from the Shaped Brand Identity. All values are hex.
Dark mode counterparts will be defined in Session 7 (M13).

## Brand

- **Primary:** #E2BD27 (Shaped Gold — accents, primary CTAs, active states)
- **Primary Foreground:** #11110F (Ink — text on gold backgrounds)
- **Primary Hover:** #B7991F (darkened gold for hover states)

## Surfaces

- **Background:** #FBFBF9 (Light Base — page background)
- **Foreground:** #11110F (Ink — default text)
- **Card:** #FFFFFF (Pure White — card/panel surfaces)
- **Card Foreground:** #11110F (Ink — text on cards)
- **Popover:** #FFFFFF
- **Popover Foreground:** #11110F

## Neutrals (reference ramp)

| Name     | Hex       | Usage |
|----------|-----------|-------|
| Ink      | #11110F   | Primary text, headings |
| Graphite | #222220   | Heavy UI text, active nav |
| Ash      | #51504D   | Secondary text, descriptions |
| Fog      | #83827C   | Tertiary text, timestamps, placeholders |
| Stone    | #ADACA8   | Disabled text, inactive icons |
| Mist     | #CBCAC6   | Subtle borders, dividers |
| Bone     | #EFEEEC   | Muted backgrounds, hover fills |
| Dividers | #E5E3DC   | Card borders, table borders, separators |

## Semantic Tokens

- **Muted:** #EFEEEC (Bone — inactive tabs, secondary surfaces, table header bg)
- **Muted Foreground:** #51504D (Ash — descriptions, labels, captions)
- **Accent:** #EFEEEC (Bone — hover backgrounds, highlighted rows)
- **Accent Foreground:** #11110F (Ink)
- **Secondary:** #EFEEEC (Bone — secondary buttons, checked-out badges)
- **Secondary Foreground:** #222220 (Graphite)
- **Border:** #E5E3DC (Dividers)
- **Input:** #E5E3DC (Dividers — input field borders)
- **Ring:** #E2BD27 (Gold — focus rings per brand identity)

## Status Colors

- **Destructive:** #A12222 (Error — cancel, delete, no-show, failed)
- **Destructive Foreground:** #FFFFFF
- **Success:** #1C7C5C (Confirmed, positive deltas, available)
- **Success Foreground:** #FFFFFF
- **Warning:** #BD8600 (Pending, caution, low availability)
- **Warning Foreground:** #FFFFFF
- **Info:** #2563A0 (Informational, scheduled actions, tips)
- **Info Foreground:** #FFFFFF

## Booking Engine (Guest-Facing)

Unified under Shaped palette — no separate booking colors.

- **Booking Background:** #FBFBF9 (same as Background)
- **Booking Accent:** #11110F (Ink — headings, step indicators)
- **Booking Accent Foreground:** #FFFFFF
- **Booking CTA:** #E2BD27 (Gold — search/select/pay buttons)
- **Booking CTA Foreground:** #11110F (Ink — text on gold)
- **Booking Card:** #FFFFFF (Pure White)
- **Booking Muted:** #51504D (Ash — secondary text)

## Sidebar (Light Mode)

- **Sidebar:** #FBFBF9 (Light Base — matches page background)
- **Sidebar Foreground:** #11110F (Ink)
- **Sidebar Primary:** #E2BD27 (Gold — active nav indicator)
- **Sidebar Primary Foreground:** #11110F (Ink)
- **Sidebar Accent:** #EFEEEC (Bone — hover state)
- **Sidebar Accent Foreground:** #11110F (Ink)
- **Sidebar Border:** #E5E3DC (Dividers)
- **Sidebar Ring:** #E2BD27 (Gold)

## Charts

Derived from the warm palette. Ordered for maximum distinguishability.
Avoids overlap with semantic colors (success green, error red, warning amber).

- **Chart 1:** #E2BD27 (Gold — primary data series)
- **Chart 2:** #2563A0 (Info Blue — secondary series)
- **Chart 3:** #1C7C5C (Teal Green — tertiary series)
- **Chart 4:** #A15B22 (Warm Copper — quaternary series)
- **Chart 5:** #7C5DA0 (Muted Violet — quinary series)

## Special

- **Rating Star:** #E2BD27 (Gold)

## Shadows (from Brand Identity)

```css
/* Small — inputs, small cards */
--shadow-sm: 0 1px 2px rgba(11,11,9,0.04), 0 1px 3px rgba(11,11,9,0.08);

/* Medium — buttons, interactive elements */
--shadow-md: 0 2px 4px rgba(11,11,9,0.04), 0 4px 8px rgba(11,11,9,0.08), 0 1px 2px rgba(11,11,9,0.06);

/* Large — cards, elevated panels */
--shadow-lg: 0 4px 6px rgba(11,11,9,0.02), 0 10px 20px rgba(11,11,9,0.08), 0 2px 4px rgba(11,11,9,0.04);
```

## Radius (from Brand Identity)

- **Small:** 4px (inputs, badges, chips)
- **Medium:** 8px (cards, buttons, dialogs)

## Typography

- **Body / UI / Labels:** Manrope (variable, Google Fonts)
- **Headings:** Manrope (bold/semibold weight — Helvetica Now Display deferred until licensed)
- **Monospace:** Geist Mono (confirmation codes, slugs)

## Dark Mode

Deferred to Session 7 (M13). Will be defined after all surfaces use tokens.
