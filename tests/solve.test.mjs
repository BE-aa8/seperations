import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr, pinchX, yOutBounds, xOutBounds } from './helpers/load-physics.mjs';
import { ALL, A, PRESET_INPUTS } from './fixtures/worked-examples.mjs';

/**
 * solve() is the ONLY thing renderers consume (PLAN §2.4, RISK-12). It is
 * therefore the exact seam where a renderer bug would enter, and until critique
 * C-09 it was the one exported function with no direct test.
 */

test('the bundle agrees with the individual functions', () => {
  for (const ex of ALL) {
    const b = P.solve(ex.inp);
    assert.equal(b.feasible, true, ex.name);
    assert.equal(b.N, P.theoreticalStages(ex.inp), `${ex.name}: N`);
    assert.equal(b.NOG, P.ntuAnalytic(ex.inp), `${ex.name}: NOG`);
    assert.equal(b.Z, P.packedHeight(ex.inp), `${ex.name}: Z`);
    assert.equal(b.HETP, P.hetp(ex.inp), `${ex.name}: HETP`);
    assert.equal(b.nActual, P.actualTrays(ex.inp), `${ex.name}: nActual`);
    assert.equal(b.ZTray, P.trayColumnHeight(ex.inp), `${ex.name}: ZTray`);
    assert.equal(b.A, P.absorptionFactor(ex.inp), `${ex.name}: A`);
    assert.equal(b.LoV, P.liquidToGasRatio(ex.inp), `${ex.name}: LoV`);
    assert.equal(b.L, P.liquidFlow(ex.inp), `${ex.name}: L`);
    assert.equal(b.LoVmin, P.minLiquidToGasRatio(ex.inp), `${ex.name}: LoVmin`);
    assert.ok(relErr(b.xOutPinch, ex.inp.yIn / ex.inp.m) < 1e-12, `${ex.name}: xOutPinch`);
  }
});

test('the bundle is internally consistent', () => {
  for (const ex of ALL) {
    const b = P.solve(ex.inp);
    assert.equal(b.staircase.N, b.N, `${ex.name}: staircase.N vs N`);
    assert.ok(relErr(b.Z, b.HOG * b.NOG) < 1e-12, `${ex.name}: Z = H_OG * N_OG`);
    assert.ok(relErr(b.N * b.HETP, b.Z) < 1e-9, `${ex.name}: N * HETP = Z`);
    assert.ok(relErr(b.Amin, b.LoVmin / ex.inp.m) < 1e-12, `${ex.name}: Amin`);
    assert.ok(relErr(b.LoVratio, b.LoV / b.LoVmin) < 1e-12, `${ex.name}: LoVratio`);
  }
});

test('the bundle reproduces the published worked examples', () => {
  for (const ex of ALL) {
    const b = P.solve(ex.inp);
    for (const key of ['N', 'NOG', 'HETP', 'Z', 'ZTray', 'LoVmin', 'Amin']) {
      assert.ok(relErr(b[key], ex.published[key]) < 1e-6,
        `${ex.name}: ${key} = ${b[key]}, published ${ex.published[key]}`);
    }
    assert.equal(b.nActual, ex.published.nActual, `${ex.name}: nActual`);
  }
});

test('driving forces in the bundle are the driving forces, not counts', () => {
  for (const ex of ALL) {
    const b = P.solve(ex.inp);
    const dTop = ex.inp.yOut - ex.inp.m * ex.inp.xIn;
    const dBot = ex.inp.yIn - ex.inp.m * ex.inp.xOut;
    assert.ok(relErr(b.driving.top, dTop) < 1e-12, `${ex.name}: driving.top`);
    assert.ok(relErr(b.driving.bottom, dBot) < 1e-12, `${ex.name}: driving.bottom`);
    // logMean must lie between the two endpoint driving forces.
    const lo = Math.min(dTop, dBot), hi = Math.max(dTop, dBot);
    assert.ok(b.driving.logMean >= lo - 1e-15 && b.driving.logMean <= hi + 1e-15,
      `${ex.name}: log-mean ${b.driving.logMean} outside [${lo}, ${hi}]`);
    // And it must reproduce N_OG via eq. (23).
    assert.ok(relErr((ex.inp.yIn - ex.inp.yOut) / b.driving.logMean, b.NOG) < 1e-9,
      `${ex.name}: log-mean does not reproduce N_OG`);
  }
});

test('axes bracket the terminal points of every preset', () => {
  for (const { id, inp } of PRESET_INPUTS) {
    const { axes } = P.solve(inp);
    assert.ok(axes.xMax > inp.xOut, `${id}: xMax ${axes.xMax} does not clear x_out`);
    assert.ok(axes.yMax > inp.yIn, `${id}: yMax ${axes.yMax} does not clear y_in`);
    assert.ok(axes.xMax > pinchX(inp), `${id}: xMax does not clear the pinch`);
    assert.ok(Number.isFinite(axes.xMax) && Number.isFinite(axes.yMax), id);
  }
});

test('infeasible input returns a structured result, never a throw or NaN flood', () => {
  const bad = { ...A.inp, xOut: 0.05 }; // well past the pinch
  const b = P.solve(bad);
  assert.equal(b.feasible, false);
  assert.equal(b.pinch, 'bottom');
  assert.ok(typeof b.reason === 'string' && b.reason.length > 0);
  assert.ok(b.axes && Number.isFinite(b.axes.xMax), 'axes must survive infeasibility');
});

test('no bundle field is NaN or undefined across the clamped region', () => {
  const nullable = new Set(['pinch']);
  let points = 0;
  for (const { id, inp } of PRESET_INPUTS) {
    const yr = yOutBounds(inp);
    for (let i = 0; i <= 40; i++) {
      const yOut = yr.lower + (i / 40) * (yr.upper - yr.lower);
      const withY = { ...inp, yOut };
      const xr = xOutBounds(withY);
      for (let j = 0; j <= 40; j++) {
        const probe = { ...withY, xOut: xr.lower + (j / 40) * (xr.upper - xr.lower) };
        const b = P.solve(probe);
        assert.equal(b.feasible, true, `${id}: infeasible inside the clamps`);
        walk(b, id, nullable, '');
        points++;
      }
    }
  }
  assert.ok(points > 6000, `expected a dense sweep, got ${points}`);

  function walk(obj, id, skip, path) {
    for (const [k, v] of Object.entries(obj)) {
      const where = path ? `${path}.${k}` : k;
      if (skip.has(k)) continue;
      assert.notEqual(v, undefined, `${id}: ${where} is undefined`);
      if (typeof v === 'number') {
        assert.ok(Number.isFinite(v), `${id}: ${where} = ${v}`);
      } else if (Array.isArray(v)) {
        for (const item of v) if (typeof item === 'object' && item) walk(item, id, skip, where);
      } else if (v && typeof v === 'object') {
        walk(v, id, skip, where);
      }
    }
  }
});
