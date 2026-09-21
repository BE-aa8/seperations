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
