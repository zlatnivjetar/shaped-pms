# Shaped — Brand Identity

This document defines Shaped's **visual identity** — colors, type, spacing, layout, icons, motion, and UI rules.
It contains *no vision, no tone, no marketing language*. Every instruction is operational and implementation-ready.

---

## 1. Core Identity Constants

* **Essence (reference only, not for copywriting):** Calm, warm, confident.
* **Design principle:** Simple on the outside, sophisticated inside.

---

## 2. Logo System

### Wordmark

* Typeface: **Helvetica Now Display**
* Approved versions: black / white
* Clear space: **1x cap height of "S"** around all sides
* Min size: preserve internal counters; avoid micro-rendering

### Sub-brand lockups

* Format: `Shaped` (primary wordmark) + descriptor on same baseline
* Descriptor weight: lighter than the primary mark
* No additional spacing variations beyond approved lockup

### Prohibited usage

* No recoloring outside palette
* No gradients, shadows, outlines, distortions
* No adjusting character spacing or shapes

---

## 3. Color System

### Brand Palette

* **Primary Gold**: `#E2BD27`
* **Primary Gold Hover**: `#B7991F`

### Surfaces

* **Light Base**: `#FBFBF9`
* **Dark Base**: `#0B0B09`
* **Pure White (forms/cards)**: `#FFFFFF`

### Neutrals

* Ink `#11110F`
* Graphite `#222220`
* Ash `#51504D`
* Fog `#83827C`
* Stone `#ADACA8`
* Mist `#CBCAC6`
* Bone `#EFEEEC`

### Supporting

* Dividers: `#E5E3DC`
* Overlay scrim: `rgba(11,11,9,0.6)`

### Semantic (UI only)

* Success `#1C7C5C`
* Error `#A12222`
* Warning `#BD8600`

### Usage Rules

* Gold = accents + primary CTAs
* Never use gold for body text on light surfaces
* Inputs/cards remain white or light surface, never gold

---

## 4. Typography

### Roles

* **Headings (H1-H3)** -> Helvetica Now Display
* **Overline/Eyebrow (H4)** -> Helvetica Now Display, uppercase, wider tracking
* **Body/UI/Labels** -> Manrope (variable)

### Rules

* Skip H5/H6 — use body text with size/weight variations
* Numbers: tabular lining where alignment matters
* Maintain clean hierarchy:
  * H1: hero
  * H2: section
  * H3: subsection
  * H4: overline only
* No custom fonts or stylistic variants outside approved set

---

## 5. Layout & Spacing

### Grid

* **12-column** desktop grid
* Consistent gutters and margins across breakpoints
* Max content width: **1320px** unless full-bleed media

### Spacing Scale

Base unit **4px** -> 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px

### Rules

* Generous whitespace signals premium
* Left-align long-form text; center only short hero copy
* Avoid dense stacking; maintain optical breathing room

---

## 6. Iconography

* Style: outline, geometric-humanist, rounded joins
* Weight: consistent across set
* Default color: **Ink**
* Gold reserved for active/primary states
* Don't mix outline and filled styles in the same context
* Sizes: fixed increments; avoid arbitrary scaling

---

## 7. Imagery & Photography

* Real spaces, natural light, warm tones
* Subtle warm grade; avoid overly saturated or cold aesthetics
* Clean compositions with negative space
* Avoid generic stock unless abstract backgrounds

---

## 8. Shadows & Elevation

### Small (inputs, small cards)

```
0 1px 2px rgba(11,11,9,0.04),
0 1px 3px rgba(11,11,9,0.08)
```

### Medium (buttons, interactive)

```
0 2px 4px rgba(11,11,9,0.04),
0 4px 8px rgba(11,11,9,0.08),
0 1px 2px rgba(11,11,9,0.06)
```

### Large (cards)

```
0 4px 6px rgba(11,11,9,0.02),
0 10px 20px rgba(11,11,9,0.08),
0 2px 4px rgba(11,11,9,0.04)
```

### Rules

* Use elevation to clarify hierarchy, not to decorate
* Do not apply shadows to text
* Hover states: small lift + subtle brightening

---

## 9. Motion & Interaction

* Motion is **purposeful and restrained**
* Hovers: lift/brighten slightly
* Press states: compress subtly
* Focus rings: clear gold ring on interactive elements
* Respect reduced-motion settings
* No bouncy, springy, or chaotic animations

---

## 10. UI Components

### Buttons

* Primary: gold background + ink text
* Secondary: outline (Ink border)
* Tertiary: text-only
* Hover: controlled lift, not aggressive

### Inputs

* White background
* Ink text
* Gold focus ring
* Clear error and success semantic colors

### Cards

* White or Surface Light
* Light outline or small shadow
* Generous padding, clean typography

### Tables, chips, dividers

* Minimal; rely on spacing and alignment, not decoration

---

## 11. Accessibility

* WCAG AA contrast across all text/UI
* Visible focus indicators
* No color-only communication
* Semantic HTML structure

---

## 12. Assets & Delivery

* File formats: SVG (primary), PDF/EPS (print), PNG fallback
* Favicon: ICO/PNG
* Font delivery: variable Manrope + Helvetica Now Display (licensed)
* Versioning: `shaped-{asset}-{version}`
* Maintain changelog in repository

---

## 13. Design Tokens (Reference)

```json
{
  "colors": {
    "brand.primary": "#E2BD27",
    "surface.light": "#FBFBF9",
    "surface.dark": "#0B0B09",
    "text.primary": "#11110F"
  },
  "type": {
    "heading.family": "Helvetica Now Display",
    "body.family": "Manrope"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "32px",
    "xl": "64px"
  },
  "radius": {
    "sm": "4px",
    "md": "8px"
  }
}
```
