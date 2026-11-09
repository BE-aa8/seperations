/**
 * Pure absorption-column physics.
 *
 * This is the only implementation module consumed by the shared Node test suite.
 * It intentionally has no DOM/window/SVG dependencies and no formatting logic.
 */

const EPS = 0.02;
const A_MAX = 20;

function deltaTop(inp) {
  return inp.yOut - inp.m * inp.xIn;
}

function deltaBottom(inp) {
  return inp.yIn - inp.m * inp.xOut;
}

function deltaIn(inp) {
  return inp.yIn - inp.m * inp.xIn;
}

function liquidToGasRatioRaw(inp) {
  const dx = inp.xOut - inp.xIn;
  return dx === 0 ? Infinity : (inp.yIn - inp.yOut) / dx;
}

export function liquidToGasRatio(inp) {
  return liquidToGasRatioRaw(inp);
}

export function liquidFlow(inp) {
  return inp.V * liquidToGasRatio(inp);
}

export function absorptionFactor(inp) {
  return liquidToGasRatio(inp) / inp.m;
}

export function minLiquidToGasRatio(inp) {
  const denominator = inp.yIn / inp.m - inp.xIn;
  return denominator === 0 ? Infinity : (inp.yIn - inp.yOut) / denominator;
}

export function feasibility(inp) {
  const top = deltaTop(inp);
  const bottom = deltaBottom(inp);

  // These are the only thermodynamic feasibility conditions.
  // In particular, A < 1 can still be feasible.
  if (!(top > 0)) {
    return {
      feasible: false,
      pinch: "top",
      reason: "Top pinch: y_out must exceed m·x_in."
    };
  }

  if (!(bottom > 0)) {
    return {
      feasible: false,
      pinch: "bottom",
      reason: "Bottom pinch: x_out must remain below y_in/m."
    };
  }

  const ratio = liquidToGasRatio(inp);
  if (!(ratio > 0) || !Number.isFinite(ratio)) {
    return {
      feasible: false,
      pinch: "bottom",
      reason: "The terminal compositions do not define a positive finite liquid-to-gas ratio."
    };
  }

  return {
    feasible: true,
    pinch: null,
    reason: "Operating and equilibrium lines remain separated."
  };
}

/**
 * Kremser calculation written in the prescribed stable form.
 *
 * Near A = 1, ln(A) approaches zero while the numerator also approaches zero.
 * The series branch prevents cancellation and returns the exact balanced limit
 * at A = 1. Away from that band, log1p preserves precision in the numerator.
 */
function kremserN(A, R) {
  return Math.abs(A - 1) < 1e-6
    ? (R - 1) + (A - 1) * R * (1 - R) / 2
    : Math.log1p((A - 1) * R) / Math.log(A) - 1;
}

export function theoreticalStages(inp) {
  const A = absorptionFactor(inp);
  const dTop = deltaTop(inp);
  const dIn = deltaIn(inp);

  if (!(A > 0) || !(dTop > 0) || !(dIn > 0)) {
    return NaN;
  }

  const R = dIn / dTop;
  const logArgument = 1 + (A - 1) * R;

  if (!(logArgument > 0)) {
    return NaN;
  }

  return kremserN(A, R);
}

/**
 * Build the McCabe-Thiele staircase.
 *
 * The recursion is geometric except at A = 1, so the final fractional stage is
 * determined analytically by Kremser rather than by linear interpolation in y.
 */
export function stepStaircase(inp) {
  const A = absorptionFactor(inp);
  const dTop = deltaTop(inp);
  const dIn = deltaIn(inp);
  const N = theoreticalStages(inp);

  const vertices = [
    { x: inp.xIn, y: inp.yOut }
  ];

  if (!(A > 0) || !(dTop > 0) || !(dIn > 0) || !Number.isFinite(N)) {
    return { vertices, fullSteps: 0, N };
  }

  let y = inp.yOut;
  let fullSteps = 0;
  let risers = 0;

  while (risers < 200) {
    const xEq = y / inp.m;
    const yCandidate =
      inp.yOut + A * (y - inp.m * inp.xIn);

    vertices.push({ x: xEq, y });

    const tolerance = Math.max(1e-14, Math.abs(inp.yIn) * 1e-12);

    if (yCandidate < inp.yIn - tolerance) {
      vertices.push({ x: xEq, y: yCandidate });
      y = yCandidate;
      fullSteps += 1;
      risers += 1;
      continue;
    }

    // Truncate the final riser at the gas inlet composition.
    vertices.push({ x: xEq, y: inp.yIn });

    // An exactly landing riser counts as a complete stage.
    if (Math.abs(yCandidate - inp.yIn) <= tolerance) {
      fullSteps += 1;
    }

    break;
  }

  return { vertices, fullSteps, N };
}

export function ntuAnalytic(inp) {
  const A = absorptionFactor(inp);
  const dTop = deltaTop(inp);
  const dIn = deltaIn(inp);

  if (!(A > 0) || !(dTop > 0) || !(dIn > 0)) {
    return NaN;
  }

  const R = dIn / dTop;
  const b = 1 - 1 / A;
  const logArgument = 1 + b * (R - 1);

  if (!(logArgument > 0)) {
    return NaN;
  }

  // Colburn/overall-gas NTU. This branch is singular in naive form at A = 1.
  return Math.abs(b) < 1e-8
    ? (R - 1) - b * (R - 1) * (R - 1) / 2
    : Math.log1p(b * (R - 1)) / b;
}

export function ntuNumeric(inp, n = 1000) {
  n = Math.max(2, Math.floor(n));
  if (n % 2 !== 0) {
    n += 1;
  }

  const LoV = liquidToGasRatio(inp);
  const integrand = (y) => {
    const x = inp.xIn + (y - inp.yOut) / LoV;
    return 1 / (y - inp.m * x);
  };

  const a = inp.yOut;
  const b = inp.yIn;
  const h = (b - a) / n;

  let sum = integrand(a) + integrand(b);

  for (let i = 1; i < n; i += 1) {
    sum += (i % 2 === 1 ? 4 : 2) * integrand(a + i * h);
  }

  return h * sum / 3;
}

export function ntuLogMean(inp) {
  const top = deltaTop(inp);
  const bottom = deltaBottom(inp);

  if (!(top > 0) || !(bottom > 0)) {
    return NaN;
  }

  const deltaY = inp.yIn - inp.yOut;

  if (Math.abs(bottom - top) <= Math.max(1e-15, Math.abs(top) * 1e-14)) {
    return deltaY / top;
  }

  const deltaLm = (bottom - top) / Math.log(bottom / top);
  return deltaY / deltaLm;
}

export function hetp(inp) {
  const A = absorptionFactor(inp);

  if (!(A > 0)) {
    return NaN;
  }

  // g(A) = A ln(A)/(A-1). The series is the prescribed stable limit.
  const g = Math.abs(A - 1) < 1e-5
    ? 1 + (A - 1) / 2 - (A - 1) * (A - 1) / 6
    : A * Math.log(A) / (A - 1);

  return inp.HOG * g;
}

export function packedHeight(inp) {
  return inp.HOG * ntuAnalytic(inp);
}

export function actualTrays(inp) {
  const N = theoreticalStages(inp);

  if (!Number.isFinite(N) || !(inp.Eo > 0)) {
    return NaN;
  }

  return Math.ceil(N / inp.Eo);
}

export function trayColumnHeight(inp) {
  return actualTrays(inp) * inp.traySpacing + inp.hTop + inp.hBot;
}

export function gasProfilePacked(inp, zFromTop) {
  const Z = packedHeight(inp);
  const NOG = ntuAnalytic(inp);

  if (!(Z >= 0) || !(NOG >= 0)) {
    return NaN;
  }

  const z = Math.min(Math.max(0, zFromTop), Z);
  const A = absorptionFactor(inp);
  const dTop = deltaTop(inp);
  const b = 1 - 1 / A;

  if (Math.abs(A - 1) < 1e-8) {
    return inp.yOut + dTop * (z / inp.HOG);
  }

  return inp.m * inp.xIn
    + dTop * (Math.exp(b * z / inp.HOG) - 1 / A) / b;
}

export function gasProfileTray(inp, j) {
  const nAct = actualTrays(inp);
  const N = theoreticalStages(inp);

  if (!(nAct >= 1) || !Number.isFinite(N)) {
    return NaN;
  }

  const tray = Math.min(Math.max(1, j), nAct + 1);
  const s = 1 + (tray - 1) * N / nAct;
  const A = absorptionFactor(inp);
  const dTop = deltaTop(inp);

  if (Math.abs(A - 1) < 1e-8) {
    return inp.m * inp.xIn + s * dTop;
  }

  return inp.m * inp.xIn
    + dTop * (Math.pow(A, s) - 1) / (A - 1);
}

export function clampYOut(inp, yOutRaw) {
  const dIn = deltaIn(inp);
  const lower = inp.m * inp.xIn + EPS * dIn;
  const upper = inp.yIn - EPS * dIn;
  const value = Math.min(Math.max(yOutRaw, lower), upper);

  let at = null;
  if (yOutRaw < lower) at = "lower";
  if (yOutRaw > upper) at = "upper";

  return {
    value,
    clamped: at !== null,
    at,
    pinch: at === "lower" ? "top" : null
  };
}

export function clampXOut(inp, xOutRaw) {
  const xPinch = inp.yIn / inp.m;
  const lower =
    inp.xIn + (inp.yIn - inp.yOut) / (A_MAX * inp.m);
  const upper =
    inp.xIn + (1 - EPS) * (xPinch - inp.xIn);
  const value = Math.min(Math.max(xOutRaw, lower), upper);

  let at = null;
  if (xOutRaw < lower) at = "lower";
  if (xOutRaw > upper) at = "upper";

  return {
    value,
    clamped: at !== null,
    at,
    pinch: at === "upper" ? "bottom" : null
  };
}

function axes(inp) {
  return {
    xMax: 1.15 * (inp.yIn / inp.m),
    yMax: 1.15 * inp.yIn
  };
}

export function solve(inp) {
  const f = feasibility(inp);
  const LoV = liquidToGasRatio(inp);
  const L = liquidFlow(inp);
  const A = absorptionFactor(inp);
  const N = theoreticalStages(inp);
  const staircase = stepStaircase(inp);
  const NOG = ntuAnalytic(inp);
  const HETP = hetp(inp);
  const Z = packedHeight(inp);
  const nActual = actualTrays(inp);
  const ZTray = trayColumnHeight(inp);
  const LoVmin = minLiquidToGasRatio(inp);
  const Amin = LoVmin / inp.m;
  const LoVratio = LoV / LoVmin;
  const xOutPinch = inp.yIn / inp.m;

  const top = deltaTop(inp);
  const bottom = deltaBottom(inp);
  const logMean =
    top > 0 && bottom > 0
      ? Math.abs(bottom - top) <= Math.max(1e-15, Math.abs(top) * 1e-14)
        ? top
        : (bottom - top) / Math.log(bottom / top)
      : NaN;

  // Profile points are ordered from the physical bottom toward the physical top.
  // The renderer turns the discrete tray values into a staircase.
  const packedProfile = Array.from({ length: 101 }, (_, i) => {
    const zFromTop = Z * i / 100;
    return {
      zFromBottom: Z - zFromTop,
      y: gasProfilePacked(inp, zFromTop)
    };
  });

  const trayProfile = Array.from(
    { length: Math.max(1, Number.isFinite(nActual) ? nActual + 1 : 1) },
    (_, i) => {
      const zFromBottom = Number.isFinite(nActual) && nActual > 0
        ? i * ZTray / nActual
        : 0;
      const j = Number.isFinite(nActual) ? nActual + 1 - i : 1;
      return {
        zFromBottom,
        y: gasProfileTray(inp, j),
        tray: j
      };
    }
  );

  return {
    feasible: f.feasible,
    pinch: f.pinch,
    reason: f.reason,
    LoV,
    LoVratio,
    L,
    A,
    N,
    staircase,
    NOG,
    HETP,
    Z,
    HOG: inp.HOG,
    nActual,
    ZTray,
    LoVmin,
    Amin,
    xOutPinch,
    driving: {
      top,
      bottom,
      logMean
    },
    terminals: {
      xIn: inp.xIn,
      yOut: inp.yOut,
      xOut: inp.xOut,
      yIn: inp.yIn,
      m: inp.m
    },
    inputs: {
      V: inp.V,
      Eo: inp.Eo,
      traySpacing: inp.traySpacing,
      hTop: inp.hTop,
      hBot: inp.hBot
    },
    profiles: {
      packed: packedProfile,
      tray: trayProfile
    },
    axes: axes(inp)
  };
}
