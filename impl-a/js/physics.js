/**
 * physics.js — dilute gas absorption: tray (staged) and packed (continuous).
 *
 * PURE MODULE. Contract (docs/PLAN.md §2.2):
 *   - No `document`, `window`, SVG, or any DOM type.
 *   - No module-level mutable state.
 *   - No formatting or rounding for display.
 *   - Never throws for user-reachable input; infeasible input is reported
 *     structurally via feasibility() / solve().feasible.
 *
 * Model (PLAN §3.1): dilute, isothermal, isobaric, constant L and V, straight
 * equilibrium y* = m*x through the origin, counter-current, mole fractions.
 *
 * Equation numbers in comments refer to docs/PLAN.md §3.
 */

// ---------------------------------------------------------------------------
// Constants (PLAN §5.1, §5.5, §3.8)
// ---------------------------------------------------------------------------

/** Fraction of Delta_in retained as driving force at a clamped end. PLAN §5.5, D-11. */
export const EPS_CLAMP = 0.02;

/** Cap on the absorption factor, bounding Handle 2's lower range. PLAN §5.1. */
export const A_MAX = 20;

/** Hard guard on staircase iteration. Reachable max is 49; 200 means "bug". PLAN §5.5. */
export const MAX_STAIRCASE_STEPS = 200;

/**
 * Branch thresholds for the A -> 1 removable singularity (PLAN §3.8).
 * These are part of the spec, not taste. Changing them changes which code path
 * the "Near-balanced (A = 1 - 5e-7)" demo button exercises (D-31).
 */
export const TOL_N = 1e-6; // |A - 1| below this -> series form for N
export const TOL_NOG = 1e-8; // |b| below this   -> series form for N_OG
export const TOL_G = 1e-5; // |A - 1| below this -> series form for g(A)

// ---------------------------------------------------------------------------
// Equilibrium seam (PLAN §9, D-25)
// ---------------------------------------------------------------------------

/**
 * The equilibrium relation. Every equilibrium evaluation in this module and in
 * the renderers goes through here.
 *
 * This is deliberately a function rather than an inlined `m * x`: it is the seam
 * that lets future phase F-4 (curved equilibrium) be added rather than
 * retrofitted. Do not inline it.
 *
 * @param {AbsorptionInput} inp
 * @param {number} x liquid mole fraction
 * @returns {number} gas mole fraction in equilibrium with x
 */
export function yStar(inp, x) {
  return inp.m * x;
}

// ---------------------------------------------------------------------------
// Basic groups (PLAN §3.2, §3.3)
// ---------------------------------------------------------------------------

/** L/V from the overall solute balance, eq. (1). L is DERIVED, never entered (D-09). */
export function liquidToGasRatio(inp) {
  return (inp.yIn - inp.yOut) / (inp.xOut - inp.xIn);
}

/** Liquid molar flow rate [kmol/h]. */
export function liquidFlow(inp) {
  return inp.V * liquidToGasRatio(inp);
}

/** Absorption factor A = L/(m*V) = (L/V)/m, eq. (3). */
export function absorptionFactor(inp) {
  return liquidToGasRatio(inp) / inp.m;
}

/**
 * Driving forces and the non-dimensional ratio R, eq. (4)-(7).
 * @returns {{dTop:number, dBot:number, dIn:number, R:number}}
 */
function deltas(inp) {
  const eqAtXIn = yStar(inp, inp.xIn);
  const dTop = inp.yOut - eqAtXIn; // eq. (4)
  const dBot = inp.yIn - yStar(inp, inp.xOut); // eq. (5)
  const dIn = inp.yIn - eqAtXIn; // eq. (6)
  return { dTop, dBot, dIn, R: dIn / dTop }; // eq. (7)
}

/** Minimum L/V, at the bottom pinch, eq. (33). Depends on yOut. */
export function minLiquidToGasRatio(inp) {
  return (inp.yIn - inp.yOut) / (inp.yIn / inp.m - inp.xIn);
}

/** The composition at which the operating line touches equilibrium at the bottom. */
export function xOutPinch(inp) {
  return inp.yIn / inp.m;
}

// ---------------------------------------------------------------------------
// Feasibility (PLAN §3.10, §3.8; critique C-04)
// ---------------------------------------------------------------------------

/**
 * Feasibility is EXACTLY dTop > 0 AND dBot > 0 (eq. 31-32), and nothing else.
 *
 * It does NOT depend on whether A is above or below 1. A < 1 is perfectly
 * feasible and is reachable on all four presets at the documented clamp
 * positions (A = 0.918 generic/acetone/SO2, 0.938 NH3). Adding an `A >= 1`
 * guard here would wrongly reject valid near-balanced designs in exactly the
 * regime this site exists to demonstrate. See PLAN §3.3.
 *
 * @returns {{feasible:boolean, pinch:null|'top'|'bottom', reason:string}}
 */
export function feasibility(inp) {
  if (!(inp.xOut > inp.xIn)) {
    return {
      feasible: false,
      pinch: null,
      reason: 'x_out must exceed x_in: the liquid must pick up solute.',
    };
  }
  if (!(inp.yIn > inp.yOut)) {
    return {
      feasible: false,
      pinch: null,
      reason: 'y_out must be below y_in: the gas must be cleaned, not enriched.',
    };
  }
  const { dTop, dBot } = deltas(inp);
  if (!(dTop > 0)) {
    return {
      feasible: false,
      pinch: 'top',
      reason:
        `Top pinch: y_out cannot reach or pass m*x_in = ${yStar(inp, inp.xIn)}. ` +
        'No column of any height can produce gas leaner than equilibrium with ' +
        'the entering liquid.',
    };
  }
  if (!(dBot > 0)) {
    return {
      feasible: false,
      pinch: 'bottom',
      reason:
        `Bottom pinch: x_out cannot reach or pass y_in/m = ${xOutPinch(inp)}. ` +
        'The liquid rate has fallen to its minimum.',
    };
  }
  return { feasible: true, pinch: null, reason: '' };
}

// ---------------------------------------------------------------------------
// Tray column: Kremser (PLAN §3.4, §3.8)
// ---------------------------------------------------------------------------

/**
 * Theoretical stages, eq. (8)/(9), in the numerically stable form of PLAN §3.8.
 *
 * Uses log1p via the rearrangement
 *   ln[(1-1/A)R + 1/A] = ln[1 + (A-1)R] - ln A
 * which is why the trailing `- 1` appears. Do NOT "simplify" this back to a
 * naive logarithm: the naive form returns NaN at exactly A = 1.
 */
export function theoreticalStages(inp) {
  const A = absorptionFactor(inp);
  const { R } = deltas(inp);
  if (Math.abs(A - 1) < TOL_N) {
    // First two terms of the expansion about A = 1 (PLAN §3.7).
    return R - 1 + ((A - 1) * R * (1 - R)) / 2;
  }
  return Math.log1p((A - 1) * R) / Math.log(A) - 1;
}

/** Actual trays, eq. (10). ceil AFTER dividing by E_o, never before (RISK-07). */
export function actualTrays(inp) {
  return Math.ceil(theoreticalStages(inp) / inp.Eo);
}

/**
 * Tray column height, eq. (11): N_act * S + h_top + h_bot.
 *
 * CONVENTION, NOT PHYSICS (D-15), but SETTLED: the project owner chose this
 * form on 2026-09-21. The common alternative is (N_act - 1) * S, since n trays
 * have n-1 gaps between them, and the difference is one tray spacing (~0.6 m
 * here) -- so it stays a convention rather than a fact, and the site says so.
 * Do not switch it: every worked example and test assertion depends on it.
 */
export function trayColumnHeight(inp) {
  return actualTrays(inp) * inp.traySpacing + inp.hTop + inp.hBot;
}

// ---------------------------------------------------------------------------
// The staircase (PLAN §3.5)
// ---------------------------------------------------------------------------

/**
 * (A^n - 1)/(A - 1), the geometric sum, evaluated stably including near A = 1
 * (where it tends to n).
 */
function geometricSum(A, n) {
  const e = A - 1;
  if (Math.abs(e) < 1e-9) return n;
  return Math.expm1(n * Math.log1p(e)) / e;
}

/**
 * Gas composition leaving theoretical stage `n`, counted from the top, for
 * continuous (fractional) n. Inverts Delta_n = dTop*(A^n - 1)/(A - 1).
 * y(1) = y_out; y(N+1) = y_in.
 */
function stageComposition(inp, n) {
  const A = absorptionFactor(inp);
  const { dTop } = deltas(inp);
  return yStar(inp, inp.xIn) + dTop * geometricSum(A, n);
}

/**
 * Step the McCabe-Thiele staircase and report the geometry.
 *
 * Stepping runs TOP-DOWN from (x_in, y_out): horizontal to the equilibrium
 * line, then vertical to the operating line. One horizontal + one vertical pair
 * is one theoretical stage. In ABSORPTION the operating line lies ABOVE the
 * equilibrium line (RISK-02) — if your staircase diverges, you are stepping the
 * wrong way.
 *
 * `fullSteps` is the number of risers whose top lies AT OR BELOW y_in
 * (PLAN §3.5.3). It is floor(N), except when N is an exact integer, in which
 * case the last riser lands exactly on y_in and is complete. It is derived from
 * the analytic N rather than from the loop, because a loop of the form
 * `while (y < yIn)` counts the OVERSHOOTING riser too and so returns
 * fullSteps + 1 — the trap that produced the "three complete risers" error in
 * PLAN v1.0 (critique C-03).
 *
 * `N` is analytic (eq. 16/17 == eq. 8/9) and must never be recomputed from
 * fullSteps.
 *
 * @returns {{vertices:{x:number,y:number}[], fullSteps:number, N:number,
 *            risersDrawn:number, truncated:boolean, guardHit:boolean}}
 */
export function stepStaircase(inp) {
  const N = theoreticalStages(inp);

  const rounded = Math.round(N);
  const isInteger = Math.abs(N - rounded) < 1e-9;
  const fullSteps = isInteger ? rounded : Math.floor(N);
  const risersDrawn = isInteger ? rounded : fullSteps + 1;
  const guardHit = risersDrawn > MAX_STAIRCASE_STEPS;

  const toDraw = Math.min(risersDrawn, MAX_STAIRCASE_STEPS);
  const vertices = [{ x: inp.xIn, y: inp.yOut }];

  let y = inp.yOut;
  for (let i = 1; i <= toDraw; i++) {
    // Horizontal to the equilibrium line: y = m*x  =>  x = y/m.
    const xEq = y / inp.m;
    vertices.push({ x: xEq, y });

    // Vertical to the operating line, truncated at y_in on the final riser.
    let yNext = stageComposition(inp, i + 1);
    if (yNext > inp.yIn) yNext = inp.yIn;
    vertices.push({ x: xEq, y: yNext });
    y = yNext;
  }

  return {
    vertices,
    fullSteps,
    N,
    risersDrawn,
    truncated: !isInteger,
    guardHit,
  };
}

// ---------------------------------------------------------------------------
// Packed column: NTU (PLAN §3.6, §3.8)
// ---------------------------------------------------------------------------

/**
 * Overall gas-phase transfer units, eq. (20)/(21) — Colburn.
 *
 * N_OG, not N_OL or N_G: only the overall GAS-phase count pairs with H_OG to
 * give Z (RISK-03).
 */
export function ntuAnalytic(inp) {
  const A = absorptionFactor(inp);
  const b = 1 - 1 / A;
  const { R } = deltas(inp);
  if (Math.abs(b) < TOL_NOG) {
    return R - 1 - (b * (R - 1) * (R - 1)) / 2;
  }
  return Math.log1p(b * (R - 1)) / b;
}

/**
 * N_OG by Simpson's rule on the defining integral, eq. (18). Independent of the
 * closed form — this is one of the two checks that genuinely validates the
 * physics rather than restating a definition (PLAN §7.5).
 *
 * The integrand is 1/(y - y*), with y - y* linear in y by eq. (19).
 */
export function ntuNumeric(inp, n = 1000) {
  let m = Math.max(2, Math.floor(n));
  if (m % 2 !== 0) m += 1; // Simpson needs an even interval count

  const h = (inp.yIn - inp.yOut) / m;
  let sum = ntuIntegrand(inp, inp.yOut) + ntuIntegrand(inp, inp.yIn);
  for (let i = 1; i < m; i++) {
    sum += ntuIntegrand(inp, inp.yOut + i * h) * (i % 2 === 1 ? 4 : 2);
  }
  return (sum * h) / 3;
}

/**
 * The NTU integrand, 1/(y - y*), at gas composition y.
 *
 * Exported so the NTU plot can draw the curve it shades without doing any
 * physics of its own (RISK-12). Uses eq. (19): the driving force is linear in
 * y, y - y* = (1 - 1/A)*(y - m*x_in) + dTop/A.
 */
export function ntuIntegrand(inp, y) {
  return 1 / drivingForceAt(inp, y);
}

/** The local driving force y - y* at gas composition y, eq. (19). */
export function drivingForceAt(inp, y) {
  const A = absorptionFactor(inp);
  const b = 1 - 1 / A;
  const { dTop } = deltas(inp);
  return b * (y - yStar(inp, inp.xIn)) + dTop / A;
}

/**
 * N_OG via the log-mean driving force, eq. (23).
 *
 * A genuinely independent algebraic route: it never touches A or R. The
 * strongest single check in the suite (PLAN §7.5).
 */
export function ntuLogMean(inp) {
  const { dTop, dBot } = deltas(inp);
  const r = dBot / dTop;
  // Log-mean tends to the arithmetic mean as r -> 1 (the A = 1 case, where the
  // driving force is uniform up the column and the NTU area is a rectangle).
  const logMean =
    Math.abs(r - 1) < 1e-7 ? dTop * (1 + (r - 1) / 2) : (dTop * (r - 1)) / Math.log(r);
  return (inp.yIn - inp.yOut) / logMean;
}

/** Packed height, eq. (22). */
export function packedHeight(inp) {
  return inp.HOG * ntuAnalytic(inp);
}

// ---------------------------------------------------------------------------
// The link between them (PLAN §3.7)
// ---------------------------------------------------------------------------

/**
 * g(A) = N_OG/N = A*ln(A)/(A - 1), eq. (24). g(1) = 1.
 *
 * NOTE the direction: HETP = H_OG * g(A), NOT H_OG / g(A). Both forms circulate
 * in the literature and they differ by a double reciprocal (RISK-04). The pin
 * g(2) = 2*ln(2) = 1.3862944 distinguishes them.
 */
export function gFactor(A) {
  const e = A - 1;
  if (Math.abs(e) < TOL_G) {
    return 1 + e / 2 - (e * e) / 6; // expansion, eq. (26)
  }
  return (A * Math.log(A)) / e;
}

/** HETP = H_OG * g(A), eq. (25). Equals H_OG exactly when A = 1. */
export function hetp(inp) {
  return inp.HOG * gFactor(absorptionFactor(inp));
}

// ---------------------------------------------------------------------------
// Composition profiles (PLAN §3.9)
// ---------------------------------------------------------------------------

/**
 * Gas composition at height `zFromTop` metres below the top of the PACKED
 * column, eq. (27)/(28).
 *
 * Measured from the TOP: y(0) = y_out (lean, gas leaving) and y(Z) = y_in
 * (rich, gas entering at the bottom). Getting this end backwards inverts the
 * curve while leaving it smooth and monotone, so it looks fine (RISK-08).
 *
 * Written using expm1 so the A -> 1 limit (a straight line in height) is
 * approached smoothly:
 *   y = m*x_in + dTop * (1 + expm1(b*zeta)/b),   b = 1 - 1/A
 */
export function gasProfilePacked(inp, zFromTop) {
  const A = absorptionFactor(inp);
  const b = 1 - 1 / A;
  const { dTop } = deltas(inp);
  const zeta = zFromTop / inp.HOG;

  if (Math.abs(b) < TOL_NOG) {
    return inp.yOut + dTop * zeta; // eq. (28): linear in height
  }
  return yStar(inp, inp.xIn) + dTop * (1 + Math.expm1(b * zeta) / b);
}

/**
 * Gas composition leaving actual tray `j`, counted from the top (j = 1 is the
 * top tray). j = nActual + 1 denotes the gas ENTERING the bottom tray, i.e.
 * y_in. Eq. (29)/(30).
 *
 * This is an EFFICIENCY-SMEARING model (D-14), not a rigorous per-tray Murphree
 * calculation: it spreads the theoretical stages evenly over the actual trays,
 * so each actual tray delivers N/nActual (<= E_o) theoretical stages. Chosen
 * because it is exactly consistent with nActual = ceil(N/E_o) and lands exactly
 * on y_out and y_in at the endpoints.
 */
export function gasProfileTray(inp, j) {
  const N = theoreticalStages(inp);
  const nAct = actualTrays(inp);
  const s = 1 + ((j - 1) * N) / nAct;
  return stageComposition(inp, s);
}

// ---------------------------------------------------------------------------
// Clamping (PLAN §2.4, §5.1, §5.2)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ClampResult
 * @property {number}  value    the clamped value, always within range
 * @property {boolean} clamped  true if the raw input was outside the range
 * @property {null|'lower'|'upper'} at     which end of the RANGE was hit
 * @property {null|'top'|'bottom'}  pinch  which THERMODYNAMIC pinch, if any
 *
 * `at` and `pinch` are separate on purpose (D-28). Two of the four bounds are
 * not pinches at all: clampYOut's upper bound is a degenerate-separation guard
 * and clampXOut's lower bound is the A_MAX liquid-rate cap. Calling either a
 * "pinch" in the UI would tell a student that thermodynamics forbids something
 * that is merely a range limit.
 */

function clampResult(value, raw, lower, upper, lowerPinch, upperPinch) {
  if (raw < lower) return { value: lower, clamped: true, at: 'lower', pinch: lowerPinch };
  if (raw > upper) return { value: upper, clamped: true, at: 'upper', pinch: upperPinch };
  return { value, clamped: false, at: null, pinch: null };
}

/** Allowed range for y_out. Lower bound is the top pinch; upper is not a pinch. */
export function yOutRange(inp) {
  const eqAtXIn = yStar(inp, inp.xIn);
  const dIn = inp.yIn - eqAtXIn; // eq. (6); independent of y_out
  return {
    lower: eqAtXIn + EPS_CLAMP * dIn,
    upper: inp.yIn - EPS_CLAMP * dIn,
  };
}

/** Allowed range for x_out. Upper bound is the bottom pinch; lower is the A_MAX cap. */
export function xOutRange(inp) {
  const upper = inp.xIn + (1 - EPS_CLAMP) * (xOutPinch(inp) - inp.xIn);
  // L/V <= A_MAX*m  =>  x_out >= x_in + (y_in - y_out)/(A_MAX*m)
  const lower = inp.xIn + (inp.yIn - inp.yOut) / (A_MAX * inp.m);
  return { lower: Math.min(lower, upper), upper };
}

export function clampYOut(inp, yOutRaw) {
  const { lower, upper } = yOutRange(inp);
  return clampResult(yOutRaw, yOutRaw, lower, upper, 'top', null);
}

export function clampXOut(inp, xOutRaw) {
  const { lower, upper } = xOutRange(inp);
  return clampResult(xOutRaw, xOutRaw, lower, upper, null, 'bottom');
}

// ---------------------------------------------------------------------------
// The derived bundle (PLAN §2.4)
// ---------------------------------------------------------------------------

/**
 * Everything a renderer needs, computed once per state change.
 *
 * Renderers consume THIS and nothing else — they must not recompute physics
 * (RISK-12). If a renderer needs another number, add it here.
 */
export function solve(inp) {
  const feas = feasibility(inp);
  const { dTop, dBot, dIn } = deltas(inp);
  const A = absorptionFactor(inp);
  const LoV = liquidToGasRatio(inp);

  if (!feas.feasible) {
    return {
      feasible: false,
      pinch: feas.pinch,
      reason: feas.reason,
      LoV,
      L: liquidFlow(inp),
      A,
      axes: axesFor(inp),
    };
  }

  const N = theoreticalStages(inp);
  const NOG = ntuAnalytic(inp);
  const staircase = stepStaircase(inp);
  const LoVmin = minLiquidToGasRatio(inp);

  return {
    feasible: true,
    pinch: null,
    reason: '',

    LoV,
    L: liquidFlow(inp),
    A,

    N,
    staircase,

    NOG,
    HOG: inp.HOG,
    HETP: hetp(inp),
    Z: packedHeight(inp),

    nActual: actualTrays(inp),
    ZTray: trayColumnHeight(inp),

    LoVmin,
    Amin: LoVmin / inp.m,
    LoVratio: LoV / LoVmin,
    xOutPinch: xOutPinch(inp),

    // Driving forces themselves, not transfer-unit counts. `logMean` is the
    // log-mean of top and bottom, i.e. Delta_lm from eq. (23).
    driving: {
      top: dTop,
      bottom: dBot,
      inlet: dIn,
      logMean: (inp.yIn - inp.yOut) / ntuLogMean(inp),
    },

    axes: axesFor(inp),
  };
}

/** Suggested axis ranges, PLAN §4.4. Recompute on preset change; freeze during a drag. */
export function axesFor(inp) {
  return {
    xMax: 1.15 * xOutPinch(inp),
    yMax: 1.15 * inp.yIn,
  };
}
