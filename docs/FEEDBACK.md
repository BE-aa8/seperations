Critique of PLAN.md v1.0 — Tray vs. Packed Absorption Column Explorer
Critic: independent review, 2026-09-21
Plan version reviewed: v1.0 (docs/PLAN.md on branch
claude/separation-processes-edu-plan-9oaa43)
Method: Per §0.1 of the plan, I attacked (1) the physics derivations and
worked numbers by independent calculation, (2) the honesty of the verification
strategy, (3) the interaction design's degrees of freedom, and (4) the phase
boundaries. Findings are separated into errors, omissions, and
preferences, each with an ID (C-xx) ready to paste into the critique table
in docs/DECISIONS.md. "Checked and found correct" items are listed at the end
so the owner knows what was actually exercised.
Verdict in one paragraph: The physics is sound and remarkably
self-consistent — every number I recomputed matched, including the non-obvious
ones. The verification strategy is honest about its own weak check (§7.5), which
is exactly right. The findings below are dominated by cross-reference hygiene
and wording slips, plus one real usability-of-spec issue (§3.3, A < 1) and one
test-coverage gap in the regime the plan cares most about (near-pinch). Nothing
found requires re-deriving the physics.

What I verified by independent calculation
All recomputed from the equations as stated, not by copying the plan's
arithmetic:
Examples A, B, C (§7.1–7.3): every table entry reproduced — N, N_OG,
  g(A), HETP, Z, N_act, Z_tray, (L/V)_min, A_min, x_out. E.g.
  Example A: N = 2.459432, N_OG = 3.409496, g(2) = 1.3862944, Z = 2.045698;
  Example C: N = 2.952706, N_OG = 3.477263, Z_tray = 4.950 m.
Staircase ↔ Kremser exactness: geometric stepping per §3.5.1 with the
  log-ratio rule (16) agrees with closed-form Kremser (8) to 0 (A), 4.4e-16
  relative — consistent with the plan's claimed residuals.
The naive-rule trap: linear interpolation of the last riser gives exactly
  2.375000 on A and 2.944745 on C, matching the plan. The plan's warning is
  quantitatively correct.
A = 1 branches (§3.8): prescribed log1p/series forms are continuous with
  the naive forms across A ∈ [0.999, 1.1] (agreement to 9+ decimals) and return
  exactly R − 1 at A = 1 where the naive forms are NaN. The series coefficients
  match the expansions in §3.7.
Feasibility/log-guard equivalence (§3.8): sweeping x_out → y_in/m on
  Example A, 1 + b(R−1) approaches 0 linearly (0.5, 0.05, 0.005, 0.0005),
  confirming the algebraic guard and the geometric pinch are the same condition.
Profile endpoints (§3.9): packed profile hits y_out/y_in exactly at
  both ends; tray profile hits exactly at j = 1 and j = N_act+1; probe at tray 3
  gives 7.380832e-3, matching §7.1.
Pinch decoupling (§3.10): confirmed the x_out clamp position
  y_in/m is independent of y_out, and that clamping both ends forces
  A = 1 exactly (L/V → m). N_max = (1−ε)/ε = 49.0 at ε = 0.02, 70 trays at
  E_o = 0.7 — §5.5's table checks out.
Preset consistency (§4.2): initial A values all reproduce (NH₃ 1.5059,
  acetone 1.3889, SO₂ 1.50); A_min = 0.9 for generic/acetone/SO₂, 0.9195 for
  NH₃ — i.e. A < 1 is reachable in the UI (see C-04).
HETP form equivalence (§3.7): the brief's ln(1/A)/(1/A−1) form equals
  A·ln A/(A−1); algebra confirmed.

Errors (something is wrong)
C-01 — DECISION-xx cross-reference numbers do not match docs/DECISIONS.md
Severity: high for grading. The plan's §0 convention defines DECISION as
"Recorded in docs/DECISIONS.md", but 8 of the 10 markers point at the wrong
entry:
PLAN marker
Where
Points at in DECISIONS.md
Actually means
DECISION-01
§1.2
D-01 direct manipulation
✓ correct
DECISION-02
§1.3
D-02 keyboard nudging
✗ should be D-05 (SI units)
DECISION-03
§1.3
D-03 four-system presets
✗ no matching entry (see C-02)
DECISION-04
§1.3
D-04 SO₂ non-linearity
✗ no matching entry (see C-02)
DECISION-05
§2.3
D-05 SI units
✗ should be D-07 (shared suite)
DECISION-06
§3.2
D-06 multi-page site
✗ should be D-09 (L derived)
DECISION-07
§3.4
D-07 sibling impls
✗ should be D-15 (tray-height convention)
DECISION-08
§3.9
D-08 mole fractions
✗ should be D-14 (efficiency smearing)
DECISION-09
§4.1
D-09 L derived
✗ should be D-16 (constant H_OG)
DECISION-10
§5.1
D-10 fractional-stage rule
✗ should be D-21 (axes not normalised)
DECISION-11
§5.5
D-11 ε = 0.02
✓ correct
The same wrong number propagates to §8.1 ("a genuine DECISION-07") and §8.2
item 2 ("DECISION-07"), both of which mean D-15. Fix: renumber the ten
markers to the D-numbers in the right column (and fix the two §8 references).
Since the decision log is itself a graded artifact, broken traceability between
the two documents is the kind of thing a grader will notice.
C-02 — DECISION-03 (SVG not canvas) and DECISION-04 (no build step) are not logged
§1.3 marks both as decisions, but docs/DECISIONS.md contains no corresponding
entries. Either log them (per the plan's own rule that decisions live in the
log) or demote the markers. Both are defensible choices with real alternatives
(canvas would simplify the 70-tray rendering; a build step would allow
bundling), so they qualify as decisions worth recording.
C-03 — Riser counting is self-contradictory in §7.1, §7.3, and Phase 4
§7.1 says "Three complete risers; the third is truncated at y_in" —
a riser cannot be both complete and truncated. Kremser gives N = 2.459432 and
independent stepping gives fullSteps = 2: two complete risers plus a
third truncated at y_in. The naive value 2.375 = 2 + 0.375 confirms the same
count. §7.3 repeats the slip ("three complete risers, third truncated";
N = 2.952706 → two complete + partial). Most importantly, the Phase 4
acceptance criterion says "The staircase must show 3 complete risers with
the third truncated at y = 0.020" — read literally, a correct implementation
(2 complete + 1 partial) fails this criterion. Fix: "two complete risers,
the third truncated at y_in" in all three places.
C-04 — §3.3 prose invites the misreading that A < 1 is infeasible
"A < 1 means it does not [have enough capacity]; the column pinches at the
bottom (solvent-limited) and no finite height reaches the spec **once the
operating line touches equilibrium**." The trailing clause is technically true,
but the sentence as a whole reads as "A < 1 ⇒ infeasible." It is not: for any
feasible input (Δ_top > 0, Δ_bot > 0) with A < 1, Kremser returns a finite
positive N (verified: A = 0.9, R = 1.5 → N = 0.54), and **A < 1 is reachable in
the UI** — A_min is 0.9 (generic/acetone/SO₂) and 0.9195 (NH₃) at the
documented clamp positions. An implementing model could reasonably add a
spurious A >= 1 feasibility guard, which would wrongly reject valid
near-balanced designs on the NH₃ and SO₂ presets. Fix: state explicitly
that feasibility is Δ_top > 0 ∧ Δ_bot > 0 only, independent of A vs 1, and
that A < 1 simply means the bottom-pinch constraint is the tighter one.
C-05 — Inconsistent clamp at enum in the frozen API (minor)
clampYOut returns at: null|'top'|'bottom' and feasibility uses
'top'|'bottom', but clampXOut returns at: null|'min'|'max' (§2.4). §5.2's
required flow consumes these to set a single state.pinch flag. Unify on
'top'|'bottom' everywhere to match the pinch vocabulary used in §3.10, §5.1,
and the UI labels.

Omissions (something necessary is missing)
C-06 — The test sweep avoids the regimes the plan cares most about
staircase.test.mjs sweeps A ∈ [0.5, 5] × R ∈ [2, 100]. Two gaps:
R near 1 is excluded, yet the top clamp puts R at 1/0.98 ≈ 1.0204, and
   the near-pinch regime (R → 1.02, A → 1, N → 49) is precisely where the
   log1p/series branches (§3.8) do their work and where the staircase guard
   (200 steps) is closest to being tested. The sweep should start at R = 1.02.
A is capped at 5, but Handle 2's lower bound explicitly caps A at
   A_max = 20 (§5.1), and numeric inputs (Phase 7) can push A below 0.9.
   Suggest A ∈ [0.5, 20].
The highest-risk numerics in the whole plan are currently outside the swept
region.
C-07 — Nothing requires impl-a and impl-b to be built by different models
§0.2 mentions "a second model is implementing the same spec," but no phase
acceptance criterion or definition-of-done item requires the two
implementations to come from different models. The model-comparison.html
page (§6, Phase 9 item 5) and DECISIONS.md §3.2 are meaningless if one model
builds both. Fix: add to §10: "impl-a and impl-b are implemented by
different models."
C-08 — No amendment process for the frozen API
§2.3 correctly says an implementer who wants to change a test has found a plan
bug and should log it in DECISIONS.md — but the plan never says what happens
next: who approves a §2.4 v1.1 change, and how the already-built implementation
is kept in sync. A one-paragraph amendment protocol (owner approves, both
impls re-run the suite, D-number logged) closes the loop.
C-09 — solve() bundle has no direct test
§7.5 tests every exported function except the one the renderers actually
consume. A single consistency test — solve(inp).N === theoreticalStages(inp),
bundle.staircase.N === bundle.N, bundle.Z === packedHeight(inp), no NaN
in any bundle field over the clamp sweep — guards RISK-12 at the exact seam
where renderer bugs would enter.
C-10 — The log-guard/pinch equivalence is asserted but not pinned by a test
§3.8's "pleasing result" (the log1p argument hits −1 exactly at the bottom
pinch) is stated as verified. I confirmed it numerically, but §7.5 has no test
for it. Suggest adding to clamping.test.mjs: sweep x_out → x_out,pinch and
assert 1 + b(R−1) → 0⁺ and feasibility().feasible === false exactly at the
pinch. This is the single algebraic fact that makes "one place to enforce it"
true; it deserves a regression test.

Preferences (I would have done it differently)
C-11 — Pin the naive-rule regression values explicitly
§7.5 says the naive rule is "asserted different" on A and C. Assert the
exact values instead: 2.375000 (A) and 2.944745 (C), both confirmed above.
Named constants document the trap better than an inequality, and a future
refactor that accidentally "fixes" the naive computation into agreement would
be caught.
C-12 — Add an A ≈ 0.999999 demo affordance next to "Balanced (A = 1)"
stability.test.mjs covers the branch boundary in Node, but the most
error-prone path (§3.8, RISK-05) is only one click away from a grader in the
UI at exactly A = 1 — never at 1 ± 1e-7, where the branch selection
actually happens. A second button (or a long-press/shift-click on the balanced
preset) exercising the boundary in the demo path would close that gap.
C-13 — Take the plan's own recommendation on the SO₂ warning (§8.2 item 3)
The plan recommends an explicit on-screen note that the straight-line model is
a poor fit for SO₂, and I agree: it is the one preset included because the
model strains (D-04), and a footnote risks looking like the site is unaware of
its own weakest case. An explicit label turns the weakness into the teaching
point the plan intends.
C-14 — Date-stamp the "defaults unverified" note
§4's standing note is good practice. Adding the date the defaults were chosen
("illustrative since 2026-09-21, pending verification against Seader Ch. 6")
tells a viewer whether the note is a week or a year stale, at zero
implementation cost.

Checked and found correct (no action needed)
The Kremser ↔ staircase identity proof (§3.5.2): the algebra holds, and the
  1e-12 exactness test in §7.5 is justified rather than aspirational.
The §7.5 honesty note about N × HETP = Z being an identity: agreed, and
  the replacement checks (staircase vs. Kremser, Simpson and log-mean vs.
  Colburn) are genuinely independent routes. This is the strongest part of the
  verification strategy.
Pinch decoupling (§3.10): the linearity argument is correct, and the
  "position of the x_out clamp is independent of y_out" claim — the
  load-bearing fact for the whole interaction design — checks out
  algebraically.
The efficiency-smearing disclosure (§3.9, D-14): correctly identified as a
  simplification, exactly consistent with ceil(N/E_o), with the honest
  alternative (Murphree) deferred to §9 rather than hidden.
RISK-04's "double reciprocal" warning: both HETP forms verified equivalent;
  the g(2) = 2 ln 2 pin distinguishes the inverted form as claimed.
Phase 1 as a hard gate (§6): yes, it is a real gate — the acceptance criteria
  are checkable (bare-Node import proving no DOM dependency is a particularly
  good criterion) and the rationale (a wrong number and a wrong drawing
  agreeing with each other) is sound.
Axis autoscale formulae (§4.4): xMax/yMax correctly bracket all four
  presets including SO₂ (x_out,pinch = 1.25e-4), and the freeze-during-drag rule
  addresses RISK-09 at the right layer.
The A_max = 20 lower bound on x_out (§5.1) is correctly derived from the
  L/V cap, and the re-clamp rule in §5.2 covers the y_out-dependence.
