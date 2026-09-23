# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: the course instructor grading the project, and the class watching it presented.** The owner demos the explorer live on a classroom projector, then the instructor reviews the site on a laptop, reading the documentation and model-comparison pages as graded sections. Legibility at distance and a story that reads in one pass matter more than density.
- **Secondary: classmates in Separation Processes (University of Cincinnati)** exploring on their own devices, including phones, after the presentation.

## Product Purpose

An interactive explorer that puts a **tray column** and a **packed column** side by side on the *same* dilute gas absorption duty, so a student can watch the two designs size themselves differently as the duty changes. Success means a viewer leaves understanding the difference between *how much separation is needed* (stages / transfer units) and *how efficiently the hardware delivers it* (HETP / H_OG), and can see staged versus continuous contacting.

It is also an **AI project**: the process (plan → independent critique → two implementations by different models, graded by one shared physics suite) is graded alongside the tool, and is documented on the site.

## Positioning

The instructor demos slider-based tools in class and asked for something new. This one is driven by **direct manipulation**: the student drags the operating line itself on a McCabe–Thiele y–x diagram and a height probe on the column drawings. No sliders in the primary path (D-01). Both columns are drawn on one shared metre scale, so their height difference is the headline.

## Operating Context

- Six pages in `impl-a/`: Demo (`index.html`), Video, Transcript, Documentation, Model comparison, References. Root `overview.html` and `compare.html` frame the two-implementation comparison.
- `impl-b/` is ChatGPT's independent build, kept **exactly as delivered** as evidence (D-45, D-51). It is never edited.
- Deployed as a static site on Netlify; the root redirects to `impl-a/`.
- Process record lives in `docs/PLAN.md` and `docs/DECISIONS.md` (append-only).

## Capabilities and Constraints

- Static HTML/CSS/ES modules. **No framework, no build step, no runtime dependencies** (D-27). Self-hosted font files are acceptable (owner, 2026-09-23); no CDN.
- `physics.js` API is frozen (D-24) and shared with a 65-test suite (`npm test`). Renderers compute no physics.
- SVG diagrams, not canvas (D-26). Drag handles support pointer, touch and keyboard arrows (D-02).
- Exactly two categorical series, **tray** and **packed**, each keeping one validated hue across every plot (D-40). Equilibrium and operating lines use neutral ink.
- SI units only (D-05). Mole fractions (D-08).
- On-screen SO₂ model-limitation warning (D-33); standing "illustrative numbers" note (D-52).
- Author-only **FILL IN** regions on the docs/video/transcript pages stay visibly marked until the owner replaces them.

## Evidence on Hand

- Real content: worked physics, documentation prose, model-comparison measurements (65/65 tests, bit-identical across 4,837 points), references.
- No presentation video yet (placeholder), no transcript yet. Do not fabricate either.

## Product Principles

1. The picture and the numbers must never disagree; clamping happens in state, not in the view.
2. Honesty over polish: limitations, simplifications and identities are labelled as such on the page.
3. The comparison is the point: tray and packed are always shown against each other, on shared scales.
4. Direct manipulation over form-filling for the primary interaction.

## Accessibility & Inclusion

Keyboard-operable drag handles with ARIA value text; colour never the only signal (pinch state adds shape and label); both light and dark themes; reduced-motion respected; touch targets ≥ 44 px.
