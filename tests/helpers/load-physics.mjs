/**
 * Resolves which implementation the suite grades.
 *
 *   npm test                                          -> impl-a (default)
 *   PHYSICS_PATH=../../impl-b/js/physics.js npm test  -> impl-b
 *
 * Both implementations must pass this suite UNMODIFIED (PLAN §2.3). If a test
 * looks wrong to an implementer, that is a finding about the plan and goes
 * through the amendment protocol in PLAN §2.3 (D-30) — not a patch to the test.
 */
const path = process.env.PHYSICS_PATH ?? '../../impl-a/js/physics.js';

export const physics = await import(new URL(path, import.meta.url));
export const implPath = path;

/** Relative-difference assert helper. */
export function relErr(actual, expected) {
  if (expected === 0) return Math.abs(actual);
  return Math.abs((actual - expected) / expected);
}

// ---------------------------------------------------------------------------
// Contract-only derivations
// ---------------------------------------------------------------------------
//
// The suite must exercise the PUBLISHED contract (PLAN §2.4) and nothing else.
// An earlier version of these tests called `gFactor`, `xOutPinch`, `yOutRange`,
// `xOutRange` and the `TOL_*` constants directly — all of which impl-a happens
// to export but the specification never required. That made "both
// implementations pass the same unmodified suite" untestable: it was really
// "impl-b must also be impl-a". impl-b exposed this by implementing the
// contract exactly and failing 16 assertions for reasons that had nothing to do
// with its physics.
//
// Everything below is derived from the frozen API instead.

/** g(A) = N_OG/N = HETP/H_OG. Derived from `hetp`, which IS in the contract. */
export function gOf(inp) {
  return physics.hetp(inp) / inp.HOG;
}

/** The bottom-pinch composition. `solve().xOutPinch` is a documented bundle field. */
export function pinchX(inp) {
  return physics.solve(inp).xOutPinch;
}

/** y_out bounds, recovered by driving the documented clamp to each extreme. */
export function yOutBounds(inp) {
  return {
    lower: physics.clampYOut(inp, -Infinity).value,
    upper: physics.clampYOut(inp, Infinity).value,
  };
}

/** x_out bounds, likewise. */
export function xOutBounds(inp) {
  return {
    lower: physics.clampXOut(inp, -Infinity).value,
    upper: physics.clampXOut(inp, Infinity).value,
  };
}

/**
 * The branch thresholds are PRESCRIBED by PLAN §3.8, so the suite pins the
 * documented literals rather than reading them back out of the implementation.
 * Asserting against an implementation's own constant proves nothing.
 */
export const SPEC_TOL_N = 1e-6;
export const SPEC_TOL_NOG = 1e-8;
export const SPEC_TOL_G = 1e-5;
