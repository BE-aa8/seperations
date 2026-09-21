# Implementation Plan — Tray vs. Packed Absorption Column Explorer

**Course:** Separation Processes, University of Cincinnati (Chemical Engineering)
**Artifact type:** "AI Project" — an interactive educational website
**Status:** PLAN ONLY. No implementation code exists yet.
**Document version:** 1.1 — revised after independent critique. See §11 Changelog.
**Critique applied:** `docs/FEEDBACK.md` (Muse AI, 2026-09-21), findings C-01…C-14.

---

## 0. How to read this document

This plan is written to be **self-contained and model-agnostic**. A reader — human
or AI — who has never seen this project should be able to read this file cold and
either (a) critique it substantively, or (b) implement it without asking questions.

Nothing outside this file and `docs/DECISIONS.md` is required context.

Three conventions are used throughout:

| Marker | Meaning |
|---|---|
| `VERIFY` | A numeric default that must be checked against Seader, *Separation Process Principles*, Ch. 6 before the site is considered finished. It is illustrative until then. |
| `D-xx` | A choice with a defensible alternative, cross-referenced by its exact id in `docs/DECISIONS.md`. Recorded in `docs/DECISIONS.md`. A critic should feel free to argue with these. |
| `RISK` | A place where an implementation is likely to go wrong. Cross-referenced in §8. |

### 0.1 Instructions to a critiquing model

You are invited to attack this plan. The most useful critique targets, in order:

1. **The physics in §3.** Every formula is derived, not asserted. Check the
   derivations. Check the worked numbers in §7 by independent calculation.
2. **The honesty of the verification strategy (§7.5).** One of the checks the
   original brief asked for turns out to be an algebraic identity rather than an
   independent test. This is stated openly. Are the replacement checks adequate?
3. **The interaction design in §5.** Does the drag model actually have the degrees
   of freedom it claims? Are the constraints complete?
4. **Phase boundaries in §6.** Is Phase 1 a real gate? Can any phase not be
   demonstrated at its stated acceptance criteria?

Please separate critique into *errors* (something is wrong), *omissions*
(something necessary is missing), and *preferences* (you would have done it
differently). The project owner will log which points were accepted and rejected.

### 0.2 Instructions to an implementing model

- Do **not** deviate from the exported function signatures in §2.4. The shared
  test suite depends on them, and a second model is implementing the same spec.
- Implement §3 exactly, including the numerical-stability branches. Do not
  "simplify" the `log1p` forms back to naive logarithms.
- Phase 1 is a hard gate: **write no rendering code until the physics test suite
  is green.**
- When this plan is ambiguous, prefer the reading that makes the acceptance
  criteria in §6 checkable, and note the ambiguity in `docs/DECISIONS.md`.

---

## 1. Purpose, scope, constraints

### 1.1 The teaching idea

A tray column and a packed column are asked to do the **same dilute gas absorption
job** — same solute, same entering gas composition, same entering liquid
composition, same required outlet purity, same gas and liquid molar flow rates.
They are two solutions to one problem. The site lets a student *watch the two
designs size themselves differently* in real time as the separation specification
and the liquid-to-gas ratio are dragged around on a single shared y–x diagram.

The intended takeaways:

- Staged contacting and continuous (differential) contacting are two descriptions
  of the same mass transfer, related by `HETP = H_OG · g(A)`.
- A tray column's height is quantised (you cannot buy 3.4 trays); a packed
  column's height is continuous.
- The gas composition profile is a **staircase** in one and a **smooth curve** in
  the other — this is the physical meaning of "staged vs. continuous."
- Both designs pinch at the same place, for the same thermodynamic reason.

### 1.2 The interaction constraint (non-negotiable)

The course instructor routinely demonstrates slider-driven HTML tools in class and
has explicitly asked for something different. Therefore:

- **Core interactions must be direct manipulation** — the user grabs a point on a
  diagram, or a marker on a column, and moves it. The thing being dragged *is* the
  physical/graphical quantity, not a proxy control for it.
- **No `<input type="range">` anywhere in the primary interaction path.**
- Numeric `<input type="number">` fields for *secondary* parameters (m, V, tray
  efficiency, spacing) are explicitly acceptable and expected.
- Keyboard arrow-key nudging of a *focused draggable handle* is acceptable and
  required for accessibility. It is not a slider: it moves the same handle the
  pointer moves, and there is no track widget.

`D-01`

### 1.3 Technical constraints

| Constraint | Value |
|---|---|
| Hosting | Netlify, static |
| Build step | None. Files are served as authored. |
| Framework | None. Plain HTML/CSS/JS, ES modules (`<script type="module">`). |
| Runtime dependencies | Zero. |
| Dev dependencies | Zero. Tests use Node's built-in runner (`node --test`). |
| Graphics | Inline SVG (no `<canvas>`) |
| Input | Pointer Events API (one code path for mouse, touch, pen) |
| Units | **SI only.** Heights in m, flows in kmol/h, compositions as mole fractions. |
| Layout | Desktop-first, must remain usable on a phone |
| Theming | Light/dark via `prefers-color-scheme` + CSS custom properties |
| Browser target | Evergreen Chrome/Firefox/Safari, including iOS Safari |

`D-05` (SI only), `D-26` (SVG not canvas), `D-27` (no build step)

### 1.4 Out of scope for this plan

Everything in §9 (Future Phases). Do not build any of it now. The architecture must
*accommodate* it; the implementation must not *contain* it.

---

## 2. Repository structure

### 2.1 Layout

```
/
├── index.html                    Root chooser: "Implementation A" | "Implementation B"
├── netlify.toml                  publish = "."
├── package.json                  No dependencies. "test": "node --test tests/"
├── .gitignore
├── README.md
│
├── docs/
│   ├── PLAN.md                   This file.
│   ├── DECISIONS.md              Running decision log.
│   └── prompts/                  Verbatim prompts used, for the "process" section.
│
├── tests/                        ONE suite. Graded against either implementation.
│   ├── helpers/load-physics.mjs  Resolves PHYSICS_PATH env var -> module
│   ├── fixtures/worked-examples.mjs   Examples A, B, C from §7, as data
│   ├── kremser.test.mjs
│   ├── staircase.test.mjs
│   ├── ntu.test.mjs
│   ├── hetp.test.mjs
│   ├── clamping.test.mjs
│   ├── profiles.test.mjs
│   └── stability.test.mjs
│
├── impl-a/
│   ├── index.html                The interactive demo (home)
│   ├── video.html                Embedded presentation video (placeholder)
│   ├── transcript.html           Verbatim auto-generated transcript (placeholder)
│   ├── docs.html                 Project documentation
│   ├── model-comparison.html     Which model planned / critiqued / implemented
│   ├── references.html           Attribution, references, contributions
│   ├── css/
│   │   ├── theme.css             Custom properties; light + dark
│   │   ├── base.css              Typography, resets, form controls
│   │   └── layout.css            Grid, responsive breakpoints
│   ├── js/
│   │   ├── physics.js            PURE. The only module the tests import.
│   │   ├── presets.js            Pure data: systems, packings, tray defaults.
│   │   ├── state.js              Single state object, subscribe/notify, clamping.
│   │   ├── scale.js              Data <-> SVG coordinate mapping.
│   │   ├── drag.js               Pointer Events; generic draggable-handle factory.
│   │   ├── render-yx.js          The shared y-x diagram + operating/equilibrium lines.
│   │   ├── render-columns.js     Both physical column drawings.
│   │   ├── render-ntu.js         Secondary 1/(y-y*) vs y plot with shaded area.
│   │   ├── render-profile.js     Composition-vs-height overlay plot.
│   │   ├── render-summary.js     The comparison panel.
│   │   ├── controls.js           Preset select, numeric inputs, settings drawer.
│   │   └── main.js               Wiring only. No logic.
│   └── assets/
│
└── impl-b/                       Identical structure. Independently implemented.
```

### 2.2 File responsibilities

Each module below states what it **owns** and what it **must not** do. The "must
not" lines are the architectural contract; violating them is what turns a
maintainable site into a rewrite.

**`js/physics.js`** — Owns every equation in §3. Exports pure functions of plain
numbers and plain objects.
*Must not:* reference `document`, `window`, `SVG*`, any DOM type, any global
mutable state, or any unit-formatting/rounding. It must be importable and fully
testable in bare Node with no shims. It must never throw for user-reachable
inputs; infeasible input returns a structured result (§3.8).

**`js/presets.js`** — Owns the four chemical-system presets, the packing table, and
tray defaults, as frozen data. Each entry carries a `verify: true` flag and a
`source` string.
*Must not:* contain any computation.

**`js/state.js`** — Owns the single application state object, the subscribe/notify
mechanism, and **all clamping**. Every mutation goes through it. It calls
`physics.js` and caches the derived result bundle.
*Must not:* touch the DOM. *Must not* let a renderer clamp anything — see `RISK-06`.

**`js/scale.js`** — Owns the bidirectional mapping between data coordinates
(mole fractions) and SVG user units, and the screen→SVG conversion helper.
*Must not:* know about absorption. It is a generic 2-D scale.

**`js/drag.js`** — Owns the Pointer Events lifecycle: capture, move coalescing,
release, cancel, keyboard nudge. Exposes a factory that makes any SVG element
draggable along a constrained axis, reporting positions in data coordinates.
*Must not:* know what the handle means. It reports a number; `state.js` decides.

**`js/render-*.js`** — Each owns one visual region. Each exports
`mount(rootEl)` and `update(derived)`.
*Must not:* compute physics, clamp, or read state directly. They are pure
functions of the derived bundle handed to them.

**`js/controls.js`** — Owns the non-drag inputs.
*Must not:* create any `<input type="range">` (see §1.2).

**`js/main.js`** — Owns wiring only: import, mount, subscribe. If `main.js` grows
a formula or a conditional about physics, the architecture has leaked.

### 2.3 How two implementations share one test suite

`tests/helpers/load-physics.mjs`:

```js
const path = process.env.PHYSICS_PATH ?? '../../impl-a/js/physics.js';
export const physics = await import(new URL(path, import.meta.url));
```

```bash
npm test                                                   # grades impl-a
PHYSICS_PATH=../../impl-b/js/physics.js npm test           # grades impl-b
```

Both implementations must pass the **same** suite, unmodified. If an implementing
model wants to change a test, that is a finding about the plan and belongs in
`docs/DECISIONS.md` — not a patch to the test.

**Amendment protocol for the frozen §2.4 API.** A frozen contract still needs a
way to change, or the first genuine defect strands one implementation:

1. The implementer records the problem in `docs/DECISIONS.md` as a numbered
   entry, stating what is wrong and what the signature should be instead.
   They do **not** edit the test or the API unilaterally.
2. The **owner approves or rejects.** Only the owner can unfreeze the API.
3. On approval, `docs/PLAN.md` §2.4 is bumped (v1.1 → v1.2 …) and the changelog
   records what changed and why.
4. **Every** implementation already built is updated to the new signature and
   re-runs the full suite before the amendment is considered landed. An API that
   only one implementation follows is not a shared contract.

The same protocol covers a test that is wrong rather than an API that is wrong.
`D-30`

`D-07`

### 2.4 Frozen public API of `physics.js`

These signatures are **frozen**. Both implementations must export exactly these.

The canonical input object, referred to below as `inp`:

```js
/**
 * @typedef {Object} AbsorptionInput
 * @property {number} m            equilibrium slope, y* = m*x          [-]
 * @property {number} V            gas molar flow rate                  [kmol/h]
 * @property {number} xIn          solute mole fraction in entering liquid (top)
 * @property {number} yIn          solute mole fraction in entering gas  (bottom)
 * @property {number} yOut         solute mole fraction in leaving gas   (top)
 * @property {number} xOut         solute mole fraction in leaving liquid (bottom)
 * @property {number} HOG          height of a transfer unit, gas phase  [m]
 * @property {number} Eo           overall tray efficiency, 0 < Eo <= 1  [-]
 * @property {number} traySpacing  [m]
 * @property {number} hTop         top disengaging allowance             [m]
 * @property {number} hBot         bottom sump / disengaging allowance   [m]
 */
```

Note that **`L` is not an input.** It is derived (§3.2). This is a deliberate
consequence of the drag design and is the single most important structural fact
in the whole spec.

```js
export function liquidToGasRatio(inp)   // -> number   L/V
export function liquidFlow(inp)         // -> number   L [kmol/h]
export function absorptionFactor(inp)   // -> number   A

export function minLiquidToGasRatio(inp)// -> number   (L/V)_min at bottom pinch
export function feasibility(inp)        // -> {feasible:boolean, pinch:null|'top'|'bottom', reason:string}

export function theoreticalStages(inp)  // -> number   N  (Kremser, fractional)
export function stepStaircase(inp)      // -> {vertices:[{x,y}...], fullSteps:number, N:number}

export function ntuAnalytic(inp)        // -> number   N_OG (Colburn)
export function ntuNumeric(inp, n)      // -> number   N_OG by Simpson, n even, default 1000
export function ntuLogMean(inp)         // -> number   N_OG via log-mean driving force

export function hetp(inp)               // -> number   [m]
export function packedHeight(inp)       // -> number   Z  [m]
export function actualTrays(inp)        // -> number   integer
export function trayColumnHeight(inp)   // -> number   [m]

export function gasProfilePacked(inp, zFromTop)  // -> number y at height zFromTop [m]
export function gasProfileTray(inp, j)           // -> number y leaving actual tray j (1 = top)

export function clampYOut(inp, yOutRaw) // -> ClampResult
export function clampXOut(inp, xOutRaw) // -> ClampResult

export function solve(inp)              // -> full derived bundle (see below)
```

**`ClampResult`** — returned by both clamp functions. Range-end and thermodynamic
pinch are reported **separately**, because they are not the same thing:

```js
/**
 * @typedef {Object} ClampResult
 * @property {number}  value    the clamped value (always within range)
 * @property {boolean} clamped  true if the raw input was outside the range
 * @property {null|'lower'|'upper'} at     which end of the range was hit
 * @property {null|'top'|'bottom'}  pinch  which THERMODYNAMIC pinch, if any
 */
```

The distinction matters. Three of the four bounds are pinches; one is not:

| Function | `at` | `pinch` | What the bound is |
|---|---|---|---|
| `clampYOut` | `'lower'` | `'top'` | Top pinch (31): purity limit, `y_out → m·x_in` |
| `clampYOut` | `'upper'` | `null` | Degenerate-separation guard, **not** a pinch |
| `clampXOut` | `'upper'` | `'bottom'` | Bottom pinch (32): minimum L/V |
| `clampXOut` | `'lower'` | `null` | The `A_max = 20` liquid-rate cap, **not** a pinch |

`state.pinch` is set from `pinch`, never from `at`. Labelling the `A_max` cap or
the degenerate-separation guard as a pinch would tell the student that
thermodynamics forbids something that is merely a UI range limit. `D-28`

`solve(inp)` returns everything a renderer needs, computed once per state change:

```js
{
  feasible, pinch, reason,
  LoV, L, A,
  N, staircase:{vertices, fullSteps, N},
  NOG, HETP, Z, HOG,
  nActual, ZTray,
  LoVmin, Amin, xOutPinch,          // xOutPinch = yIn/m
  driving:{top, bottom, logMean},   // driving forces, for the NTU plot and checks
  axes:{xMax, yMax}                 // suggested autoscale (see 4.4)
}
```

---

## 3. Physics specification

### 3.1 Model assumptions (state these on the site, too)

1. **Dilute** solute — mole fractions, not mole ratios; L and V constant through
   the column.
2. **Isothermal, isobaric** — no heat of absorption effects, no pressure profile.
3. **Straight equilibrium line**, `y* = m·x`, passing through the origin.
4. **Counter-current** contacting; gas up, liquid down.
5. **Equilibrium stages** for the tray column, corrected by a single overall
   efficiency `E_o`.
6. **Constant `H_OG`** over the packed height.

Assumptions 1 and 3 are what make every formula below closed-form. Assumption 3
is the one the SO₂ preset deliberately strains — see §4.2.

### 3.2 Geometry: why L/V is derived, not entered

The four column-terminal compositions are laid out on the y–x diagram like this:

```
  y
  ^
  |                                    (x_out, y_in)  <-- BOTTOM of column
  |                                  /                    rich end
  |          operating line        /
  |                             /
  |                          /              equilibrium line y* = m x
  |    (x_in, y_out)     /              /
  |     TOP -->   *   /            /
  |                /          /
  |             /        /
  |          /      /
  |       /    /
  |    / /
  +-------------------------------------------> x
```

The overall solute balance over the whole column is
`V·(y_in − y_out) = L·(x_out − x_in)`, so

```
L/V = (y_in − y_out) / (x_out − x_in)                                        (1)
```

The user drags **two** endpoints:

- `y_out` vertically, with `x` pinned at `x_in` (the lean/top end);
- `x_out` horizontally, with `y` pinned at `y_in` (the rich/bottom end).

That is two degrees of freedom. With `y_in`, `x_in`, `m` and `V` fixed by the
numeric inputs, equation (1) then **determines** L/V, and hence `L = V·(L/V)`.

This is the resolution of an apparent tension in the brief: the two columns are
doing the job "at the same gas and liquid flow rates" — meaning the tray column
and the packed column share whatever `L` and `V` the current operating line
implies, not that `L` is frozen while the user drags. Dragging `x_out` *is* the
act of choosing the liquid rate. `D-09`

The operating line is therefore

```
y = (L/V)·(x − x_in) + y_out                                                 (2)
```

which passes through `(x_in, y_out)` and `(x_out, y_in)` by construction.

### 3.3 Core groups

```
A     = L / (m·V) = (L/V) / m          absorption factor                     (3)
Δ_top = y_out − m·x_in                 driving force at the top              (4)
Δ_bot = y_in  − m·x_out                driving force at the bottom           (5)
Δ_in  = y_in  − m·x_in                 (not a physical driving force;
                                        the natural non-dimensionaliser)     (6)
R     = Δ_in / Δ_top                                                         (7)
```

`A > 1` means the liquid has more than enough capacity; the column pinches at the
**top** (purity-limited). `A < 1` means it does not; the column pinches at the
**bottom** (solvent-limited): the bottom constraint (32) is the tighter of the
two, and as the operating line is dragged *onto* equilibrium at the bottom, `N`
grows without bound. `A = 1` is the balanced case and is a genuine removable
singularity in every formula below — see §3.7.

> ⚠️ **`A < 1` is not infeasible, and is routinely reachable in this UI.**
> Feasibility is **exactly** `Δ_top > 0 ∧ Δ_bot > 0` (eq. 31–32), and nothing
> else. It does **not** depend on whether `A` is above or below 1. For any
> feasible input with `A < 1`, Kremser returns a finite positive `N` — e.g.
> `A = 0.9, R = 1.5` gives `N = 0.54`.
>
> This matters because `A < 1` is reachable on **all four presets** at the
> documented clamp positions: at the 98% bottom clamp, `A = 0.918` on the
> generic, acetone and SO₂ presets and `A = 0.938` on NH₃ (the corresponding
> `A_min` values are 0.900 and 0.920). Dragging toward minimum L/V is *the*
> headline interaction of this site, and it passes through `A < 1`.
>
> **Do not add an `A >= 1` feasibility guard.** It would wrongly reject valid
> near-balanced designs precisely in the regime the site exists to demonstrate.
> The only guards are (31), (32), and the equivalent log-argument check in §3.8.

### 3.4 Tray column: Kremser

```
        ln[ (1 − 1/A)·R + 1/A ]
N   =   -----------------------                              A ≠ 1           (8)
                ln A

N   =   R − 1                                                A = 1           (9)
```

Equation (9) is the limit of (8) as `A → 1`, and expands to
`N = (y_in − y_out)/(y_out − m·x_in)`, matching the form in the brief. Proof that
(9) is the limit of (8) is in §3.7.

Actual trays and height:

```
N_act = ceil( N / E_o )                                                     (10)
Z_tray = N_act · S + h_top + h_bot                                          (11)
```

`D-15`: Equation (11) uses `N_act · S`. **Decided by the project owner,
2026-09-21.** The common alternative is `(N_act − 1)·S + h_top + h_bot`, since
*n* trays have *n−1* gaps between them; both appear in practice depending on
whether the allowances are measured from the trays or from the tangent lines,
and the difference is one tray spacing (0.55–0.6 m here), which is not
negligible.

This remains a **convention choice, not a physical fact**, and the site says so
— but it is no longer an open question. Implementations must use `N_act · S`;
every worked example in §7 and every test assertion depends on it.

### 3.5 The McCabe-Thiele staircase, and the exact fractional stage

`RISK-01` — **this is the single most likely place for an implementation to be
subtly, plausibly wrong.**

#### 3.5.1 The recursion

Number stages from the top: stage 1 is the top tray. A balance around the top *n*
stages gives `y_{n+1} = y_out + (L/V)(x_n − x_in)`, i.e. the point `(x_n, y_{n+1})`
lies on the operating line. Equilibrium on stage *n* gives `y_n = m·x_n`.

Stepping therefore goes: start at `(x_in, y_out)` — which is on the operating
line — move **horizontally** to the equilibrium line, then **vertically** back up
to the operating line. One horizontal + one vertical pair = one theoretical stage.

Substituting `x_n = y_n/m` into the operating line and using `(L/V)/m = A`:

```
y_{n+1} = y_out + A·(y_n − m·x_in),          y_1 = y_out                    (12)
```

Equivalently, in terms of `Δ_n = y_n − m·x_in`:

```
Δ_{n+1} = A·Δ_n + Δ_top                                                     (13)
```

Stop when `y_{n+1} ≥ y_in`.

> **Direction warning** (`RISK-02`): in *absorption* the operating line lies
> **above** the equilibrium line, because the gas is richer than equilibrium with
> the liquid it meets (that is the driving force that makes the solute transfer
> into the liquid). A model that has seen many more distillation rectifying-section
> problems than absorption problems may reflexively put the operating line below
> equilibrium, or step from the bottom up. Both produce a staircase that *looks*
> like a McCabe-Thiele diagram and gives a wrong stage count.

#### 3.5.2 The exact fractional last stage

The naive approach — count whole risers, then linearly interpolate the fraction of
the last one in `y` — **is wrong**, and wrong by an amount that looks believable.
On Example A of §7 it gives `N = 2.375` where Kremser gives `N = 2.459432`: a 3.4%
error. It would silently produce a wrong tray count at many operating points.

The correct rule follows from solving (13) in closed form. Define

```
c = Δ_top / (A − 1)                                                         (14)
φ_n = Δ_n + c                                                               (15)
```

Then (13) becomes `φ_{n+1} = A·φ_n` exactly: **φ is geometric in n**. Hence the
stage coordinate is logarithmic, and

```
        ln[ (Δ_in + c) / (Δ_top + c) ]
N   =   -----------------------------                        A ≠ 1          (16)
                    ln A

N   =   (Δ_in − Δ_top) / Δ_top                               A = 1          (17)
```

(At `A = 1`, (13) is arithmetic — `Δ_n = n·Δ_top` — so linear interpolation in `y`
*is* correct there, and only there. See the note on Example B in §7.4.)

**Equations (16) and (8) are algebraically identical.** Proof: from (13),
`Δ_n = Δ_top·(A^n − 1)/(A − 1)`. Setting `Δ_{N+1} = Δ_in` and solving,
`A^{N+1} = 1 + (A−1)·R`, so `N = ln[1 + (A−1)R]/ln A − 1`. Meanwhile (8) gives
`N·ln A = ln[((A−1)R + 1)/A] = ln[1 + (A−1)R] − ln A`. The two agree. ∎

This is why the staircase/Kremser test in §7.5 is an **exactness** test at
tolerance `1e-12`, not a loose agreement check. Verified numerically: the residual
is 4.4e-16 (Example A), 0 (Example B), 8.9e-16 (Example C).

#### 3.5.3 What `stepStaircase` must return

`vertices` is the polyline the renderer draws, alternating operating-line and
equilibrium-line points, beginning at `(x_in, y_out)`. The final partial step must
be drawn truncated at `y = y_in`, not overshooting.

**`fullSteps` is defined precisely as: the number of risers whose top lies at or
below `y_in`.** Equivalently, `fullSteps = floor(N)` except when `N` is an exact
integer, in which case `fullSteps = N` (the last riser lands exactly on `y_in` and
is complete). Do not count the overshooting riser. Worked values:

| Example | sequence | `fullSteps` | `N` |
|---|---|---|---|
| A | 2.0e-3 → 6.0e-3 → 1.4e-2 → *3.0e-2 (overshoots)* | **2** | 2.459432 |
| B | 4.0e-3 → 8.0e-3 → 1.2e-2 → 1.6e-2 → 2.0e-2 *(exact)* | **4** | 4.000000 |
| C | 5.0e-3 → 1.088e-2 → 1.9112e-2 → *3.06e-2 (overshoots)* | **2** | 2.952706 |

A naive loop of the form `while (y < yIn) { y = step(y); k++ }` returns `k = 3` on
Examples A and C, because it counts the transition that overshoots. That `k` is the
number of *risers drawn*, which is `fullSteps + 1` when there is a partial step —
useful to the renderer, but it is **not** `fullSteps`. Report both if convenient,
but do not confuse them.

`N` is from (16)/(17) and **must not** be recomputed from `fullSteps`.

Hard iteration guard: **200 steps**. See §5.5 for why 200 and not 50.

### 3.6 Packed column: the NTU integral and Colburn

By definition,

```
N_OG = ∫[y_out → y_in] dy / (y − y*)                                        (18)
```

where `y*` is the composition in equilibrium with the liquid **that the gas meets
at that height**, i.e. `y* = m·x` with `x` taken from the operating line (2):
`x = x_in + (y − y_out)/(L/V)`. Substituting and using `m/(L/V) = 1/A`:

```
y − y* = (1 − 1/A)·(y − m·x_in) + Δ_top/A                                   (19)
```

The integrand is therefore `1/(linear in y)` and (18) integrates in closed form.
With `u = y − m·x_in` and `b = 1 − 1/A`:

```
        ln[ (1 − 1/A)·R + 1/A ]
N_OG =  -----------------------                              A ≠ 1          (20)
                1 − 1/A

N_OG =  R − 1                                                A = 1          (21)
```

Note that the **numerator of (20) is identical to the numerator of (8)** — this is
the structural reason the two column types are so tightly linked. At `A = 1`,
equation (19) collapses to `y − y* = Δ_top`, a *constant*: the driving force is
uniform up the column, and the NTU shaded area is a perfect rectangle. That makes
Example B a particularly clean visual check.

Packed height:

```
Z = H_OG · N_OG                                                             (22)
```

**Cross-check (a) — numerical integration.** Simpson's rule on (18) with `n = 1000`
even intervals. Verified relative error vs. (20): 8.0e-12 (A), 0 (B), 2.8e-13 (C).

**Cross-check (b) — log-mean driving force.** For straight lines,

```
             (y_in − y_out)                       Δ_bot − Δ_top
N_OG = ----------------------- ,    Δ_lm  =  ---------------------         (23)
              Δ_lm                            ln( Δ_bot / Δ_top )
```

with `Δ_lm = Δ_top` when `Δ_bot = Δ_top`. Verified relative error vs. (20):
1.3e-16 (A), 0 (B), 0 (C). This is a genuinely independent route — it never touches
`A` or `R` — and is the strongest single check in the suite.

`RISK-03`: `N_OG` is the number of **overall gas-phase** transfer units. There
also exist `N_G`, `N_L`, `N_OL`. Only `N_OG` pairs with `H_OG` to give `Z`.
Mixing in a liquid-phase form gives a plausible-looking but wrong height.

### 3.7 The link: HETP, and the A = 1 limit

Dividing (20) by (8), the shared numerator cancels:

```
N_OG          ln A
------  =  ---------- =  g(A)  =  A·ln A / (A − 1)                          (24)
  N         1 − 1/A
```

and since `HETP ≡ Z / N = H_OG·N_OG / N`,

```
HETP = H_OG · g(A) = H_OG · A·ln A / (A − 1)                                (25)
```

**This is the same as the form in the brief**, `HETP = H_OG·ln(1/A)/(1/A − 1)`:

```
ln(1/A)        −ln A            −ln A · A       A·ln A
--------- =  ----------- =   -------------- =  --------
(1/A − 1)    (1 − A)/A         (1 − A)          (A − 1)
```

`RISK-04`: both forms circulate in the literature, and they differ by a *double*
reciprocal. A single slip — inverting `A` but not the denominator — yields
`HETP = H_OG/g(A)`, which is wrong in the right direction to look plausible
(it still equals `H_OG` at `A = 1` and still moves monotonically with `A`).
The test in §7.5 pins `g(2) = 2·ln 2 = 1.3862944`, which distinguishes them.

**The `A = 1` limit.** Write `ε = A − 1` and expand:
`ln(1+ε) = ε − ε²/2 + ε³/3 − …`, so

```
g(A) = (1+ε)(ε − ε²/2 + ε³/3)/ε = 1 + ε/2 − ε²/6 + O(ε³)                    (26)
```

so `g(1) = 1` and `HETP = H_OG` when `A = 1`, as required. Similarly (8) → (9)
and (20) → (21).

### 3.8 Numerical stability — prescribed, not optional

`RISK-05`. At and near `A = 1` the naive formulas are `0/0`. Verified behaviour of
the naive forms at exactly `A = 1`: **`NaN`** for both `N` and `g`. Near `A = 1`
they suffer catastrophic cancellation before that.

Implement **exactly this**:

```js
// N, Kremser. R = Δ_in/Δ_top.
N = Math.abs(A - 1) < 1e-6
  ? (R - 1) + (A - 1) * R * (1 - R) / 2
  : Math.log1p((A - 1) * R) / Math.log(A) - 1;

// N_OG, Colburn. b = 1 - 1/A.
NOG = Math.abs(b) < 1e-8
  ? (R - 1) - b * (R - 1) * (R - 1) / 2
  : Math.log1p(b * (R - 1)) / b;

// g(A) = N_OG/N = HETP/H_OG
g = Math.abs(A - 1) < 1e-5
  ? 1 + (A - 1) / 2 - (A - 1) * (A - 1) / 6
  : A * Math.log(A) / (A - 1);
```

Three things to note:

1. Use `Math.log1p`, not `Math.log(1 + …)`. The rearrangement
   `ln[(1−1/A)R + 1/A] = ln[1 + (A−1)R] − ln A` is what makes `log1p` applicable
   and is why the `− 1` appears in the `N` expression.
2. The series branches are the first two terms of the expansions in §3.7; they are
   accurate to well past double precision inside their bands.
3. Verified: across `A ∈ [0.999, 1.1]` the branched and naive forms agree to 9
   decimal places, and at exactly `A = 1` the branched forms return
   `4.000000000` on the reference case where the naive forms return `NaN`.

**Feasibility guard.** The argument of the logarithm, `1 + b·(R − 1)`, must be
strictly positive. Verified: it reaches exactly `−1` (giving `−Infinity`) precisely
when the operating line touches equilibrium at the bottom. The algebraic guard and
the geometric pinch condition are therefore **the same condition** — a pleasing
result, and one that means there is exactly one place to enforce it.

`physics.js` must never return `NaN` or throw for any input the UI can produce.
Infeasible input returns:

```js
{ feasible: false, pinch: 'top' | 'bottom', reason: 'human-readable string', … }
```

### 3.9 Composition profiles (for the height probe)

**Packed column.** Integrating (18) from the top down to a height, with
`ζ = z_from_top / H_OG` (so `ζ` runs 0 at the top to `N_OG` at the bottom):

```
y(ζ) = m·x_in + Δ_top · ( e^{bζ} − 1/A ) / b,      b = 1 − 1/A              (27)
y(ζ) = y_out + Δ_top · ζ                           A = 1 (linear!)          (28)
```

Verified: `y(0) = y_out` and `y(N_OG) = y_in` to 7 significant figures at both
`A = 2` and `A = 1`.

`RISK-08`: the profile must have its **maximum at the bottom** (gas enters rich,
leaves lean at the top). Getting `ζ` measured from the wrong end inverts the curve
and still looks like a plausible exponential.

**Tray column.** Gas leaving actual tray `j` (with `j = 1` the top tray; `j = N_act+1`
denotes the gas entering the bottom tray, i.e. `y_in`):

```
s(j) = 1 + (j − 1)·N / N_act                                                (29)
y(s) = m·x_in + Δ_top·(A^s − 1)/(A − 1)          [A = 1:  y = m·x_in + s·Δ_top]
                                                                            (30)
```

Verified on Example A (`N = 2.4594`, `N_act = 4`): `j = 1 → 2.000e-3 = y_out`
exactly; `j = 5 → 2.000e-2 = y_in` exactly; intermediate values
4.126e-3, 7.381e-3, 1.237e-2.

`D-14` — **be honest about what (29) is.** It spreads the theoretical
stages evenly over the actual trays, so each actual tray delivers `N/N_act ≈ E_o`
theoretical stages. It is an *efficiency-smearing* model, **not** a rigorous
tray-by-tray Murphree efficiency calculation. It is chosen because (a) it is
exactly consistent with `N_act = ceil(N/E_o)`, (b) it lands exactly on `y_out` and
`y_in` at the endpoints, and (c) a real Murphree calculation is a meaningful
extension, not a detail — see §9. The site must state this simplification. Note
`N/N_act ≤ E_o` always, because of the `ceil`.

### 3.10 The pinch, and why it decouples

Both lines are straight, so the driving force

```
d(x) = y_op(x) − m·x = (L/V − m)·x + (y_out − (L/V)·x_in)
```

is **linear in x**. A linear function on the interval `[x_in, x_out]` attains its
minimum at an endpoint. Therefore "the operating line never crosses the equilibrium
line" is exactly equivalent to the two endpoint conditions

```
Δ_top = y_out − m·x_in  >  0            (top pinch:    purity limit)        (31)
Δ_bot = y_in  − m·x_out >  0            (bottom pinch: minimum L/V)         (32)
```

**These are independent, and each is governed by exactly one drag handle.**
Condition (31) constrains only `y_out`; condition (32) constrains only `x_out`; and
crucially the *position* of the `x_out` limit, `x_out < y_in/m`, does not depend on
`y_out` at all. This is why §5 can specify two simple independent clamps rather
than a coupled constraint solver.

Minimum liquid rate (the classical result) follows from (32) at equality:

```
(L/V)_min = (y_in − y_out) / (y_in/m − x_in)                                (33)
A_min = (L/V)_min / m
```

Note `(L/V)_min` *does* depend on `y_out`, even though the clamp *position* does
not. The displayed "×minimum" ratio must therefore be recomputed whenever either
handle moves.

---

## 4. Default values — every one requires verification

> **Standing instruction:** every number in §4 is marked `VERIFY`. They are
> physically plausible and internally consistent, chosen so the demo shows
> interesting behaviour, but they have **not** been checked against Seader,
> *Separation Process Principles*, Ch. 6. Until the project owner checks them, the
> site must display a persistent, visible, **date-stamped** note reading:
>
> > *"Default parameter values are illustrative, chosen 2026-09-21, and pending
> > verification against Seader Ch. 6."*
>
> The date is not decoration: it tells a viewer whether the caveat is a week old
> or a year old, which is the difference between "work in progress" and
> "abandoned." It costs one hard-coded string. `D-32`
>
> Remove the note only after verification, and record the verification in
> `docs/DECISIONS.md` §4.

### 4.1 Tray and packing defaults

| Parameter | Default | Status |
|---|---|---|
| Overall tray efficiency `E_o` | 0.70 | `VERIFY` — typical absorber efficiencies run lower than distillation, often 0.3–0.7 |
| Tray spacing `S` | 0.60 m (24 in) | `VERIFY` — standard, but diameter-dependent |
| Top disengaging allowance `h_top` | 1.0 m | `VERIFY` |
| Bottom sump allowance `h_bot` | 1.0 m | `VERIFY` |

| Packing | `H_OG` | Status |
|---|---|---|
| Ceramic Raschig rings, 25 mm | 0.90 m | `VERIFY` |
| Metal Pall rings, 38 mm | 0.60 m | `VERIFY` |
| Structured, 250 m²/m³ | 0.40 m | `VERIFY` |

`D-16`: `H_OG` is treated as a **constant property of the packing choice**,
not computed from flow rates via correlations. This keeps the MVP's physics
closed-form and hand-checkable. Making `H_OG` a function of `G`, `L`, and packing
factor is a natural later phase and is the same seam as the diameter work (§9).

### 4.2 Chemical system presets

All four are selectable from a dropdown. All values `VERIFY`.

| | Generic solute A | NH₃–air–water | Acetone–air–water | SO₂–air–water |
|---|---|---|---|---|
| `m` | 1.0 | 0.85 | 1.80 | 40 |
| `y_in` | 0.020 | 0.020 | 0.015 | 0.0050 |
| `x_in` | 0.0 | 0.0005 | 0.0 | 0.0 |
| `y_out` (initial) | 0.0020 | 0.0020 | 0.0015 | 0.00050 |
| `V` [kmol/h] | 100 | 100 | 120 | 100 |
| initial `L/V` | 2.000 | 1.275 | 2.500 | 60.00 |
| &rarr; `L` (initial) [kmol/h] | 200 | 127.5 | 300 | 6000 |
| initial `A` | 2.00 | 1.50 | 1.39 | 1.50 |
| Conditions | — | 20 °C, 1 atm | 25 °C, 1 atm | 25 °C, 1 atm |

Notes attached to each preset on the site:

- **Generic solute A** — deliberately dimensionless-feeling and round-numbered, so
  a student can check the arithmetic in their head. This is the default preset and
  the one the acceptance criteria in §6 use. It is Example A of §7.
- **NH₃** — `m` is strongly temperature-dependent; the value quoted is for 20 °C
  and moves substantially over a 10 °C swing. `VERIFY` hard.
- **Acetone** — genuinely dilute at these compositions; the most defensible
  straight-line case of the four.
- **SO₂** — included **deliberately as the case where the model strains.** Two
  teaching points, both of which should be stated in the UI:
  1. SO₂–water equilibrium is **markedly non-linear even at low `x`**. A single
     straight `y* = m·x` is a poor fit over any appreciable range. This preset is
     the motivating example for the curved-equilibrium future phase (§9).
  2. `m ≈ 40` means `L/V` must be ≈ 60 for a workable `A`. That enormous liquid
     rate is *why* SO₂ scrubbing is done with alkaline solution rather than plain
     water. The "bad" preset teaches something the three "good" ones cannot.

**The SO₂ warning goes on screen, not in a footnote.** `D-33` When the SO₂ preset
is selected, the demo displays a persistent, visible callout beside the y–x
diagram, worded roughly:

> **Straight-line model strained here.** Real SO₂–water equilibrium is distinctly
> curved even at these low compositions, so the single slope `m = 40` is a fit
> over a narrow range, not a law. Treat the stage and height numbers on this
> preset as illustrative of the *method*, not as a design. This is the case that
> motivates curved-equilibrium support (see the project documentation).

This was §8.2's own recommendation and it is adopted. The reasoning: SO₂ is in the
preset list precisely *because* the model strains on it (`D-04`). Leaving that in
a footnote risks a reader concluding the site is unaware of its weakest case,
which is much worse than the weakness itself. An explicit on-screen label converts
it into the teaching point it was always meant to be — and models the habit of
stating a model's domain of validity, which is the more transferable lesson.

### 4.3 The `A ≈ 1` demonstration preset

In addition to the four systems, the settings drawer offers a **"Balanced (A = 1)"**
button that sets `m = 1.0, V = 100, y_in = 0.020, x_in = 0, y_out = 0.004,
x_out = 0.016`. This is Example B of §7: `N = N_OG = 4` exactly, `HETP = H_OG`
exactly, the NTU shaded area is a perfect rectangle, and the packed composition
profile is a straight line. It exists so that the `A = 1` special case — the most
error-prone part of the physics — is one click away for a demo or a grader.

**A second button, "Near-balanced (A = 1 − 5×10⁻⁷)"**, sits beside it and sets
`L = 99.99995`, everything else unchanged. `D-31`

Note the exact value matters. `L = 99.9999` gives `|A − 1| = 1e-6` *exactly*,
which fails the strict `< 1e-6` test in §3.8 and takes the `log1p` branch — so it
would not exercise what this button is for. `L = 99.99995` gives
`|A − 1| = 5e-7`, comfortably inside the series band. Verified.

The two buttons test *different* things, which is the point:

| | `A = 1` exactly | `A = 1 − 5×10⁻⁷` |
|---|---|---|
| Which §3.8 path runs | series branch | series branch, well inside its threshold |
| Naive form's behaviour there | **`NaN`** (0/0) | finite, but losing precision |
| What it would expose | a missing special case | a *misplaced* threshold — a branch set at, say, `1e-9` falls through to the naive form here |
| Expected `N` | 4.000000000 | 4.000005000 |

A grader clicking only "Balanced" exercises the special case but never the branch
*selection*. Both must display `N = N_OG = 4.000` and `HETP = H_OG = 0.600 m` to
the shown precision, with no visible jump between them — a discontinuity means
the threshold is misplaced. (For scale: at `A = 1 − 1e-8` the branched form gives
4.000000100 and the naive form 4.000000060 — they part company in the 8th digit.)
`stability.test.mjs` covers this in Node; these buttons put it in the demo path.

### 4.4 Axis autoscaling

Because `m` ranges from 0.85 to 40 across presets, `x_out,pinch = y_in/m` ranges
over nearly two orders of magnitude (2.0e-2 down to 1.25e-4). Fixed axes are
impossible.

```
xMax = 1.15 · (y_in / m)        // 15% past the bottom-pinch composition
yMax = 1.15 · y_in
```

`RISK-09`: **axes must be recomputed on preset or numeric-input change, and
frozen for the duration of a drag gesture.** If the axis range is recomputed on
every `pointermove`, the diagram creeps under the cursor and the handle appears
to slip away from the pointer. Freeze on `pointerdown`, release on `pointerup`.

Tick labels: use fixed notation with enough decimals for the range, or scientific
notation below 1e-3. Do not let the SO₂ preset render as a column of `0.000`.

---

## 5. Interaction design

### 5.1 The three draggable elements

#### Handle 1 — `y_out` (top of column / lean end)

| | |
|---|---|
| **What is grabbable** | A filled circle at `(x_in, y_out)` on the y–x diagram, r = 7 SVG units, with a transparent concentric hit circle of r ≥ 22 units (≥ 44 px effective touch target). |
| **Axis** | Vertical only. `x` is pinned at `x_in`. Horizontal pointer motion is ignored entirely, not projected. |
| **Meaning** | The separation specification: how clean the treated gas must be. |
| **Allowed range** | `m·x_in + ε·Δ_in  ≤  y_out  ≤  y_in − ε·Δ_in`, with `ε = 0.02` |
| **Lower bound is** | The **top pinch** (31). Thermodynamic purity limit: no column of any height, with any liquid rate, can produce gas leaner than equilibrium with the entering liquid. Independent of `L`. |
| **Upper bound is** | Degenerate-separation guard. Above it, `N < 1` and there is nothing to show. |
| **Writes to state** | `yOut` |
| **Triggers recompute of** | everything: `L/V`, `A`, `N`, `N_OG`, both heights, both profiles, `(L/V)_min`, the staircase, the NTU area |
| **Clamp feedback** | At the lower clamp, set `pinch = 'top'`; the handle turns to the warning colour, the equilibrium line thickens, and a label reads *"Pinched: y_out cannot go below m·x_in = <value>"*. |
| **Keyboard** | `tabindex="0"`; ↑/↓ nudge by 0.5% of the y-range, Shift+↑/↓ by 5%. `aria-label="Treated gas composition, drag vertically"`, with `aria-valuetext` updated live. |

#### Handle 2 — `x_out` (bottom of column / rich end)

| | |
|---|---|
| **What is grabbable** | A filled circle at `(x_out, y_in)`, same geometry as Handle 1, visually distinguished (different fill). |
| **Axis** | Horizontal only. `y` is pinned at `y_in`. |
| **Meaning** | The liquid rate. Dragging right = less liquid = leaner exit liquid impossible = approaching minimum L/V. |
| **Allowed range** | `x_in + (y_in − y_out)/(A_max·m)  ≤  x_out  ≤  x_in + (1 − ε)·(y_in/m − x_in)`, with `A_max = 20`, `ε = 0.02` |
| **Upper bound is** | The **bottom pinch** (32) — minimum L/V. Its *position* does not depend on `y_out` (§3.10). |
| **Lower bound is** | A cap on `A` at 20, i.e. an absurdly large liquid rate. Expressed via `A` rather than as a raw composition so it is meaningful across all four presets. |
| **Writes to state** | `xOut` |
| **Triggers recompute of** | same as Handle 1 |
| **Clamp feedback** | At the upper clamp, set `pinch = 'bottom'`; show *"Minimum L/V reached: (L/V)min = <value>, A = <value>"* and draw a dashed line from the pinch point along equilibrium. |
| **Live readout while dragging** | `L/V`, `L`, `A`, and `L/V ÷ (L/V)min` — this last is the number a designer actually cares about. |
| **Keyboard** | As Handle 1, ←/→. |

#### Handle 3 — Height probe

| | |
|---|---|
| **What is grabbable** | A horizontal rule with a grab tab, spanning both column drawings. |
| **Axis** | Vertical only, in **height** coordinates, not composition. |
| **Range** | `0 ≤ z ≤ max(Z_tray, Z_packed)`, measured from the bottom. |
| **Meaning** | "What is the gas composition at this elevation?" |
| **Reads out** | Two values: tray-column `y` at that height (discrete — it jumps between trays) and packed-column `y` (smooth). Plus the height itself, and which tray number the probe is on. |
| **Also updates** | A marker on the composition-vs-height overlay plot (§5.3). |
| **Edge behaviour** | The two columns generally have **different** total heights. Above the shorter column's top, its readout shows "— (above column)" rather than extrapolating. This asymmetry is the point of the whole site; do not hide it by normalising the height axes. `D-21` |

### 5.2 Clamping rules

`RISK-06` — **clamp in state, never only in the renderer.**

The failure mode: a renderer that limits where it *draws* the handle, while
`state.yOut` holds the raw unclamped pointer value. The picture then disagrees with
the numbers, and the disagreement only shows up at the extremes — exactly where a
demo goes.

Required flow, every time:

```
pointermove
  → drag.js converts screen → data coordinates
  → state.setYOut(rawValue)
      → physics.clampYOut(inp, rawValue) → {value, clamped, at, pinch}
      → state.yOut = value              ← the CLAMPED value is stored
      → state.pinch = pinch          ← from `pinch`, NEVER from `at` (see §2.4)
      → derived = physics.solve(state)
      → notify subscribers
  → renderers draw from `derived` only
```

Additional rule: **when `y_out` moves, re-evaluate Handle 2's lower bound** (it
depends on `y_out` through `A_max`) and re-clamp `x_out` if it now violates. The
upper bound does not need re-evaluation (§3.10), but the displayed `(L/V)min` does.

The pinch flag must be set **once**, in `state.js`, and consumed by renderers.
Renderers must not independently re-derive "am I pinched?" — two sources of truth
for the same boolean will drift.

### 5.3 What updates live during a drag

Everything, at 60 fps, from a single `requestAnimationFrame`-coalesced update:

- y–x diagram: operating line, both handles, the staircase, the pinch flag
- Tray column drawing: trays added/removed, column height
- Packed column drawing: packed height grows/shrinks
- NTU plot: the `1/(y − y*)` curve and its shaded area
- Composition-vs-height overlay: both curves
- Summary panel: `N`, `N_act`, `Z_tray`, `N_OG`, `H_OG`, `Z`, `HETP`, `L/V`, `A`

### 5.4 Pointer Events contract

`RISK-10`. Implement all of these; each is a known source of "works on my laptop,
broken on a phone."

```css
.handle { touch-action: none; cursor: grab; }
.handle:active { cursor: grabbing; }
```

```js
el.addEventListener('pointerdown', e => {
  el.setPointerCapture(e.pointerId);      // keeps events coming if the pointer
  freezeAxes();                           // leaves the element or the window
  e.preventDefault();
});
el.addEventListener('pointermove', e => {
  if (!el.hasPointerCapture(e.pointerId)) return;
  pending = e;                            // coalesce: store, do not compute
  if (!raf) raf = requestAnimationFrame(flush);
});
['pointerup', 'pointercancel'].forEach(t =>
  el.addEventListener(t, e => { el.releasePointerCapture(e.pointerId);
                                unfreezeAxes(); }));
```

- `touch-action: none` is **mandatory**, or iOS scrolls the page instead of
  dragging the handle.
- `pointercancel` must release. Omitting it strands the handle in a dragging state
  after an OS-level gesture interrupt.
- Coalesce `pointermove` into one `requestAnimationFrame`. A high-rate pointer
  fires far faster than the display refreshes; recomputing per event wastes work
  and can make dragging feel laggy rather than smooth.

**Screen → SVG conversion.** Use the CTM. Do **not** do `getBoundingClientRect()`
arithmetic:

```js
const pt = new DOMPoint(e.clientX, e.clientY);
const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
```

Rect arithmetic happens to work when the SVG is rendered 1:1, and breaks silently
under a responsive `viewBox`, a CSS transform, a zoomed page, or a device pixel
ratio ≠ 1 — which is to say, on a phone. `RISK-10`.

### 5.5 Why ε = 0.02, and the rendering consequence

The clamp keeps a driving force of at least `ε·Δ_in` at each end. The worst case is
both ends clamped simultaneously, which forces `A = 1` and gives

```
N_max = (1 − ε)/ε
```

Verified worst cases:

| ε | `N_max` | trays at `E_o` = 0.7 | `Z` at `H_OG` = 0.6 m |
|---|---|---|---|
| 0.01 | 99.0 | 142 | 59.4 m |
| **0.02** | **49.0** | **70** | **29.4 m** |
| 0.03 | 32.3 | 47 | 19.4 m |
| 0.05 | 19.0 | 28 | 11.4 m |

`ε = 0.02` is chosen because approaching the pinch closely is pedagogically the
whole point — the student should see the tray count run away. The cost is that the
tray renderer must cope with up to 70 trays. `D-11`

Therefore: **above 40 trays, the tray column switches to a compressed
representation** — draw the top 8 and bottom 8 trays explicitly with a break
symbol and an inline count between them, rather than 70 unreadable 3-pixel lines.
The staircase on the y–x diagram similarly thins its stroke and drops the per-step
labels above 20 steps. The physics does not change; only the drawing does.

Hard iteration guard in `stepStaircase`: **200**. This is well above the 49
reachable by dragging, so hitting it means a bug, and the function should return
`feasible: false` with a reason rather than looping.

---

## 6. Phases

Each phase ends at a demonstrable state. Do not begin a phase before its
predecessor's acceptance criteria pass.

### Phase 0 — Scaffold

**Deliverables:** directory tree from §2.1; `package.json` with
`"test": "node --test tests/"` and no dependencies; `netlify.toml` with
`publish = "."`; root `index.html` chooser; empty stub modules with the §2.4
signatures throwing `new Error('not implemented')`; `.gitignore`.

**Acceptance:** `npm test` exits 0 with zero tests. `npx serve .` (or any static
server) serves the root chooser and both implementation directories.

### Phase 1 — Physics module + full test suite ⟵ **HARD GATE**

**Deliverables:** complete `js/physics.js` and `js/presets.js`; all seven test
files from §2.1.

**Acceptance:**
1. `npm test` green, all cases in §7.5.
2. All three worked examples of §7 reproduce to **1e-12** relative.
3. The staircase-vs-Kremser test passes at **1e-12**, not a looser tolerance.
4. The `A = 1` tests return exact values, not `NaN`.
5. `node -e "import('./impl-a/js/physics.js')"` succeeds in bare Node — proving
   the module has no DOM dependency.

**Do not write any rendering code until this phase passes.** A physics bug found
after the renderers exist is far more expensive, because a wrong number and a
wrong drawing can agree with each other.

### Phase 2 — Static diagram and column shells

**Deliverables:** `scale.js`; `render-yx.js` drawing axes, the equilibrium line,
the operating line and both endpoint markers (not yet draggable);
`render-columns.js` drawing two empty column shells; `theme.css`.

**Acceptance:** With the generic preset hard-coded, the diagram matches Example A:
the operating line runs from (0, 0.002) to (0.009, 0.020); the equilibrium line is
`y = x`; the operating line is visibly **above** the equilibrium line everywhere
between them (§3.5.1 direction check). Axis labels and tick values are legible.

### Phase 3 — Drag the operating line ⟵ **MVP CORE**

**Deliverables:** `drag.js`; `state.js` with clamping; both handles live; pinch
flags; live numeric readout of `L/V`, `L`, `A`, `N`, `N_OG`.

**Acceptance:**
1. Dragging `y_out` down and `x_out` right both work with mouse **and** touch
   (verify on a real phone or a touch-emulating dev tools session).
2. Dragging the pointer far outside the plot does not lose the handle
   (pointer capture).
3. The operating line **never** visually crosses the equilibrium line, at any
   drag speed, including a fast flick past the pinch.
4. At the top clamp, the readout says pinched and `y_out` stops at
   `m·x_in + 0.02·Δ_in`.
5. At the bottom clamp on the generic preset, `x_out` stops at
   `0.98 × 0.020 = 0.0196` and the minimum-L/V flag appears.
6. The axes do not move during a drag.
7. Tab to a handle and press ↑ — it moves. No `<input type="range">` exists in
   the page source.

### Phase 4 — Tray side

**Deliverables:** staircase rendering on the y–x diagram (including the truncated
partial step); tray column drawing with trays added/removed live; readouts for
`N`, `N_act`, `Z_tray`; the >40-tray compressed mode.

**Acceptance (hand-checkable, generic preset):**
> Set `y_out` = 0.002 and `x_out` = 0.009. The panel must read **N = 2.46**,
> **actual trays = 4**, **tray height = 4.40 m**. The staircase must show **2
> complete risers plus a third truncated** at `y = 0.020` (consistent with
> `N = 2.459432`: two whole stages and 0.459 of a third), and the riser tops must
> fall at y = 2.0e-3 → 6.0e-3 → 1.4e-2, with the truncated third reaching
> y = 2.0e-2 (read them off the diagram).
> Count the trays drawn in the column: there must be exactly 4.

> Switch `E_o` to 1.0: actual trays must become **3** (`ceil(2.4594) = 3`) and the
> height 3 × 0.60 + 2.0 = **3.80 m**.

### Phase 5 — Packed side

**Deliverables:** `render-ntu.js` — the secondary `1/(y − y*)` vs `y` plot with the
area under the curve between `y_out` and `y_in` shaded; packed column drawing with
packed height growing/shrinking; readouts for `N_OG`, `H_OG`, `Z`.

**Acceptance (generic preset, same operating point):**
> **N_OG = 3.41**, **H_OG = 0.60 m** (Pall rings), **Z = 2.05 m**. The shaded area
> must be annotated with its numeric value and that value must equal the displayed
> `N_OG` to the displayed precision.

> Switch to the balanced (A = 1) preset: the `1/(y − y*)` curve must become
> **flat** and the shaded region a **perfect rectangle** (§3.6), with
> `N_OG = 4.00` exactly.

> Switch packing from Pall rings to structured: `N_OG` must **not** change;
> only `Z` (2.05 m → 1.36 m) and `HETP` change. If `N_OG` moves, `H_OG` has
> leaked into the NTU calculation — a bug.

### Phase 6 — Height probe and profile overlay

**Deliverables:** Handle 3; `render-profile.js` overlaying both
composition-vs-height curves with a marker at the probe height.

**Acceptance (generic preset, same operating point):**
> The tray curve must be a **staircase** with 4 steps; the packed curve must be
> **smooth**. Both must start at `y = 0.020` at `z = 0` (bottom) and reach
> `y = 0.002` at their respective tops. The tray column top is at 4.40 m and the
> packed top at 2.05 m, so the packed curve **ends first** — the profile plot must
> show this, not normalise it away.

> Probe at tray 3 from the top: readout ≈ **7.38e-3**. Probe just above and just
> below that tray: the tray readout **jumps**; the packed readout changes smoothly.

> Load the balanced (A = 1) preset: the packed profile must be a **straight line**
> (§3.9, eq. 28).

### Phase 7 — Controls and presets

**Deliverables:** `controls.js`; preset dropdown with all four systems plus the
balanced demo; numeric inputs for `m`, `V`, `y_in`, `x_in`, `E_o`, tray spacing,
`h_top`, `h_bot`; packing selector; settings drawer; the standing
"defaults unverified" note.

**Acceptance:**
1. All four presets load without error and the axes rescale correctly — in
   particular **SO₂ must render legibly** with `x_max ≈ 1.4e-4`, not a column of
   `0.000` tick labels.
2. Switching preset re-clamps both handles into the new valid ranges rather than
   leaving them stranded outside.
3. Every numeric input rejects values that would make the state infeasible, with
   an inline message, and never puts `NaN` on screen.
4. Setting `m` such that `A` lands within 1e-7 of 1 produces finite, correct
   output — no `NaN`, no visual glitch.
5. No `<input type="range">` in any page.

### Phase 8 — Summary comparison panel ⟵ **MVP COMPLETE**

**Deliverables:** `render-summary.js` — a side-by-side table: theoretical stages
`N` vs. transfer units `N_OG`; `HETP` vs. `H_OG`; actual trays vs. packed height;
total height each; `L/V`, `L`, `V`, `A`, `L/V ÷ (L/V)min`; and the consistency
check `N × HETP` vs. `Z_packed`.

**Acceptance:** On all three worked examples, the panel reproduces §7's table. The
consistency check compares **raw numbers with a relative tolerance of 1e-9**, not
formatted display strings (`RISK-11`). The panel must carry the honest label from
§7.5 explaining that this particular check is an identity.

### Phase 9 — Required site sections

**Deliverables:** the five non-demo pages, with a shared nav, each structured with
headings and clearly-marked `<!-- FILL IN -->` regions:

1. **`index.html`** — the interactive demo (Phases 2–8).
2. **`video.html`** — a responsive 16:9 YouTube embed wrapper with a placeholder
   video ID in one clearly-labelled constant, plus a caption block.
3. **`transcript.html`** — a scrollable, selectable, searchable region holding the
   verbatim auto-generated transcript. Placeholder text now. Must be plain
   readable text with a copy button, not an iframe.
4. **`docs.html`** — with these sections stubbed and headed:
   - Overview of the project and what the tool shows
   - **Framing: this is an AI project exploring AI capabilities**
   - Process: which AI models and tools were used, and the prompts
     (links into `docs/prompts/`)
   - Planning and iteration: where the student guided the AI, and why
   - Key technical content: the physics of §3; staged vs. continuous contacting;
     when to choose trays and when to choose packing
   - What I learned, and what I want to learn next
5. **`model-comparison.html`** — which model wrote the plan, which critiqued it,
   the critique points accepted and rejected with reasons, and how the two
   implementations compared (fed by `docs/DECISIONS.md`).
6. **`references.html`** — attribution, references (Seader Ch. 6 et al.), and
   contributions.

**Acceptance:** Every section required by the assignment exists and is reachable
from every page's nav. Each fill-in region is obvious and editable without
touching JavaScript.

### Phase 10 — Responsive, accessible, deployed

**Deliverables:** mobile layout (columns stack below the diagram); dark mode;
focus-visible styling; `prefers-reduced-motion` respected; Netlify deploy.

**Acceptance:**
1. Usable at 390 px wide: both handles draggable with a thumb, all readouts legible,
   no horizontal page scroll.
2. Dark mode readable; the pinch warning colour distinguishable in both themes and
   distinguishable without relying on colour alone (it also changes shape/label).
3. Keyboard-only operation: tab to each handle, nudge, read the live `aria-valuetext`.
4. Deploys to Netlify from the repository root with no build command.

---

## 7. Physics verification — three worked examples

Every number below was computed, not estimated. Reproduce them independently
before trusting this plan.

### 7.1 Example A — generic preset, `A = 2`

**Inputs:** `m = 1.0`, `V = 100`, `L = 200`, `y_in = 0.020`, `x_in = 0`,
`y_out = 0.002`, `H_OG = 0.60 m`, `E_o = 0.70`, `S = 0.60 m`,
`h_top = h_bot = 1.0 m`

| Quantity | Value |
|---|---|
| `L/V` | 2.000000 |
| `x_out` = `x_in + (y_in − y_out)/(L/V)` | **0.009000** |
| `A = L/(m·V)` | 2.000000 |
| `R = Δ_in/Δ_top = 0.020/0.002` | 10.000000 |
| **`N` (Kremser, eq. 8)** | **2.459432** |
| `N` (staircase, eq. 16) | 2.459432 — residual **4.4e-16** |
| *`N` (naive last-riser interpolation)* | *2.375000* ✗ **— 3.4% wrong** |
| **`N_OG` (Colburn, eq. 20)** | **3.409496** |
| `N_OG` (Simpson, n = 1000) | 3.409496 — rel. err **8.0e-12** |
| `N_OG` (log-mean, eq. 23) | 3.409496 — rel. err **1.3e-16** |
| `g(A) = N_OG/N` | 1.386294 (`= 2 ln 2`) |
| **`HETP`** | **0.831777 m** |
| **`Z_packed`** | **2.045698 m** |
| `N × HETP` | 2.045698 ✓ |
| `N_act = ceil(2.459432/0.70) = ceil(3.5135)` | **4** |
| **`Z_tray = 4(0.60) + 1.0 + 1.0`** | **4.400 m** |
| `(L/V)_min` (eq. 33) | 0.900000 |
| `A_min` | 0.900000 |
| `L/V ÷ (L/V)min` | 2.222 |
| `x_out,pinch = y_in/m` | 0.020000 |

**Staircase risers** (gas composition leaving each theoretical stage, from the
top), for reading off the diagram by hand:

```
y₁ = 2.0e-3   y₂ = 6.0e-3   y₃ = 1.4e-2   y₄ = 3.0e-2 (overshoots y_in = 2.0e-2)
```

**Two complete risers, plus a third truncated at `y_in`.** The first two land at
6.0e-3 and 1.4e-2, both below `y_in = 2.0e-2`; the third would reach 3.0e-2, so it
is cut off at `y_in`. This is consistent with `N = 2.459432` (two whole stages plus
0.459 of a third) and with the naive value `2.375 = 2 + 0.375`. Therefore
`fullSteps = 2`, **not** 3 — a correct implementation reports two complete risers.

Check by hand with eq. (12): `y₂ = 0.002 + 2(0.002 − 0) = 0.006` ✓;
`y₃ = 0.002 + 2(0.006) = 0.014` ✓; `y₄ = 0.002 + 2(0.014) = 0.030` ✓ (overshoots).

**Actual-tray gas profile** (eq. 29–30, `s(j) = 1 + (j−1)(2.4594/4)`):

| tray `j` (1 = top) | `s` | `y` |
|---|---|---|
| 1 | 1.0000 | 2.000000e-3 (= `y_out` exactly) |
| 2 | 1.6149 | 4.125629e-3 |
| 3 | 2.2297 | 7.380832e-3 |
| 4 | 2.8446 | 1.236587e-2 |
| 5 (gas entering bottom tray) | 3.4594 | 2.000000e-2 (= `y_in` exactly) |

### 7.2 Example B — `A = 1` exactly, all-integer

**Inputs:** `m = 1.0`, `V = 100`, `L = 100`, `y_in = 0.020`, `x_in = 0`,
`y_out = 0.004`, `H_OG = 0.60 m`, `E_o = 0.70`, `S = 0.60 m`, `h_top = h_bot = 1.0 m`

| Quantity | Value |
|---|---|
| `L/V`, `A` | 1.000000, 1.000000 |
| `x_out` | 0.016000 |
| `R` | 5.000000 |
| **`N`** | **4.000000** exactly |
| **`N_OG`** | **4.000000** exactly |
| `g(1)` | 1.000000 |
| **`HETP`** | **0.600000 m** = `H_OG` exactly |
| **`Z_packed`** | **2.400000 m** |
| `N_act = ceil(4/0.70) = ceil(5.7143)` | **6** |
| **`Z_tray`** | **5.600 m** |
| `(L/V)_min`, `A_min` | 0.800000, 0.800000 |

**Staircase:** `y = 4.0e-3, 8.0e-3, 1.2e-2, 1.6e-2, 2.0e-2` — evenly spaced by
`Δ_top = 0.004` (the arithmetic case, §3.5.2). Exactly four complete risers, no
partial step.

This example is hand-checkable in under a minute: the driving force is a constant
0.004 everywhere, so `N_OG = 0.016/0.004 = 4` by inspection, the NTU integrand is
constant, and the stages are evenly spaced.

> ⚠️ **Do not build the test suite only on Example B.** At `A = 1` the *naive*
> fractional-stage rule coincidentally gives the correct answer (4.000), because
> the recursion is arithmetic there. A suite containing only Example B would pass
> with the `RISK-01` bug fully present. Examples A and C are the ones that catch it.

### 7.3 Example C — non-zero `x_in`, `A = 1.4`

**Inputs:** `m = 0.8`, `V = 120`, `L = 134.4`, `y_in = 0.030`, `x_in = 0.001`,
`y_out = 0.005`, `H_OG = 0.90 m` (Raschig), `E_o = 0.65`, `S = 0.55 m`,
`h_top = 1.0 m`, `h_bot = 1.2 m`

| Quantity | Value |
|---|---|
| `L/V` | 1.120000 |
| `x_out` | 0.02332143 |
| `A` | 1.400000 |
| `Δ_top = 0.005 − 0.8(0.001)` | 0.004200 |
| `Δ_in = 0.030 − 0.0008` | 0.029200 |
| `R` | 6.952381 |
| **`N`** | **2.952706** |
| `N` (staircase) | 2.952706 — residual 8.9e-16 |
| *`N` (naive interpolation)* | *2.944745* ✗ |
| **`N_OG`** | **3.477263** |
| Simpson / log-mean | rel. err 2.8e-13 / 0 |
| `g(1.4)` | 1.177653 |
| **`HETP`** | **1.059888 m** |
| **`Z_packed`** | **3.129537 m** |
| `N_act = ceil(2.952706/0.65) = ceil(4.5426)` | **5** |
| **`Z_tray = 5(0.55) + 1.0 + 1.2`** | **4.950 m** |
| `(L/V)_min`, `A_min` | 0.684932, 0.856164 |
| `L/V ÷ (L/V)min` | 1.635 |

**Staircase:** `y = 5.0e-3, 1.088e-2, 1.9112e-2, 3.06368e-2` — **two complete
risers** (1.088e-2 and 1.9112e-2, both below `y_in = 3.0e-2`), plus a third
truncated at `y_in`. Consistent with `N = 2.952706`, so `fullSteps = 2`. Hand
check via eq. (12):
`y₂ = 0.005 + 1.4(0.005 − 0.0008) = 0.005 + 0.00588 = 0.01088` ✓.

This example exercises `x_in ≠ 0` (which shifts the entire equilibrium reference),
`m ≠ 1` (so the equilibrium line is not the 45° diagonal — a common hidden
assumption), and an `A` that is neither 1 nor a round number.

### 7.4 Why these three

| Example | Exercises |
|---|---|
| A | The common case, `A > 1`, `x_in = 0`, round numbers, and the naive-fraction bug at maximum visibility |
| B | The `A = 1` removable singularity, exact integers, the constant-driving-force rectangle, the linear packed profile |
| C | `x_in ≠ 0`, `m ≠ 1`, non-round `A`, different packing and tray parameters |

### 7.5 The test suite

| Test file | Asserts | Tolerance |
|---|---|---|
| `kremser.test.mjs` | `theoreticalStages` matches the **published** §7 values for A, B, C | 1e-6 rel (see note) |
| `staircase.test.mjs` | `stepStaircase().N === theoreticalStages()` for A, B, C **and** for a sweep of `A ∈ [0.5, 20]` × `R ∈ [1.02, 100]` (see note below) | 1e-12 rel |
| | `fullSteps` matches §3.5.3: 2 (A), 4 (B), 2 (C), and `fullSteps === Math.floor(N)` whenever `N` is not an integer, across the sweep | exact |
| | `vertices` alternate operating/equilibrium and start at `(x_in, y_out)` | — |
| | the *naive* rule is computed and asserted equal to the **pinned constants** `2.375000` (A) and `2.944745` (C), and asserted **different** from `N` — a regression guard that the correct rule is in use | 1e-6 abs |
| `ntu.test.mjs` | `ntuAnalytic` matches the **published** §7 values | 1e-6 rel (see note) |
| | `ntuAnalytic ≈ ntuNumeric(n=1000)` (Simpson) | 1e-9 rel |
| | `ntuAnalytic ≈ ntuLogMean` | 1e-12 rel |
| | `ntuNumeric` converges: error at n=1000 < error at n=100 | — |
| `hetp.test.mjs` | `hetp = H_OG·g(A)`; `g(2) = 2 ln 2 = 1.3862944` | 1e-12 rel |
| | `hetp === H_OG` when `A === 1` | exact |
| | `N × HETP === Z_packed` — **labelled in the test file as an identity check** | 1e-12 rel |
| `clamping.test.mjs` | `clampYOut` returns the bound and `clamped:true` past the top pinch | exact |
| | `clampXOut` returns `x_in + 0.98(y_in/m − x_in)` past the bottom pinch | exact |
| | `feasibility()` is false exactly when `Δ_top ≤ 0` or `Δ_bot ≤ 0` | — |
| | the log argument `1 + b(R−1) > 0` holds for every clamped input in a 10⁴-point sweep | — |
| | nothing returns `NaN` for any clamped input in that sweep | — |
| | **`at` vs `pinch` per §2.4**: `clampYOut` upper and `clampXOut` lower return `pinch === null`; the other two return `'top'`/`'bottom'` | exact |
| | **`A < 1` is feasible** (C-04): for each of the four presets, `x_out` at the 98% clamp gives `A < 1` and `feasibility().feasible === true` | exact |
| | **log-guard ↔ pinch equivalence** (C-10): sweeping `x_out → y_in/m`, `1 + b(R−1) → 0⁺` monotonically, and `feasibility().feasible` flips to `false` exactly at `Δ_bot ≤ 0` — not before | exact |
| `solve.test.mjs` | `solve(inp).N === theoreticalStages(inp)`, `.NOG === ntuAnalytic(inp)`, `.Z === packedHeight(inp)`, `.HETP === hetp(inp)`, `.nActual === actualTrays(inp)`, `.ZTray === trayColumnHeight(inp)` | exact |
| | `solve(inp).staircase.N === solve(inp).N` | exact |
| | no field of the bundle is `NaN`, `null` (except documented nullables) or `undefined` anywhere in the 10⁴-point clamp sweep | — |
| | `axes.xMax`/`axes.yMax` bracket all four presets' terminal points | — |
| `profiles.test.mjs` | `gasProfilePacked(0) === y_out`, `gasProfilePacked(Z) === y_in` | 1e-10 rel |
| | packed profile is monotonically increasing from top to bottom | — |
| | `gasProfileTray(1) === y_out`, `gasProfileTray(N_act+1) === y_in` | 1e-10 rel |
| | `A = 1` packed profile is linear in `z` (second differences vanish) | 1e-12 |
| `stability.test.mjs` | `A = 1 ± 10^-k` for k = 2…12 gives finite, monotone, continuous `N`, `N_OG`, `g` | — |
| | `A = 1` exactly gives exactly `R − 1`, not `NaN` | exact |
| | branched vs. naive agree to 1e-9 across `A ∈ [0.99, 1.01] \ {1}` | 1e-9 |

**Note on tolerances.** Two different things are being checked, and they deserve
different tolerances:

- **Against the published §7 values — `1e-6` relative.** Those numbers are
  printed to six decimal places, so they carry about 5e-7 of absolute precision.
  Asserting them to `1e-12` would be asserting against digits the document does
  not contain. This check answers "does the code agree with the document?"
- **Between two independent routes — `1e-12` relative.** Staircase vs. Kremser,
  and Simpson/log-mean vs. Colburn, are computed at full double precision inside
  the suite, so they can and should be pinned hard. This check answers "is the
  physics right?" — and it is the one with teeth.

**Note on the sweep ranges.** `R ∈ [1.02, 100]` and `A ∈ [0.5, 20]` are chosen to
cover what the UI can actually reach, which is wider than it first appears:

- **`R = 1.0204` is reachable** — it occurs at the *upper* `y_out` clamp
  (`y_out = y_in − 0.02·Δ_in`, i.e. minimum separation, `N < 1`). Note this is the
  **opposite** end from the pinch: approaching the *top pinch* drives `R → 50`,
  not toward 1. Both ends need covering, and a sweep starting at `R = 2` misses
  the low end entirely.
- **`A = 20` is reachable** — it is exactly Handle 2's lower bound
  (`A_max = 20`, §5.1), and Phase 7's numeric inputs can approach it.
- **`A < 1` is reachable** on all four presets (§3.3), so the sweep must extend
  below 1 — hence `A ∈ [0.5, …]`, not `[1, …]`.

The sweep must include points where `A` crosses each `§3.8` branch threshold
(`1 ± 1e-6`, `1 ± 1e-8`, `1 ± 1e-5`), since the branch boundaries are where the
stability work actually happens.

**An honest note on the `N × HETP = Z` check.** The brief asks for this as a
verification. It must be implemented, and it must be shown on the site — but it is
worth being clear about what it does and does not prove. Since
`HETP ≡ H_OG·N_OG/N` by equation (25), the product `N × HETP` is `H_OG·N_OG`,
which is `Z` **by definition**. The check therefore verifies that the
implementation applied its own definitions consistently — which is genuinely
useful, since an inverted `g(A)` (`RISK-04`) *would* break it — but it does not
independently validate the physics.

The checks that *do* independently validate the physics are:
(i) the stepped staircase vs. Kremser (two entirely different algorithms: an
iterative geometric construction vs. a closed form), and
(ii) Simpson integration and the log-mean driving force vs. Colburn (a numerical
quadrature and an independent algebraic route vs. a closed form).

The site's summary panel should present the `N × HETP` row with a short note
saying it is a consistency check, and present the staircase and area checks as the
substantive ones. Claiming more than that would be the kind of thing a critiquing
model should catch.

---

## 8. Risks and open questions

### 8.1 Where an implementation is most likely to go wrong

Ranked by (likelihood × difficulty of detection).

**`RISK-01` — Fractional stage counting. HIGHEST RISK.**
*The error:* counting whole risers then linearly interpolating the last one in `y`.
*Why it happens:* it is the obvious thing to do and it is how the step is drawn.
*Why it hides:* it is exactly right at `A = 1`, approximately right elsewhere, and
the error (3.4% on Example A) sits comfortably inside "looks like a rounding
difference." It often produces the *same* integer tray count after `ceil`, so
spot-checks pass.
*Correct approach:* §3.5.2, eq. (16).
*Caught by:* `staircase.test.mjs` at 1e-12 on Examples A and C, plus the explicit
assertion that the naive value differs.

**`RISK-02` — Stepping direction / operating line on the wrong side.**
*The error:* placing the operating line below equilibrium, or stepping from the
bottom up with absorption conventions.
*Why it happens:* distillation is far more common in training material, and in a
rectifying section the operating line is below the equilibrium curve. Absorption
inverts this.
*Caught by:* the Phase 2 visual acceptance criterion, and by any staircase test
(a wrong direction diverges instead of converging).

**`RISK-03` — `N_OG` vs. `N_OL` / `N_G`.**
*The error:* using a liquid-phase or film (rather than overall gas) transfer-unit
definition, then multiplying by `H_OG`.
*Caught by:* Simpson integration of eq. (18) as written, and the log-mean check.

**`RISK-04` — The HETP double reciprocal.**
*The error:* `HETP = H_OG/g(A)` instead of `H_OG·g(A)`.
*Why it hides:* both forms give `HETP = H_OG` at `A = 1` and both vary
monotonically with `A`.
*Caught by:* `g(2) = 1.3862944` pinned exactly, and the `N × HETP = Z` identity.

**`RISK-05` — `A → 1` singularity.**
*The error:* naive `ln A` in a denominator; `NaN` at exactly `A = 1` (verified) and
precision loss nearby.
*Caught by:* `stability.test.mjs`; also Phase 7 acceptance criterion 4.

**`RISK-06` — Clamping in the renderer instead of in state.**
*The error:* the drawing is bounded but `state` holds unclamped values, so numbers
and picture disagree at the extremes.
*Why it hides:* only visible at the clamps, which is where nobody tests but
everybody demos.
*Caught by:* Phase 3 acceptance criteria 3–5; partially by `clamping.test.mjs`.

**`RISK-07` — `ceil` applied in the wrong place, and the height convention.**
*The error:* `ceil` before dividing by `E_o`, or `ceil(N)/E_o`, or silently
choosing `(N_act − 1)·S`.
*Note:* the height convention is a genuine `D-15`, not a bug. It was **settled
by the owner on 2026-09-21 in favour of `N_act · S`**, so silently choosing the
other form is now simply wrong and will fail the §7 worked examples — but it
remains a convention rather than a physical fact, and the site says so.
*Caught by:* Phase 4's explicit `E_o = 1.0 → 3 trays, 3.80 m` check.

**`RISK-08` — Profile direction inverted.**
*The error:* measuring `ζ` from the bottom instead of the top in eq. (27).
*Why it hides:* the curve is still smooth, still monotone, still spans the right
range — it is just reflected.
*Caught by:* `profiles.test.mjs` endpoint assertions, and Phase 6's "starts at
0.020 at the bottom."

**`RISK-09` — Axis autoscale jitter during drag.**
*The error:* recomputing `xMax`/`yMax` on every `pointermove`.
*Symptom:* the handle drifts away from the pointer; the drag feels "slippery."
*Caught by:* Phase 3 acceptance criterion 6.

**`RISK-10` — Pointer Events specifics.**
Missing `touch-action: none` (page scrolls on iOS instead of dragging); no
`setPointerCapture` (handle drops when the pointer leaves the element); no
`pointercancel` handler (handle stranded mid-drag); `getBoundingClientRect`
arithmetic instead of `getScreenCTM().inverse()` (breaks under responsive viewBox,
page zoom, or DPR ≠ 1 — i.e., on phones); no rAF coalescing (wasted work, jank).
*Caught by:* Phase 3 acceptance criteria 1–2, Phase 10 criterion 1. **These must be
tested on a real touch device**, not only in a desktop browser's touch emulation.

**`RISK-11` — Comparing formatted strings in the consistency check.**
*The error:* `if (fmt(N*HETP) === fmt(Z))`, which can fail on a rounding boundary
and alarm the user, or pass while hiding a real discrepancy.
*Correct:* compare raw numbers at 1e-9 relative; format only for display.

**`RISK-12` — Renderers recomputing physics.**
*The error:* a renderer that needs one more number computes it inline rather than
taking it from the `solve()` bundle.
*Why it matters:* it is how two sources of truth appear, and it is exactly the
thing that makes the future phases in §9 require a rewrite rather than an addition.
*Caught by:* code review — grep the `render-*.js` files for `Math.log`.

### 8.2 Open questions for the project owner

1. **All §4 defaults need checking against Seader Ch. 6.** Especially: `E_o` for
   absorbers (the 0.70 default may be optimistic), the three `H_OG` values, and
   `m` for all four systems — particularly SO₂, where the non-linearity means any
   single `m` is a fit over a chosen range, and the choice of range should be
   stated.
2. ~~**Tray height convention** (`D-15`): `N_act·S` or `(N_act − 1)·S`?~~
   **RESOLVED 2026-09-21** — the owner chose `N_act·S`. See §3.4.
3. ~~Should the SO₂ preset display an explicit on-screen warning?~~
   **RESOLVED** — yes, via critique point C-13; see `D-33` and §4.2.
4. Does the assignment require the site to be usable offline / from a local file?
   (`file://` breaks ES module imports without a server; if so, that changes §1.3.)
   **Still open.**
5. ~~Should the composition-vs-height plot put height on the x-axis or the y-axis?~~
   **RESOLVED** — y-axis, so it reads like the physical columns beside it.

---

## 9. Future phases backlog — do not build now

Each entry names the **existing seam** that accommodates it, so the MVP
architecture can be checked against the backlog before any of it is built.

**F-1 — Column diameter from flooding.**
Trays flood by entrainment (Souders-Brown / Fair correlation); packing floods by
the loading/flooding transition (generalised pressure drop correlation). Same `L`
and `V`, different capacity limits, therefore different diameters — which completes
the "same flow rates, different sizing" story in the second dimension.
*Seam:* `physics.js` gains an independent `sizing.js` sibling; `solve()` gains a
`diameter` sub-object; `render-columns.js` already takes width as a parameter.
Requires adding gas/liquid **densities** and physical properties to `presets.js` —
which is why `presets.js` is pure data with room to grow.

**F-2 — Dragging gas rate into the operating envelope.**
Drag `V` up and watch trays pass through weeping (too low) → normal → entrainment →
flooding, while packing passes loading → flooding. Different failure modes at
different points, on the same flow rates.
*Seam:* `V` is already a state field and an input to `solve()`; making it draggable
is a third instance of the `drag.js` factory. Depends on F-1.

**F-3 — Trays-or-packing scenario sorter.**
A drag-and-drop exercise: cards reading *corrosive service*, *foaming system*,
*small diameter*, *fouling / solids*, *low pressure drop required*, *side draws
needed*, *high liquid rate*, *vacuum service*, *large turndown*, *low liquid
holdup wanted* — dropped into a "trays" or "packing" bin, with an explanation on
each answer.
*Seam:* an entirely separate page plus a reuse of `drag.js`. No physics coupling
at all. This is the cheapest item on the list and the highest pedagogical value
per hour; consider promoting it.

**F-4 — Curved equilibrium lines with numerical integration.**
The honest version of SO₂. Kremser and Colburn both stop being valid; stages must
be stepped numerically against a curve, and `N_OG` must be integrated numerically.
*Seam:* this is the reason the plan specifies `ntuNumeric` in the MVP even though
`ntuAnalytic` is exact. Replace the hard-coded `y* = m·x` with an injected
`yStar(x)` function that is `x => m*x` today; `stepStaircase` already walks
geometrically rather than using a closed form for its vertices; the NTU integrator
is already numeric. The closed-form paths become the "straight-line fast path" and
the analytic-vs-numeric test becomes a straight-line regression test.
*This is the single most important seam in the architecture.* An implementation
that hard-codes `m*x` inside six different modules cannot accept F-4 without a
rewrite; one that funnels it through a single `yStar` can.

**F-5 — Pressure drop comparison.**
Dry and irrigated packing pressure drop vs. tray pressure drop
(dry + hydrostatic + residual), and the resulting operating-cost argument.
*Seam:* purely additive — a new pure module and a new panel. Depends on F-1 for
diameter and on F-2 for velocity.

**Architectural test for the MVP:** before declaring Phase 8 complete, re-read F-1
through F-5 and confirm each could be added by *adding* files and *extending*
`solve()`, without editing any `render-*.js` physics (there should be none) and
without changing any existing function signature. If that is not true, the
abstraction is in the wrong place.

---

## 10. Definition of done for the MVP

- [ ] `npm test` green against `impl-a`
- [ ] `PHYSICS_PATH=../../impl-b/js/physics.js npm test` green against `impl-b`
- [ ] All three §7 worked examples reproduce on screen, by hand, in both impls
- [ ] Both handles draggable with mouse and with a thumb on a real phone
- [ ] The operating line cannot be made to cross the equilibrium line
- [ ] No `<input type="range">` anywhere
- [ ] All six required assignment sections exist and are fillable
- [ ] Light and dark both readable
- [ ] Deployed to Netlify from the repo root with no build command
- [ ] **`impl-a` and `impl-b` were implemented by *different* models.** `D-29` If one
      model built both, `model-comparison.html` and `DECISIONS.md` §3.2 have
      nothing to compare and the assignment's comparison requirement is unmet.
      Record which model built which in `DECISIONS.md` §1.
- [ ] `docs/DECISIONS.md` current, including the model-comparison table
- [ ] Every §4 default either verified against Seader Ch. 6 or still flagged
      on screen as unverified

---

## 11. Changelog

### v1.1 — 2026-09-21 — critique applied

Reviewed by an independent model (Muse AI); findings in `docs/FEEDBACK.md`.
The critic verified the physics derivations and all three worked examples by
independent calculation and found them correct — no equation in §3 changed in
this revision. The findings were cross-reference hygiene, three genuine wording
errors, and test-coverage gaps.

All 14 findings accepted. Two were implemented differently from the critic's
literal suggestion; those departures are noted below and logged in
`docs/DECISIONS.md`.

| ID | Finding | Disposition | Sections touched |
|---|---|---|---|
| C-01 | 8 of 10 `DECISION-xx` markers pointed at the wrong `D-xx` entry | **Accepted.** All markers renamed to the `D-xx` form and repointed at the correct entries, so plan and log now share one vocabulary. | §0, §1.2, §1.3, §2.3, §3.2, §3.4, §3.9, §4.1, §5.1, §5.5, §8.1, §8.2 |
| C-02 | `DECISION-03` (SVG not canvas) and `DECISION-04` (no build step) were marked but never logged | **Accepted.** Logged as `D-26` and `D-27`. | §1.3 |
| C-03 | "Three complete risers" is self-contradictory; the Phase 4 acceptance criterion would have **failed a correct implementation** | **Accepted.** Confirmed by independent re-stepping: Examples A and C have **2 complete risers + 1 truncated**, not 3. Example B genuinely has 4 (its last riser lands exactly on `y_in`). §3.5.3 now defines `fullSteps` precisely, tabulates it for all three examples, and warns that the obvious `while (y < yIn)` loop returns `fullSteps + 1`. | §3.5.3, §6 Phase 4, §7.1, §7.3 |
| C-04 | §3.3 prose invited reading `A < 1` as infeasible | **Accepted, and the risk was larger than reported.** `A < 1` is reachable on **all four** presets at the documented clamps (A = 0.918 generic/acetone/SO₂, 0.938 NH₃). Added an explicit callout: feasibility is `Δ_top > 0 ∧ Δ_bot > 0` only, and **do not add an `A >= 1` guard**. | §3.3 |
| C-05 | Clamp functions returned inconsistent `at` enums (`'top'\|'bottom'` vs `'min'\|'max'`) | **Accepted, implemented differently.** The critic proposed unifying on `'top'\|'bottom'`; that would mislabel `clampXOut`'s lower bound — the `A_max = 20` liquid-rate cap — as a thermodynamic pinch, which it is not. Instead both now return `{value, clamped, at:'lower'\|'upper', pinch:null\|'top'\|'bottom'}`, separating range-end from pinch, with a table of which bound is which. `D-28` | §2.4, §5.2 |
| C-06 | Test sweep `A ∈ [0.5, 5] × R ∈ [2, 100]` missed reachable regimes | **Accepted, rationale corrected.** Widened to `A ∈ [0.5, 20]`, `R ∈ [1.02, 100]`. The critic located `R = 1.0204` "near the pinch"; it is in fact at the *opposite* end — the minimum-separation clamp. Approaching the top pinch drives `R → 50`. Both ends now covered, and the note explains which is which. | §7.5 |
| C-07 | Nothing required `impl-a` and `impl-b` to come from different models | **Accepted.** Added to §10 as `D-29`; without it the comparison page has nothing to compare. | §10 |
| C-08 | No amendment process for the frozen §2.4 API | **Accepted.** Four-step protocol added: implementer logs, owner approves, version bumps, **all** existing implementations update and re-run the suite. `D-30` | §2.3 |
| C-09 | `solve()` — the one function renderers consume — had no direct test | **Accepted.** New `solve.test.mjs` asserting bundle-vs-function agreement, internal consistency, and no `NaN` across the clamp sweep. | §2.1, §7.5 |
| C-10 | The log-guard ↔ pinch equivalence was asserted but untested | **Accepted.** Added to `clamping.test.mjs`. | §7.5 |
| C-11 | Pin the naive-rule regression values explicitly | **Accepted.** `2.375000` (A) and `2.944745` (C) are now asserted as named constants, not merely asserted different. | §7.5 |
| C-12 | Add a near-`A = 1` demo affordance | **Accepted, value corrected.** A "Near-balanced" button is added — but at `A = 1 − 5×10⁻⁷` (`L = 99.99995`), not `1 − 10⁻⁶`. `L = 99.9999` gives `\|A − 1\| = 1e-6` *exactly*, which fails the strict `< 1e-6` test and takes the `log1p` branch, so it would not exercise the branch this button exists to exercise. `D-31` | §4.3 |
| C-13 | Put the SO₂ straight-line warning on screen | **Accepted.** Was §8.2's own recommendation. Full callout text specified. `D-33` | §4.2 |
| C-14 | Date-stamp the "defaults unverified" note | **Accepted.** `D-32` | §4 |

**What did not change.** No equation, no worked number, no phase boundary, and no
part of the verification strategy. The critic explicitly checked and endorsed the
Kremser ↔ staircase identity proof, the §7.5 honesty note about `N × HETP = Z`
being an identity, the pinch-decoupling argument in §3.10, the efficiency-smearing
disclosure in §3.9, the `RISK-04` double-reciprocal warning, Phase 1 as a real
gate, and the axis autoscale formulae.

### v1.0 — 2026-09-21 — initial plan

Written before any implementation code. All physics verified numerically prior to
being written down.
