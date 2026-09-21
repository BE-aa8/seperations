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
| Plan critic | Muse AI | 2026-09-21 | `docs/FEEDBACK.md`, findings C-01…C-14 |
| Implementer A → `impl-a/` | Claude Opus 5 (Claude Code) | 2026-09-21 | `impl-a/`, Phases 0–10 |
| Implementer B → `impl-b/` | ChatGPT | 2026-09-21 | `impl-b/`, 24 commits |
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
| D-15 | Tray height uses `N_act·S + h_top + h_bot`. **Decided 2026-09-21** (previously flagged as an open question). | The owner chose this convention after it was raised. `(N_act−1)·S` is equally defensible — *n* trays have *n−1* gaps — and the difference is one tray spacing (~0.6 m), so it remains a convention rather than a physical fact and the site says so. No longer open. | Owner |
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

### Critique-response round — 2026-09-21

| ID | Decision | Rationale | Driver |
|---|---|---|---|
| D-26 | Diagrams are **SVG**, not `<canvas>`. | Retained DOM nodes per handle give hit-testing, focus, `tabindex` and ARIA for free — canvas would require rebuilding all of it for the keyboard accessibility D-02 requires. Cost: canvas would render 70 trays more cheaply, which is why the >40-tray compressed mode exists. | Critic:MuseAI (C-02) |
| D-27 | **No build step.** Files are served exactly as authored. | The owner deploys on Netlify and will hand this to a second model; a toolchain is a second thing to get working and a second thing to explain. Cost: no bundling or minification, and ES modules mean it will not run from `file://`. | Critic:MuseAI (C-02) |
| D-28 | Clamp functions return `{value, clamped, at:'lower'\|'upper', pinch:null\|'top'\|'bottom'}` — range-end and thermodynamic pinch reported **separately**. | The critic proposed unifying both on `'top'\|'bottom'`; that would label `clampXOut`'s lower bound (the `A_max = 20` cap) a pinch. It is a UI range limit, not thermodynamics, and telling a student otherwise teaches something false. | Critic:MuseAI (C-05) → modified |
| D-29 | `impl-a` and `impl-b` **must** be built by different models; recorded in the definition of done. | The assignment's comparison requirement is unmeetable otherwise, and the omission was easy to miss because the intent was stated in prose but never in a checkable criterion. | Critic:MuseAI (C-07) |
| D-30 | A four-step amendment protocol for the frozen §2.4 API: implementer logs → owner approves → version bump → **all** existing impls update and re-run the suite. | "Frozen" without an unfreeze procedure means the first real defect either strands an implementation or gets patched silently in one of them, which destroys the like-for-like comparison. | Critic:MuseAI (C-08) |
| D-31 | A second demo button at `A = 1 − 5×10⁻⁷`, alongside the exact `A = 1` button. | The exact button tests the special case; only a near-value tests the branch *selection*. Value corrected from the critic's suggested `1 − 10⁻⁶`, which sits exactly on the `< 1e-6` threshold and so takes the other branch — verified numerically. | Critic:MuseAI (C-12) → corrected |
| D-32 | The "defaults unverified" note carries the date the defaults were chosen. | Distinguishes a live caveat from an abandoned one, at the cost of one string. | Critic:MuseAI (C-14) |
| D-33 | The SO₂ straight-line-model warning appears **on screen** when that preset is active, not as documentation. | SO₂ is in the list *because* the model strains on it (D-04). A footnote risks reading as an oversight rather than a deliberate choice; an on-screen label makes it the teaching point it was meant to be, and models the habit of stating a model's domain of validity. | Critic:MuseAI (C-13) |

### Critique round — 2026-09-21 — Muse AI

`docs/PLAN.md` v1.0 was handed to an independent model for critique per the
plan's own §0.1. It returned 14 findings plus a list of what it had verified and
found correct. Full text in `docs/FEEDBACK.md`; dispositions applied in
`docs/PLAN.md` §11.

**All 14 accepted. Two implemented differently from the literal suggestion** —
those are the interesting rows, because accepting a finding is not the same as
accepting the proposed fix.

The three claims that would have changed the physics or the acceptance criteria
(C-03, C-04, and the C-01 cross-references) were **independently re-derived
before being accepted**, not taken on trust.

| ID | Critique point | Type | Accepted? | Reason |
|---|---|---|---|---|
| C-01 | 8 of 10 `DECISION-xx` markers point at the wrong `D-xx` | Error | **Yes** | Verified by grep. I numbered markers sequentially in PLAN.md, then wrote this log in a different order and never reconciled. Broken traceability between two graded artifacts. |
| C-02 | `DECISION-03`/`-04` marked in the plan but never logged here | Error | **Yes** | The plan's own rule is that decisions live in this file. Logged as D-26, D-27. |
| C-03 | "Three complete risers" self-contradictory; Phase 4 criterion would fail a *correct* implementation | Error | **Yes** | Re-stepped independently: Examples A and C give 2 complete + 1 truncated. My error. The acceptance-criterion consequence is the serious part — it would have sent an implementer hunting a non-existent bug. |
| C-04 | §3.3 prose implies `A < 1` is infeasible | Error | **Yes — and the risk was larger than reported** | Checked all four presets: `A < 1` is reachable on every one (0.918–0.938 at the 98% clamp). A spurious `A >= 1` guard would break the exact regime the site exists to demonstrate. |
| C-05 | Clamp functions return inconsistent `at` enums | Error | **Yes, different fix** | The finding is right; the proposed fix (unify on `top`/`bottom`) would mislabel the `A_max` liquid-rate cap as a thermodynamic pinch. Adopted a two-field shape instead — see D-28. |
| C-06 | Test sweep misses reachable regimes | Omission | **Yes, corrected rationale** | Widened the ranges as proposed. But the critic placed `R = 1.02` "near the pinch"; it is at the opposite end (minimum separation). Near the pinch `R → 50`. Right fix, wrong reason — both now documented. |
| C-07 | Nothing requires the two impls to come from different models | Omission | **Yes** | Without it, `model-comparison.html` has nothing to compare. Added to the definition of done as D-29. |
| C-08 | No amendment process for the frozen API | Omission | **Yes** | A frozen contract with no unfreeze procedure strands the first implementation to hit a genuine defect. D-30. |
| C-09 | `solve()` untested | Omission | **Yes** | It is the single function every renderer consumes — the exact seam where RISK-12 would enter. Clear gap. |
| C-10 | Log-guard ↔ pinch equivalence asserted, not tested | Omission | **Yes** | It is the algebraic fact that makes "one place to enforce the pinch" true. It deserves a regression test. |
| C-11 | Pin the naive-rule values exactly | Preference | **Yes** | Named constants document the trap better than an inequality, and catch a refactor that accidentally makes the naive path agree. |
| C-12 | Add a near-`A = 1` demo affordance | Preference | **Yes, value corrected** | Good idea: the existing button tests the special case but never the branch *selection*. But the suggested `A = 1 − 1e-6` sits exactly **on** the threshold and takes the other branch. Used `1 − 5e-7`. D-31. |
| C-13 | Put the SO₂ warning on screen | Preference | **Yes** | It was the plan's own §8.2 recommendation and the critic agreed. A footnote risks looking like the site is unaware of its weakest case. D-33. |
| C-14 | Date-stamp the "defaults unverified" note | Preference | **Yes** | Zero cost; tells a viewer whether the caveat is a week or a year stale. D-32. |

**Nothing was rejected.** For the presentation, the honest framing is that the
critique found no physics errors — it verified every derivation and worked number
independently and they held — but it did find one error (C-03) that would have
actively misled an implementer, one (C-04) that could have caused a wrong guard
in the site's headline interaction, and a systematic traceability failure (C-01)
between the two documents. Those are exactly the classes of error an author is
worst-placed to catch in their own work.

**Where the critic was itself wrong**, and how I could tell: C-06's reasoning
about which clamp produces `R = 1.02` was backwards, and C-12's suggested value
lands on the wrong side of a strict inequality. Both were caught by recomputing
rather than reading. The fixes were adopted; the reasoning was corrected. This is
worth putting in the presentation — a critique is evidence, not an oracle, and
checking it is part of the process.

### Implementation round A — 2026-09-21 — `impl-a/`

| ID | Decision | Rationale | Driver |
|---|---|---|---|
| D-34 | Added `js/dom.js`, a small SVG/HTML element helper not in the plan's file list. | Five render modules would otherwise each repeat `createElementNS` boilerplate. It contains no physics and no state, so it does not weaken the architecture. | Model:Opus5 |
| D-35 | Presets specify an **initial `L/V`** and derive `x_out` from the mass balance, rather than storing `x_out` directly. | `L/V` is the physically meaningful quantity and keeps `A` exact across all four systems; storing `x_out` made the NH₃ preset land on A = 1.513 when the plan documented 1.500. The drag handle still owns `x_out` thereafter (D-09). | Model:Opus5 |
| D-36 | `physics.js` additionally exports `ntuIntegrand()` and `drivingForceAt()`. | The NTU plot must draw the curve it shades. Without these the renderer would have had to compute `1/(y − y*)` itself, which is exactly `RISK-12`. | Model:Opus5 |
| D-37 | The equilibrium line is drawn by **sampling the injected `yStar` adapter into a polyline**, not as a straight segment from `m·x`. | Caught by a self-audit during verification: the first version computed `inp.m * x` inside the renderer, silently bypassing the `yStar` seam that `D-25` exists to protect. A curved equilibrium (F-4) would have rendered as a straight line. Sampling costs nothing and makes the seam real rather than nominal. | Model:Opus5 (self-audit) |
| D-38 | The summary panel adds a **"shell with equal allowances"** row alongside the reported heights. | The plan compares the packed *bed* height against the tray *shell* height, which is not like-for-like — the bed excludes the disengaging allowances. The plan's acceptance criteria are kept exactly as written; this extra row makes the unfair comparison visible instead of hiding it. | Model:Opus5 |
| D-39 | Axis tick steps round **up** to the next nice value (1, 2, 2.5, 5, 10). | Rounding down overshot the requested tick count and collided the labels — 12 ticks where 5 were asked for. Visible in the first render. | Model:Opus5 |
| D-40 | Exactly **two categorical hues** (blue = tray, orange = packed), each keeping its meaning in every plot; the equilibrium and operating lines use **chrome ink** rather than a third hue. | Ran the palette validator rather than eyeballing: the two-hue set passes all-pairs in both modes with wide margins (CVD ΔE 24.7 light / 26.8 dark against a floor of 8). Adding a third hue for the equilibrium line threw a light-mode contrast warning, and reserving the hues to mean strictly "tray" and "packed" is the stronger encoding anyway. | Model:Opus5 |
| D-41 | Test tolerances are **split**: 1e-6 against the plan's published numbers, 1e-12 between independent routes. | The plan asked for 1e-12 against values printed to six decimal places, which is not a meaningful assertion. The hard tolerance belongs where it has teeth — staircase vs. Kremser, Simpson and log-mean vs. Colburn. | Model:Opus5 (plan corrected) |
| D-42 | Playwright is installed with `--no-save` for verification only. | The site must ship with zero dependencies; `package.json` still declares none. Browser verification is a development activity, not a project dependency. | Model:Opus5 |

### Implementation round B — 2026-09-21 — `impl-b/` (ChatGPT)

ChatGPT built `impl-b/` from `docs/PLAN.md` v1.1 across 24 commits, then it was
graded against the shared suite and driven in a browser.

**Headline: the physics is excellent, the site does not run.**

| ID | Decision / finding | Detail | Driver |
|---|---|---|---|
| D-43 | `solve()` gains `LoVratio`; `PLAN` §2.4 amended to v1.2 under the D-30 protocol. | `impl-a` computed and displayed it; the spec never listed it; a test asserted it anyway. `impl-b` implemented the published bundle correctly and failed that one assertion. **Attributable to a specification gap at build time, not to `impl-b`.** Closing it needs a one-line addition there, deliberately not applied so the artifact stays as delivered. | Critic:impl-b (exposed) → Owner |
| D-44 | The shared test suite is rewritten to depend only on the published contract. | The suite called six symbols `impl-a` exports but the spec never required — `gFactor`, `xOutPinch`, `yOutRange`, `xOutRange`, `TOL_N`, `TOL_G` — plus `guardHit` on `stepStaircase`. **16 of `impl-b`'s 17 initial failures came from those, none from its physics.** The §2.3 claim that both implementations pass "the same suite, unmodified" was therefore false as written: the suite encoded *impl-a*, not the contract. Now derived from the frozen API in `tests/helpers/load-physics.mjs`, with branch thresholds pinned to documented literals rather than read back out of the implementation under test. | Critic:impl-b (exposed) → Model:Opus5 |
| D-45 | `impl-b` is left exactly as delivered — minified source, syntax errors and all. | Altering it would contaminate the only thing the exercise measures. Its defects are recorded, not repaired. | Owner |
| D-46 | A **round-2 handoff** is issued to ChatGPT (`docs/prompts/04-impl-b-round2.md`) naming the three syntax errors exactly and asking it to bring `impl-b` to parity, rather than patching them here. | The comparison measures what each model produces; fixing its code for it would end that. The prompt states the defects precisely so the round is about remediation, not rediscovery — and that targeted feedback is itself recorded as a round-2 condition, since `impl-a` never received an equivalent. | Owner |
| D-47 | Round 2 additionally asks for **readable source**, where round 1 was minified. | Three one-character typos in twelve single-line files were effectively unreviewable, which is why they shipped. The spec never forbade minification, so round 1 stands as delivered and the change is logged as a round-2 instruction rather than a defect. | Owner |

#### Measured results

| Measure | impl-a | impl-b |
|---|---|---|
| Shared suite, as first run | 61/61 | **44/61** |
| Shared suite, after the suite was corrected (D-44) | 61/61 | **60/61** |
| Remaining failure | — | `LoVratio` only (D-43) |
| Worked examples A, B, C | exact | **exact** |
| Agreement with the other implementation | — | **bit-identical**: 0.000e+0 worst relative difference in N, N_OG, HETP and Z across 4837 points; 0 tray-count and 0 feasibility disagreements |
| The five documented traps | all correct | **all correct** |
| JS modules that parse | 12 / 12 | **9 / 12** |
| Site runs in a browser | yes | **no** |
| Source formatting | readable, commented | minified, 0 newlines |
| Written report | n/a | **none supplied** |

#### The three syntax errors that kill `impl-b`'s site

All three are single-character typos, each fatal to its module:

| File | Cause |
|---|---|
| `js/drag.js` | Unterminated string literal — `e.key==='ArrowLeft` is missing its closing quote. Braces balance; it is purely the quote. A commit titled *"Fix pointer keyboard nudge expression"* is what introduced it. |
| `js/render-ntu.js` | One extra `}` — 11 closing against 10 opening. |
| `js/render-profile.js` | One extra `}` — 9 closing against 8 opening. |

Because `drag.js` fails to parse, no handle is ever wired; the demo renders zero
SVG elements and nothing is draggable. All six pages still return HTTP 200.

#### What this round actually showed

1. **A sufficiently prescriptive spec makes two models converge exactly.** The
   plan specified the `log1p` forms and the branch thresholds down to the
   constant, and the two implementations came out *bit-identical* across 4837
   operating points. Not "close" — the same doubles.
2. **Both avoided the trap that the plan's own author fell into.** The
   fractional-stage rule was the v1.0 error (2.375 vs 2.459432); both
   implementations got it right, because the corrected plan explained it. The
   plan earning its keep is the clearest single result here.
3. **Passing a physics suite says nothing about whether the thing runs.** The
   module scored 60/61 while three sibling modules would not parse. Tests were
   written for the pure layer, which is exactly where the plan put the gate — so
   this is a gap in the *plan's* verification strategy, not just in `impl-b`.
4. **Minification made the failure invisible to review.** Three one-character
   typos in 12 single-line files cannot be spotted by reading, and the spec
   never said "write readable source" — so it is a legitimate reading of the
   brief that turned out to carry a real cost.
5. **No report means no reasoning.** The handoff asked for an account of
   ambiguities, deviations and traps hit. None came back, so the comparison can
   say *what* was produced but not *why*.

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
| Tray height convention (D-15) | `N_act·S` | *n/a — a convention, not a textbook value* | ☑ decided by owner | 2026-09-21 |
