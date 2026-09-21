# Implementation B — the second model's slot

This directory is reserved for an **independent implementation of the same
specification** that produced `impl-a/`.

## The rule

`impl-a/` and `impl-b/` must be built by **different AI models**. If one model
builds both, `model-comparison.html` has nothing to compare and the assignment's
comparison requirement is unmet. Record which model built which in
`docs/DECISIONS.md` §1.

Do **not** read `impl-a/` before building this one. The comparison measures what
two models produce from the same written specification; copying from the first
implementation destroys the only thing being measured. Work from
`docs/PLAN.md` alone.

## What to build

Everything described in `docs/PLAN.md` v1.1, Phases 0–10. Mirror the structure
of `impl-a/`:

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

## The contract

`js/physics.js` must export exactly the signatures frozen in `docs/PLAN.md`
§2.4. The test suite imports that file and nothing else from this directory, so
those names and shapes are not negotiable.

Non-negotiable properties, all asserted by the suite:

- **No DOM access in `physics.js`.** It must import cleanly in bare Node:
  `node -e "import('./impl-b/js/physics.js')"`.
- **The exact fractional-stage rule** (PLAN §3.5.2). The intuitive rule — step
  whole risers, interpolate the last linearly — is wrong and the suite asserts
  the wrong value explicitly to catch it.
- **`A < 1` is feasible.** Do not add an `A >= 1` guard; it would break the
  tool's headline interaction. Feasibility is `Δ_top > 0 ∧ Δ_bot > 0`, nothing
  more.
- **The prescribed numerical branches near `A = 1`** (PLAN §3.8), with the
  documented thresholds.
- **Clamps report range-end and thermodynamic pinch separately** (PLAN §2.4).
- **No `<input type="range">` anywhere.** Core interactions are direct
  manipulation; this is the course instructor's explicit requirement.

## Running the suite against this implementation

```bash
PHYSICS_PATH=../../impl-b/js/physics.js npm test
# or
npm run test:b
```

All tests must pass **unmodified**. If a test looks wrong, that is a finding
about the plan, not a licence to edit the test: follow the amendment protocol in
`docs/PLAN.md` §2.3 — log it in `docs/DECISIONS.md`, get the owner's decision,
and if the API changes, every existing implementation updates and re-runs the
suite.

## Where to check your work

`docs/PLAN.md` §6 lists hand-checkable acceptance criteria per phase, and §7
gives three fully worked examples with every expected number. Phase 1 (physics
plus tests green) is a hard gate — write no rendering code before it passes.
