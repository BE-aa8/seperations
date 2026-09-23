/**
 * The three worked examples from docs/PLAN.md §7, as data.
 *
 * `published` values are exactly the numbers printed in the plan, to the
 * precision the plan prints them. They are asserted at 1e-6 relative — the
 * precision six decimal places actually carries. Asserting harder would be
 * asserting against digits the document does not contain.
 */

const trayDefaults = { traySpacing: 0.6, hTop: 1.0, hBot: 1.0 };

/** Example A — generic preset, A = 2. The common case; maximises the C-03 trap. */
export const A = {
  name: 'A: generic, A = 2',
  inp: {
    m: 1.0,
    V: 100,
    xIn: 0.0,
    yIn: 0.02,
    yOut: 0.002,
    xOut: 0.009,
    HOG: 0.6,
    Eo: 0.7,
    ...trayDefaults,
  },
  published: {
    LoV: 2.0,
    A: 2.0,
    R: 10.0,
    N: 2.459432,
    NOG: 3.409496,
    g: 1.386294,
    HETP: 0.831777,
    Z: 2.045698,
    nActual: 4,
    ZTray: 4.4,
    LoVmin: 0.9,
    Amin: 0.9,
    xOutPinch: 0.02,
  },
  /** PLAN §3.5.3: two risers land at or below y_in; the third overshoots. */
  fullSteps: 2,
  /** The WRONG rule, pinned as a regression guard (critique C-11). */
  naiveN: 2.375,
  /** Gas composition leaving each theoretical stage, top-down (PLAN §7.1). */
  stageSequence: [0.002, 0.006, 0.014, 0.03],
  /** Gas leaving each ACTUAL tray, j = 1..nActual+1 (PLAN §7.1). */
  trayProfile: [0.002, 4.125629e-3, 7.380832e-3, 1.236587e-2, 0.02],
};

/** Example B — A = 1 exactly. All-integer; the removable singularity. */
export const B = {
  name: 'B: A = 1 exactly',
  inp: {
    m: 1.0,
    V: 100,
    xIn: 0.0,
    yIn: 0.02,
    yOut: 0.004,
    xOut: 0.016,
    HOG: 0.6,
    Eo: 0.7,
    ...trayDefaults,
  },
  published: {
    LoV: 1.0,
    A: 1.0,
    R: 5.0,
    N: 4.0,
    NOG: 4.0,
    g: 1.0,
    HETP: 0.6,
    Z: 2.4,
    nActual: 6,
    ZTray: 5.6,
    LoVmin: 0.8,
    Amin: 0.8,
    xOutPinch: 0.02,
  },
  /** The last riser lands EXACTLY on y_in, so all four are complete. */
  fullSteps: 4,
  /**
   * At A = 1 the recursion is arithmetic, so the naive rule coincidentally
   * gives the right answer here. This is exactly why a suite built only on
   * Example B would pass with the C-03 bug fully present (PLAN §7.2).
   */
  naiveN: 4.0,
  stageSequence: [0.004, 0.008, 0.012, 0.016, 0.02],
};

/** Example C — x_in != 0, m != 1, non-round A. */
export const C = {
  name: 'C: x_in > 0, A = 1.4',
  inp: {
    m: 0.8,
    V: 120,
    xIn: 0.001,
    yIn: 0.03,
    yOut: 0.005,
    xOut: 0.001 + 0.025 / 1.12, // L/V = 1.12 exactly -> A = 1.4
    HOG: 0.9,
    Eo: 0.65,
    traySpacing: 0.55,
    hTop: 1.0,
    hBot: 1.2,
  },
  published: {
    LoV: 1.12,
    A: 1.4,
    R: 6.952381,
    N: 2.952706,
    NOG: 3.477263,
    g: 1.177653,
    HETP: 1.059888,
    Z: 3.129537,
    nActual: 5,
    ZTray: 4.95,
    LoVmin: 0.684932,
    Amin: 0.856164,
    xOutPinch: 0.0375,
  },
  fullSteps: 2,
  naiveN: 2.944745,
  stageSequence: [0.005, 0.01088, 0.019112, 0.0306368],
};

export const ALL = [A, B, C];

/** All four shipped presets, for the reachability checks (critique C-04). */
export const PRESET_INPUTS = [
  { id: 'generic', m: 1.0, V: 100, xIn: 0.0, yIn: 0.02, yOut: 0.002, LoV0: 2.0 },
  { id: 'ammonia', m: 0.85, V: 100, xIn: 0.0005, yIn: 0.02, yOut: 0.002, LoV0: 1.275 },
  { id: 'acetone', m: 1.8, V: 120, xIn: 0.0, yIn: 0.015, yOut: 0.0015, LoV0: 2.5 },
  { id: 'so2', m: 40, V: 100, xIn: 0.0, yIn: 0.005, yOut: 0.0005, LoV0: 60.0 },
].map((p) => ({
  id: p.id,
  inp: {
    m: p.m,
    V: p.V,
    xIn: p.xIn,
    yIn: p.yIn,
    yOut: p.yOut,
    xOut: p.xIn + (p.yIn - p.yOut) / p.LoV0,
    HOG: 0.6,
    Eo: 0.7,
    ...trayDefaults,
  },
}));

/**
 * The naive fractional-stage rule: step whole risers, then linearly interpolate
 * the last one in y.
 *
 * This is WRONG (PLAN §3.5.2) and exists only so the suite can assert that the
 * implementation does NOT use it. Do not import this into implementation code.
 */
export function naiveFractionalStages(inp) {
  const A = inp.LoV !== undefined ? inp.LoV / inp.m : (inp.yIn - inp.yOut) / (inp.xOut - inp.xIn) / inp.m;
  const eq = inp.m * inp.xIn;
  const ys = [inp.yOut];
  let y = inp.yOut;
  let k = 0;
  while (y < inp.yIn && k < 500) {
    y = inp.yOut + A * (y - eq);
    ys.push(y);
    k += 1;
  }
  if (k === 0) return 0;
  const yPrev = ys[k - 1];
  const yLast = ys[k];
  if (yLast === yPrev) return k;
  return k - 1 + (inp.yIn - yPrev) / (yLast - yPrev);
}
