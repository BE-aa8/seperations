---
name: Tray vs. Packed
description: An interactive tray-versus-packed absorption column explorer, set as a high-performance operator display for a lecture hall.
colors:
  field: "#e8eaed"
  well: "#ffffff"
  inset: "#f3f4f6"
  rule: "#c4c9d0"
  rule-soft: "#e1e4e8"
  ink: "#14171b"
  ink-2: "#434952"
  ink-3: "#5f6670"
  axis: "#8a919b"
  grid: "#e6e8eb"
  tray: "#2a78d6"
  tray-ink: "#1d5fb0"
  packed: "#eb6834"
  packed-ink: "#b3461a"
  limit: "#c62828"
  limit-ink: "#a61b1b"
  limit-wash: "#fbeaea"
  caution: "#d48a00"
  caution-ink: "#7a4d00"
  caution-wash: "#fdf3dc"
  dark-field: "#121418"
  dark-well: "#1b1e23"
  dark-ink: "#eef0f3"
  dark-tray: "#3987e5"
  dark-packed: "#d95926"
typography:
  page-title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  panel-title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  readout:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  body-ui:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-read:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  tag:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  math:
    fontFamily: "STIX Two Math, Cambria Math, math"
    fontSize: "1.12em"
rounded:
  none: "0"
  control: "3px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "72px"
components:
  button:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 12px"
  button-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.well}"
    rounded: "{rounded.control}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
  field:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
  panel:
    backgroundColor: "{colors.well}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  notice-caution:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.ink}"
  notice-limit:
    backgroundColor: "{colors.limit-wash}"
    textColor: "{colors.ink}"
---

# Design System: Tray vs. Packed

## Overview

**Creative North Star: "The Operator Display in the Lecture Hall"**

The interface borrows the grammar of an ISA-101 high-performance process display, the screen a plant operator watches a real absorber on, and sets it for a projector. A neutral instrument field holds white display wells. The wells are separated by one-pixel rules, not floated as cards. Colour is withheld until it means something, so when blue, orange or red appears the eye knows exactly why.

It is dense where the student is working (the console: diagram, columns, readouts) and calm where the student is reading (the documentation wells). Numbers are the product, so every number is set in tabular figures with its unit smaller and quieter beside it. Engineering notation is typeset, never approximated: italic variables, true subscripts, MathML for display equations.

**Key Characteristics:**
- Square regions tiled with 1 px rules; only controls are softened (3 px).
- Exactly two series hues, each bound to one physical entity, plus two state colours.
- One typeface (Barlow) for everything readable; STIX Two Math only inside `<math>`.
- Readouts before prose: value large, unit small, tag above.
- No shadows, gradients, glass, or decorative motion.

## Colors

A cool neutral panel palette with two validated series hues and two reserved state colours.

### Primary (the two series)
- **Tray Blue** (#2a78d6; dark #3987e5): every tray-column mark in every plot — staircase, tray lines, tray profile, tray glyph. Text in this colour uses **Tray Ink** (#1d5fb0).
- **Packed Orange** (#eb6834; dark #d95926): every packed-column mark — bed fill, transfer-unit area, packed profile, packed glyph. Text uses **Packed Ink** (#b3461a).

### State
- **Limit Red** (#c62828): a thermodynamic pinch or an infeasible state only. Always with the limit mark and a word.
- **Caution Amber** (#d48a00, wash #fdf3dc): a stated model limitation on a preset (SO₂, ammonia). Never an error.

### Neutral
- **Instrument Field** (#e8eaed): page ground.
- **Display Well** (#ffffff): every surface that holds content.
- **Inset** (#f3f4f6): recessed areas — the parameters strip, column shells, code.
- **Rule** (#c4c9d0) / **Soft Rule** (#e1e4e8): region dividers / in-region dividers.
- **Ink** (#14171b), **Ink 2** (#434952), **Ink 3** (#5f6670): primary, secondary and tertiary text. Ink 3 still clears 4.5:1 on the field.

### Named Rules
**The Entity Rule.** Blue is tray, orange is packed, everywhere, forever. They never mean "A/B", "primary", "selected" or "link". Selection and pressed states use Ink.

**The Validated Hues Rule.** The two series hues were checked for colour-vision-deficiency separation in both themes. Do not substitute them without re-running the validator; add a darker `-ink` variant for text instead.

**The Reserved Red Rule.** Red appears only when the physics says stop.

## Typography

**Face:** Barlow (400, 400 italic, 500, 600), self-hosted, with system-ui fallback.
**Math:** STIX Two Math, loaded via `local()` first and fetched only where no system math font exists.

**Character:** A grotesk with roots in highway signage: legible at projector distance, a touch condensed so readouts and labels fit, and with true tabular figures.

### Hierarchy
- **Page title** (600, 2.25rem, −0.02em): one per page.
- **Section** (600, 1.625rem): reading-page h2 with a rule above; numbered where the text cross-references sections.
- **Panel title** (600, 1.25rem): one per console panel.
- **Readout** (600, 2.25rem, tabular): the two column heights. Unit at 1rem in Ink 3.
- **Body** (400, 1rem UI / 1.0625rem reading, 1.62 leading, 68ch measure).
- **Label** (500, 0.875rem): field labels, legend items.
- **Tag** (600, 0.75rem, 0.04em tracking, uppercase): table column headers only.

### Named Rules
**The Notation Rule.** Variables are italic, subscripts are real (`<sub>` in HTML, `baseline-shift` tspans in SVG). `N_OG` in visible text is a defect. Very small axis values factor their power of ten into the axis title ("(×10⁻⁴)", with a real superscript); `5.0e-5` on a plot is a defect.

**The Projector Rule.** Chart text never drops below 13px in SVG units (ticks 13, axis titles, marks and flags 14). The primary viewer is at the back of a lecture hall.

**The Tabular Rule.** Any number a reader compares is set with `font-variant-numeric: tabular-nums`.

## Layout

- **Page:** max 90rem, 24px side gutter (16px on phones).
- **Demo console:** a six-column grid of wells with 1px gaps showing the rule colour. The y–x diagram and the column drawing share the first row; transfer units, profile and operating point share the second. The primary plots are capped at `max(20rem, 100vh − 27rem)`, so both stay above the fold at 1440×900.
- **Responsive:** two columns from 1001 to 1180px, one column at 1000px and below. On phones the wells run edge to edge and the height readouts move above the drawing.
- **Reading pages:** a 14rem sticky contents rail beside a 60rem well, centred. Below 1000px the rail becomes a disclosure.
- **Rhythm:** a 4px base. There is more space above a heading than below it, and the calculation sheet and "What to try" sit 48px below the console.

## Elevation & Depth

Flat. There are no shadows anywhere. Depth comes from three tonal steps (field, well, inset) and from 1px rules. Focus is a 2px ink outline with a 2px offset.

**The Flat Panel Rule.** If something needs to stand forward, give it a well and a rule, not a shadow.

## Shapes

Regions are square. Controls get 3px corners. The only curves are physical: column shells (6px) and the circular drag handles.

## Components

### Buttons
- **Shape:** 3 px, 36 px tall (44 px on coarse pointers).
- **Default:** well background, rule border, ink text. Hover darkens the border to Ink 3.
- **Pressed** (`aria-pressed="true"`): ink background, well text. Used for the A ≈ 1 segmented pair.
- **Quiet:** transparent until hover (Reset).

### Fields and selects
Well background, 1px rule border, 3px corners, 36px tall. A chevron is drawn in SVG. When invalid, the border turns limit red with a 1px inset ring, and a specific error message sits below.

### Notice
One component, four meanings: info (neutral), caution (amber wash plus amber border), limit (red wash plus red border), and quiet (no box). Each notice has a drawn icon and a bold lead word. It never uses a coloured side stripe.

### Navigation
Text links in a 52px bar. The current page is marked with a 2px ink underline and `aria-current`. Below 820px the links move into a menu with a 3px ink side mark on the current page. Reading pages end with a previous/next pager.

### Drag handle (signature)
A white dot with an ink ring and an ink core, plus a 22-unit transparent hit area that grows to 30 on coarse pointers. Each handle carries an italic name tag (*y*<sub>out</sub>, *x*<sub>out</sub>) knocked out of the plot. At the pinch, it turns limit red.

### Headline readout (signature)
A series glyph plus a tag, a 2.25rem tabular value with a small unit, and a meta line. It stacks beside the column drawing.

### Range gauge
An 8px inset track with a fill to the value, a 3px ink marker, a red limit tick or dashed reference tick, and tick labels in HTML. It uses a log scale.

### Calculation sheet
Four ruled columns: Duty → Tray → Packed → Compare. Each step shows a small label, the typeset expression, and the value right-aligned. Each column's answer is double-underlined, the engineering-paper convention.

### Fill-in region
A dashed axis-colour border on the inset colour, with a "To fill in" label notched into the top edge. It marks text only the site owner can supply.

## Do's and Don'ts

### Do:
- **Do** bind every new plot mark to tray blue or packed orange by entity, and use ink for structure (equilibrium and operating lines).
- **Do** put a new figure in a well inside the console grid, not a floating card.
- **Do** set values as `value` plus a smaller Ink 3 unit, in tabular figures.
- **Do** typeset any new equation as MathML on reading pages, or as italic/`<sub>` HTML in the UI.
- **Do** pair every state colour with an icon and a word.

### Don't:
- **Don't** add shadows, gradients, glass or rounded cards. Regions are square wells.
- **Don't** use blue or orange for anything that is not a tray or a packed column. That includes links, selection and brand accents.
- **Don't** use red for a model limitation. That is amber.
- **Don't** use Unicode glyphs (▲ ⚠ ↕ ℹ) as icons. Draw them in the 1.6-stroke icon set in `js/dom.js`.
- **Don't** add a slider to the primary interaction path (D-01).
