# Decision Log

A running record of every significant design decision on this project, who drove
it, and why. This file exists for the **process** portion of the assignment —
the "AI Project" framing means *how* the thing was built is graded alongside
*what* was built. Keep it current.

---

## How to use this file

1. **Append, don't rewrite.** Newest entries at the bottom of §2. History is the
   point. If a decision is later reversed, add a *new* entry that supersedes the
   old one and mark the old one `SUPERSEDED BY D-xx`. Do not delete it — a
   reversal is the most interesting kind of entry for the presentation.
2. **One line of rationale.** If it needs a paragraph, the paragraph belongs in
   `docs/PLAN.md`; this file links to it.
3. **Record who drove it.** The "Driver" column is what makes this file useful
   for the model-comparison section:
   - `Owner` — the student made the call
   - `Assignment` — required by the course brief, not a free choice
   - `Model:<name>` — the AI proposed it and the owner accepted
   - `Model:<name>→Owner` — the AI proposed it, the owner **overrode** it
     *(these are the most valuable entries — they show guidance, not just usage)*
   - `Critic:<name>` — came out of the critique round
4. **Log rejections too.** A critique point you considered and declined is
   evidence of judgement. Record it with the reason.
5. Add an entry **when you make the decision**, not at the end of the project.

---

## 1. Project roles

Fill in as the project proceeds. This table feeds `model-comparison.html`.

| Role | Model / person | Date | Notes |
|---|---|---|---|
| Plan author | Claude Opus 5 (Claude Code) | 2026-09-21 | Wrote `docs/PLAN.md` v1.0 |
| Plan critic | *(to be filled — a different model)* | | |
| Implementer A → `impl-a/` | *(to be filled)* | | |
| Implementer B → `impl-b/` | *(to be filled)* | | |
| Owner / director | *(your name)* | | UC Separation Processes |

---

## 2. Decisions

### Planning round — 2026-09-21

| ID | Decision | Rationale | Driver |
|---|---|---|---|
| D-01 | Core interactions are direct manipulation; **no `<input type="range">`** in the primary path. Numeric fields for secondary parameters are fine. | The instructor demos slider-based tools in class and explicitly asked for something new. | Assignment |
| D-02 | Keyboard arrow-key nudging of a *focused drag handle* is allowed and required. | Accessibility without a slider widget: it moves the same handle the pointer moves, with no track control. | Model:Opus5 |
| D-03 | **All four chemical systems** ship as a preset dropdown, not one chosen system. | Owner overrode the recommendation of a single generic system: more capability, and the contrast between systems is itself instructive. | Model:Opus5→Owner |
| D-04 | Include SO₂–water **despite** its equilibrium being markedly non-linear. | Turns a modelling weakness into a teaching point — it is the case that shows where the straight-line assumption breaks, and motivates future phase F-4. | Model:Opus5 |
| D-05 | **SI units only** (m, kmol/h, mole fractions). No unit toggle. | One set of defaults to verify against the textbook; one less surface for a second implementation to get wrong. | Owner |
| D-06 | **Multi-page** site (6 pages + shared nav), not a single scrolling page. | Each assignment section is separately gradeable and separately fillable; keeps the demo page lean. | Owner |
| D-07 | Two implementations live as **sibling directories** `impl-a/` and `impl-b/` on one branch, sharing one test suite via a `PHYSICS_PATH` env var. | Easiest side-by-side diff; both deployable from one Netlify site; the shared suite makes the comparison objective rather than impressionistic. | Owner |
| D-08 | Mole **fractions**, not mole ratios (Y, X). | The dilute assumption makes them equivalent; fractions match the brief's equations and the straight-line y–x diagram. | Model:Opus5 |
| D-09 | **`L` is derived, not entered.** The two drag handles set `y_out` and `x_out`; the mass balance then fixes `L/V`, hence `L`. | Resolves the apparent tension in the brief between "same flow rates" and "drag `x_out` to set L/V" — the two *columns* share whatever `L` the operating line implies. See PLAN §3.2. | Model:Opus5 |
| D-10 | The **exact** fractional-stage rule (log-ratio of the geometric invariant `φ_n = Δ_n + Δ_top/(A−1)`), not linear interpolation on the last riser. | The naive rule gives 2.375 where Kremser gives 2.459432 — a 3.4% error that looks like rounding. Derived and verified in PLAN §3.5.2. | Model:Opus5 |
| D-11 | Pinch clamping uses **ε = 0.02** of `Δ_in` retained at each end. | Verified worst case: 49 theoretical stages, 70 actual trays. Chosen over ε = 0.05 because watching the tray count run away near the pinch *is* the lesson; the cost is a compressed tray rendering above 40 trays. | Model:Opus5 |
| D-12 | Pinch enforcement is **two independent endpoint clamps**, one per handle, not a coupled constraint solver. | Both lines are straight, so the driving force is linear in x and its minimum is at an endpoint — proven in PLAN §3.10. The `x_out` clamp position turns out not to depend on `y_out` at all. | Model:Opus5 |
| D-13 | All clamping happens in `state.js`; renderers receive already-clamped values. | Prevents the picture and the numbers from disagreeing at the extremes — which is exactly where a live demo goes. `RISK-06`. | Model:Opus5 |
| D-14 | Tray-column gas profile uses **efficiency smearing** (`s(j) = 1 + (j−1)N/N_act`), not a per-tray Murphree efficiency calculation. | Exactly consistent with `N_act = ceil(N/E_o)` and lands exactly on `y_out`/`y_in` at the endpoints. Stated on the site as a simplification; a real Murphree calculation is a future phase, not a detail. | Model:Opus5 |
| D-15 | Tray height uses `N_act·S + h_top + h_bot` per the brief. **Flagged as a convention, not a fact** — `(N_act−1)·S` is equally defensible. | One tray spacing (~0.6 m) of difference. Open question for the owner; see PLAN §8.2 item 2. | Assignment (flagged) |
| D-16 | `H_OG` is a **constant per packing type**, not computed from flow correlations. | Keeps the MVP closed-form and hand-checkable. Flow-dependent `H_OG` shares a seam with the diameter work (future phase F-1). | Model:Opus5 |
| D-17 | The `N × HETP = Z_packed` check is implemented **and labelled as an algebraic identity**, with Simpson integration and the log-mean driving force added as the genuinely independent cross-checks. | `HETP ≡ H_OG·N_OG/N`, so the product is `Z` by definition. It catches an inverted `g(A)` but does not validate the physics. Overstating it is the kind of thing a critic should catch — so the plan pre-empts it. See PLAN §7.5. | Model:Opus5 |
| D-18 | **Phase 1 (physics + tests) is a hard gate.** No rendering code until the suite is green. | A physics bug found after the renderers exist is much harder to spot, because a wrong number and a wrong drawing agree with each other. | Model:Opus5 |
| D-19 | Numerical-stability branches near `A = 1` are **prescribed in the plan**, not left to the implementer (`log1p` forms plus series expansions with stated thresholds). | Verified that the naive forms return `NaN` at exactly `A = 1`. Two independent implementations must behave identically here or the comparison is noise. | Model:Opus5 |
| D-20 | Axis ranges autoscale per preset but **freeze for the duration of a drag**. | `m` spans 0.85→40 across presets, so fixed axes are impossible; but recomputing mid-drag makes the diagram creep under the cursor. `RISK-09`. | Model:Opus5 |
| D-21 | The two columns' height axes are **not normalised** against each other in the probe/profile view. | They have different total heights — that difference is the entire point of the site. Hiding it would defeat the demo. | Model:Opus5 |
| D-22 | Every default value carries a `VERIFY against Seader Ch. 6` flag, and the site shows a standing "defaults unverified" note until they are checked. | The owner asked to be able to check them against the textbook; unflagged plausible numbers are worse than obviously provisional ones. | Owner |
| D-23 | A one-click **"Balanced (A = 1)"** preset ships alongside the four systems. | Puts the most error-prone special case one click away for a demo or a grader; it is Example B of PLAN §7, hand-checkable in a minute. | Model:Opus5 |
| D-24 | `physics.js` exported signatures are **frozen** in PLAN §2.4. | Both implementations must be drop-in compatible with the same unmodified test suite, or the comparison is not like-for-like. | Model:Opus5 |
| D-25 | A single injected `yStar(x)` seam is designed in from the start (currently `x => m*x`), and `ntuNumeric` is built in the MVP even though `ntuAnalytic` is exact. | These are the seams that let curved equilibrium (F-4) be added rather than retrofitted. Identified as the most important architectural decision in the plan. | Model:Opus5 |

### Critique round — *(to be filled)*

Record each critique point here as accepted or rejected, with a reason. Suggested
shape:

| ID | Critique point | From | Accepted? | Reason |
|---|---|---|---|---|
| C-01 | | | | |

### Implementation round A — *(to be filled)*

| ID | Decision | Rationale | Driver |
|---|---|---|---|

### Implementation round B — *(to be filled)*

| ID | Decision | Rationale | Driver |
|---|---|---|---|

---

## 3. Model comparison notes

Fill in as you go; this becomes `model-comparison.html`.

### 3.1 Plan → critique

- What did the critic catch that the planner missed?
- What did the critic flag that turned out to be wrong, and how did you tell?
- Did the critic find any of the `RISK-*` items independently?

### 3.2 Implementation A vs. B

| Dimension | impl-a | impl-b |
|---|---|---|
| Model used | | |
| Passed the shared physics suite first try? | | |
| Which `RISK-*` items did it actually hit? | | |
| Lines of JS (excluding HTML/CSS) | | |
| Deviations from the frozen API in PLAN §2.4 | | |
| Drag feel on touch | | |
| Anything it did better than the plan asked for | | |
| Anything it silently skipped | | |

### 3.3 Where the owner's guidance changed the outcome

The entries above marked `Model:…→Owner` and `Owner` are the direct evidence.
Expand each into a sentence or two for the presentation: what the AI proposed,
what you decided instead, and what you were reasoning from.

Start with **D-03** — the AI recommended shipping a single generic chemical system
for simplicity; the owner required all four. Worth narrating, because it is a case
where the AI optimised for implementation cleanliness and the human optimised for
teaching value, and the human was right.

---

## 4. Verification ledger

Tick these off as you check the defaults against Seader, *Separation Process
Principles*, Ch. 6. Until every row is done, the site keeps its
"defaults unverified" note.

| Value | Plan default | Textbook value | Checked? | Date |
|---|---|---|---|---|
| `E_o` overall tray efficiency | 0.70 | | ☐ | |
| Tray spacing `S` | 0.60 m | | ☐ | |
| `h_top` / `h_bot` | 1.0 m / 1.0 m | | ☐ | |
| `H_OG`, ceramic Raschig 25 mm | 0.90 m | | ☐ | |
| `H_OG`, metal Pall 38 mm | 0.60 m | | ☐ | |
| `H_OG`, structured 250 m²/m³ | 0.40 m | | ☐ | |
| `m`, NH₃–air–water @ 20 °C | 0.85 | | ☐ | |
| `m`, acetone–air–water @ 25 °C | 1.80 | | ☐ | |
| `m`, SO₂–air–water @ 25 °C | 40 | | ☐ | |
| Tray height convention (D-15) | `N_act·S` | | ☐ | |
