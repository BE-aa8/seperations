# Handoff prompt — build Implementation B

**How to use this file.** Everything below the line is a prompt to paste into a
second AI model — one that did **not** write `impl-a/`. It is written to be
self-contained. Pick the branch at the top that matches the model you are using.

Two practical notes before you send it:

- If the model has **no repository access**, you must paste `docs/PLAN.md`
  into the conversation alongside this prompt. It is long; if the model has a
  context limit, send §2 (structure and frozen API), §3 (physics), §4
  (defaults), §5 (interaction) and §7 (worked examples) first — those are the
  parts it cannot work without.
- When it finishes, save what it produces under `impl-b/` and run
  `PHYSICS_PATH=../../impl-b/js/physics.js npm test`. That command is the
  scoreboard for the whole exercise.

---

You are implementing a static educational website from a written specification.
Another AI model has already implemented the same specification independently.
**You must not look at that implementation.**

## Which situation are you in?

**If you have access to the repository** (you can read and write files): read
`docs/PLAN.md` and `impl-b/README.md`, then build directly into `impl-b/`.

**If you are a chat-only model**: the specification will be pasted into this
conversation. Produce complete file contents, one file at a time, with the
path for each one. The person will save them under `impl-b/`.

## The one hard rule

**Do not read `impl-a/`.** Not for reference, not to check an API, not to
"confirm" anything.

This is not about secrecy. The entire point of the exercise is to measure what
two different models produce from the same written specification. If you copy
from the first implementation, there is nothing left to measure and the person's
coursework loses the finding it was built to produce. If you find yourself
wanting to peek because the spec is unclear, that ambiguity is itself a result —
write it down and make a decision.

## What to build

Everything in `docs/PLAN.md` v1.1, Phases 0 through 10: an interactive
single-page demo plus five supporting pages.

The subject is a **dilute gas absorption** comparison. A tray column and a
packed column do the *same* duty — same solute, same entering compositions,
same outlet purity, same molar flow rates — and the site lets a student drag
two points on a y–x diagram and watch the two designs size themselves
differently.

Constraints, all non-negotiable:

- Static site. **No framework, no build step, no runtime dependencies.**
- Plain HTML, CSS, and JavaScript ES modules.
- SVG for all diagrams. Pointer Events for dragging (mouse *and* touch).
- **SI units only.**
- Tests use **Node's built-in test runner** — no test framework.
- Physics lives in a pure module with no DOM access, separate from rendering
  and interaction code.

Mirror the file structure in `docs/PLAN.md` §2.1:

```
impl-b/
├── index.html video.html transcript.html docs.html
│   model-comparison.html references.html
├── css/
└── js/
    ├── physics.js   ← PURE. The only module the test suite imports.
    ├── presets.js state.js scale.js drag.js
    ├── render-yx.js render-columns.js render-ntu.js
    │   render-profile.js render-summary.js
    ├── controls.js
    └── main.js
```

## The frozen contract

Your `js/physics.js` must export **exactly** these names. The shared test suite
imports this file and nothing else from your directory, so these are not
negotiable. (Full signatures and the input object are in `docs/PLAN.md` §2.4.)

```
liquidToGasRatio   liquidFlow        absorptionFactor   minLiquidToGasRatio
feasibility        theoreticalStages stepStaircase      ntuAnalytic
ntuNumeric         ntuLogMean        hetp               packedHeight
actualTrays        trayColumnHeight  gasProfilePacked   gasProfileTray
clampYOut          clampXOut         solve
```

Note that **`L` is not an input.** The two drag handles set `y_out` and
`x_out`; the overall mass balance then determines `L/V`, and hence `L`. This is
the single most important structural fact in the specification — if you add `L`
as an input you have built something different.

## Five requirements that are easy to get wrong

These are not hints. They are the places the specification predicts an
implementation will go wrong, and the test suite checks every one.

1. **The fractional-stage rule.** Stepping whole risers and then interpolating
   the last one *linearly in y* is **wrong**. On the default preset it gives
   `N = 2.375` where the correct answer is `2.459432` — an error that looks like
   rounding and often survives `ceil()` into the same tray count. The stepping
   recursion is geometric, not arithmetic, so the fractional stage interpolates
   **logarithmically**. See `docs/PLAN.md` §3.5.2 for the derivation. Related:
   `fullSteps` counts risers landing *at or below* `y_in` — the obvious
   `while (y < yIn)` loop counts the overshooting riser too and returns one too
   many.

2. **`A < 1` is feasible.** Do **not** add an `A >= 1` guard. Feasibility is
   `Δ_top > 0 AND Δ_bot > 0`, and nothing else. `A` drops below 1 on every
   preset as the user drags toward the minimum liquid rate — that is the site's
   headline interaction, and a spurious guard breaks exactly it.

3. **The `A → 1` singularity.** Every formula is 0/0 at `A = 1`. Use the
   `log1p`/`expm1` forms and the series branches with the thresholds given in
   `docs/PLAN.md` §3.8. Naive logarithms return `NaN` at exactly `A = 1`.

4. **Clamping.** All clamping happens in the state layer; renderers receive
   already-clamped values. A renderer that bounds where it *draws* while state
   holds the raw pointer value produces a picture that disagrees with the
   numbers — and only at the extremes, which is where a live demo goes. Clamps
   report **range-end and thermodynamic pinch as separate fields**: two of the
   four bounds are UI limits, not pinches, and labelling them "pinched" would
   teach the student something false.

5. **No `<input type="range">` anywhere.** The course instructor specifically
   asked for something other than the slider-driven tools they already demo in
   class. Core interactions must be direct manipulation — dragging the actual
   graphical objects. Numeric input fields for *secondary* parameters (m, flow
   rates, tray geometry) are fine and expected. Arrow-key nudging of a focused
   drag handle is fine and is required for accessibility.

## How your work is graded

Run the shared suite against your module:

```bash
PHYSICS_PATH=../../impl-b/js/physics.js npm test
```

All tests must pass **unmodified**. If a test looks wrong to you, that is a
finding about the specification, not permission to edit the test — say so in
your report instead.

Beyond the suite:

- `docs/PLAN.md` §7 gives three fully worked examples with every expected
  number. Reproduce all three.
- `docs/PLAN.md` §6 gives hand-checkable acceptance criteria for each phase.
- **Phase 1 is a hard gate**: get the physics module and its tests green before
  writing any rendering code. A wrong number and a wrong drawing can agree with
  each other, so pin the numbers down while they are the only thing on screen.

## What to report back when you are done

This matters as much as the code — it is the raw material for the project's
model-comparison write-up. Please write a short account covering:

1. **What was ambiguous** in the specification, and what you decided.
2. **Where you deviated** from the plan, and why.
3. **Which of the five requirements above you initially got wrong**, if any, and
   what caught it — the test suite, re-reading the spec, or your own checking.
   An honest answer here is more useful than a clean one.
4. **Anything you think the plan gets wrong**, physics or otherwise.
5. Roughly how much of the work felt mechanical versus genuinely uncertain.

Without this, the comparison has numbers but no explanation of them.
