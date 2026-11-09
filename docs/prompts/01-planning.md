# 01 — The planning prompt

**Round:** 1, planning
**Sent to:** Claude Opus 5, via Claude Code
**Date:** 2026-09-21
**Produced:** `docs/PLAN.md` v1.0

This is the project's originating brief, written by the project owner and
reproduced verbatim. It is the single most load-bearing prompt in the project:
everything downstream — the critique, both implementations, the test suite — is
a response to what this specified.

Worth noting what it does that most prompts do not: it states the constraint
*and the reason for it* ("my professor usually demos slider-based HTML tools in
class, and he explicitly wants something new"), it gives the physics as
equations rather than as a description, it asks for verification up front, and
it asks to be questioned before work begins.

---

```
I'm building an interactive educational website for my chemical engineering
Separation Processes course (University of Cincinnati). It's an "AI Project" for
the class, so the process matters as much as the product. Before writing any
code, I want a thorough, phased implementation plan that I'll review, have a
DIFFERENT AI model critique, and then implement with at least two different AI
models to compare results. Write the plan so it is self-contained and
model-agnostic, so another model can read it cold and critique or implement it.

== CONCEPT ==
A click-and-drag site comparing a TRAY column and a PACKED column doing the SAME
dilute gas absorption job at the SAME gas and liquid flow rates. The user sees
how the two designs size differently for identical process conditions. My
professor usually demos slider-based HTML tools in class, and he explicitly
wants something new, so the core interactions must be direct manipulation
(dragging things on diagrams and columns), NOT sliders. Numeric inputs for
secondary parameters are fine.

== CORE MECHANIC (MVP) ==
One central y–x diagram shared by both columns:
- Straight equilibrium line y = m·x (dilute, isothermal absorption).
- A straight operating line whose endpoints the user DRAGS:
  - Top of column (lean end): fixed at x_in (entering liquid), with the user
    dragging y_out vertically (sets the separation spec).
  - Bottom of column (rich end): fixed at y_in (entering gas), with the user
    dragging x_out horizontally (sets L/V).
- The operating line must never cross the equilibrium line. At the pinch, clamp
  it and visually flag minimum L/V.
- As the user drags, BOTH columns update live, side by side:
  - LEFT: tray column. McCabe-Thiele staircase stepped off on the diagram. The
    physical column drawing adds/removes trays. Show theoretical stages N,
    actual trays = ceil(N / E_o), and column height.
  - RIGHT: packed column. Show the NTU as the shaded area under 1/(y − y*) vs y
    (small secondary plot). The physical column drawing grows/shrinks its packed
    height. Show N_OG, H_OG, and packed height Z.
- A "height probe": the user drags a marker up/down the columns and sees the
  local gas composition. Tray column = discrete jumps per tray; packed column =
  smooth continuous profile. A small composition-vs-height plot overlays both
  curves.
- A summary panel comparing the two: height, N vs N_OG, HETP, and a check that
  N_theoretical × HETP equals Z_packed.

== PHYSICS (dilute, straight lines — must be exact and verifiable) ==
Absorption factor: A = L / (m·V). Handle A = 1 as a special case everywhere.
Operating line: y = (L/V)(x − x_in) + y_out.
Kremser (theoretical stages):
  N = ln[ (1 − 1/A)·(y_in − m·x_in)/(y_out − m·x_in) + 1/A ] / ln(A)
  A = 1:  N = (y_in − y_out)/(y_out − m·x_in)
Packed column (Colburn):
  N_OG = ln[ (1 − 1/A)·(y_in − m·x_in)/(y_out − m·x_in) + 1/A ] / (1 − 1/A)
  A = 1:  N_OG = (y_in − y_out)/(y_out − m·x_in)
  Z = H_OG · N_OG
Link between them:
  HETP = H_OG · ln(1/A) / (1/A − 1)   (HETP = H_OG when A = 1)
Tray column height = actual trays × tray spacing + top/bottom disengaging
allowance.
The McCabe-Thiele staircase stepped numerically on the diagram must agree with
Kremser (fractional last stage). The numerically integrated NTU area must agree
with the analytic N_OG.
Inputs the user can edit (numeric fields or a settings drawer): m, V, L-related
defaults, y_in, x_in, tray efficiency E_o, tray spacing, and packing choice.
Each packing type (e.g., Raschig rings, Pall rings, structured packing) maps to
an H_OG value. Propose realistic default values for a dilute absorption example,
and FLAG every default as "verify against Seader Ch. 6" in the plan so I can
check them against my textbook.

== TECH CONSTRAINTS ==
- Static site deployed on Netlify (I already know Netlify). Plain
  HTML/CSS/JavaScript, no framework, no build step. SVG for diagrams and
  columns, Pointer Events for dragging (must work with mouse AND touch).
- Keep physics in a pure JS module with no DOM access, separate from rendering
  and interaction code.
- Unit tests for the physics module using Node's built-in test runner (no
  dependencies). At minimum test: Kremser vs stepped-staircase agreement,
  analytic vs numerically integrated N_OG, the HETP identity, the A = 1 special
  cases, and pinch clamping.
- Responsive layout (desktop-first, usable on a phone). Light/dark friendly.

== REQUIRED SITE SECTIONS (from the assignment) ==
1. The interactive demo (home page).
2. An embedded YouTube video of my presentation (placeholder for now).
3. A viewable section containing the verbatim YouTube auto-generated transcript
   (placeholder for now).
4. Documentation: overview; clearly framed as an AI project exploring AI
   capabilities; the process (AI models, tools, prompts used); planning and
   iteration steps where I guided the AI and why; key technical content (the
   physics above, staged vs continuous contacting, when to choose trays vs
   packing); what I learned and want to learn next.
5. Model comparison: which model made the plan, which critiqued it, what
   critique points I accepted/rejected and why, and how the two implementations
   compared.
6. Attribution/references and contributions.
Design these as pages or sections that are easy for me to fill in with my own
text later.

== EXTENSIBILITY ==
I'll add features in later implementation rounds. Design the architecture so
these can be added without rewrites, and list them as a "Future phases" backlog
in the plan (do not build them now):
- Column DIAMETER sizing from flooding (trays and packing have different
  capacity limits) so "same flow rates, different sizing" covers diameter too.
- Dragging gas flow up to show weeping/entrainment/flooding on trays vs
  loading/flooding on packing.
- A drag-and-drop "trays or packing?" scenario sorter (corrosive, foaming, small
  diameter, fouling, low pressure drop, side draws, etc.).
- Curved equilibrium lines with numerical integration.
- Pressure drop comparison.

== WHAT I WANT FROM PLANNING ==
1. Before finalizing the plan, ask me any clarifying questions where my answer
   would change the design. Batch them together.
2. Then write the plan to docs/PLAN.md with:
   - A file/folder structure and the responsibility of each file.
   - Phases (MVP first), each with concrete deliverables and ACCEPTANCE CRITERIA
     I can check by hand (e.g., "dragging y_out down to X gives N = Y trays,
     matching Kremser").
   - The interaction design for every draggable element: what is grabbable, its
     allowed range, what it updates, and how constraints like the pinch are
     enforced.
   - A physics verification section: 2–3 hand-checkable worked examples with
     expected numbers.
   - Risks and open questions, including where an AI implementation is most
     likely to get the physics or the drag behavior wrong.
   - The Future phases backlog.
3. Also create docs/DECISIONS.md, a running log where every significant design
   decision and my guidance gets recorded with a one-line rationale. I'll use it
   for the "process" part of my presentation, so keep it updated throughout the
   project.
4. Do not write any implementation code until I approve the plan.
```

---

## Follow-up in the same round

The prompt asked to be questioned first, so four clarifying questions were put
back before any plan was written. The answers changed the design materially:

| Question | Answer | Effect |
|---|---|---|
| Which chemical system for the defaults? | **All four**, as a selector | Recommendation had been a single generic system; the owner overrode it (`D-03`) |
| Unit basis? | SI only | `D-05` |
| Site structure? | Multi-page | `D-06` |
| How should the two implementations live in the repo? | Sibling directories, one shared test suite | `D-07` |

One instruction in this brief was later withdrawn: the "flag every default as
verify against Seader Ch. 6" requirement. It produced a caveat the project could
not discharge, and was replaced with stated typical ranges — see `D-52`.
