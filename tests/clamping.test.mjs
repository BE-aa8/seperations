import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr, pinchX, yOutBounds, xOutBounds } from './helpers/load-physics.mjs';
import { ALL, A, PRESET_INPUTS } from './fixtures/worked-examples.mjs';

const EPS = 0.02; // PLAN §5.5, D-11
const AMAX = 20;

test('clampYOut lower bound is the top pinch', () => {
  for (const ex of ALL) {
    const { m, xIn, yIn } = ex.inp;
    const dIn = yIn - m * xIn;
    const want = m * xIn + EPS * dIn;
    const r = P.clampYOut(ex.inp, -1);
    assert.ok(relErr(r.value, want) < 1e-12, `${ex.name}: lower bound`);
    assert.equal(r.clamped, true);
    assert.equal(r.at, 'lower');
    assert.equal(r.pinch, 'top');
  }
});

test('clampYOut upper bound is NOT a pinch (D-28)', () => {
  const r = P.clampYOut(A.inp, 1);
  assert.equal(r.clamped, true);
  assert.equal(r.at, 'upper');
  assert.equal(r.pinch, null, 'the degenerate-separation guard is not a pinch');
});

test('clampXOut upper bound is the bottom pinch, at 0.98 of the way', () => {
  for (const ex of ALL) {
    const { m, xIn, yIn } = ex.inp;
    const want = xIn + (1 - EPS) * (yIn / m - xIn);
    const r = P.clampXOut(ex.inp, 1e9);
    assert.ok(relErr(r.value, want) < 1e-12, `${ex.name}: upper bound`);
    assert.equal(r.at, 'upper');
    assert.equal(r.pinch, 'bottom');
  }
  // Phase 3 criterion: on the generic preset this is 0.98 * 0.020 = 0.0196.
  assert.ok(relErr(P.clampXOut(A.inp, 1e9).value, 0.0196) < 1e-12);
});

test('clampXOut lower bound is the A_MAX cap, NOT a pinch (D-28)', () => {
  const r = P.clampXOut(A.inp, -1);
  assert.equal(r.clamped, true);
  assert.equal(r.at, 'lower');
  assert.equal(r.pinch, null, 'the liquid-rate cap is a UI limit, not thermodynamics');
  const inpAt = { ...A.inp, xOut: r.value };
  assert.ok(P.absorptionFactor(inpAt) <= AMAX + 1e-9, 'A exceeds A_MAX at the lower clamp');
});

test('values inside the range are passed through unclamped', () => {
  for (const ex of ALL) {
    const ry = P.clampYOut(ex.inp, ex.inp.yOut);
    assert.equal(ry.clamped, false);
    assert.equal(ry.at, null);
    assert.equal(ry.pinch, null);
    assert.equal(ry.value, ex.inp.yOut);

    const rx = P.clampXOut(ex.inp, ex.inp.xOut);
    assert.equal(rx.clamped, false);
    assert.equal(rx.value, ex.inp.xOut);
  }
});

test('feasibility is dTop > 0 AND dBot > 0 — and nothing else', () => {
  for (const ex of ALL) {
    assert.equal(P.feasibility(ex.inp).feasible, true, ex.name);
  }
  // Top pinch.
  const top = { ...A.inp, m: 1, xIn: 0.003, yOut: 0.002 }; // yOut < m*xIn
  assert.equal(P.feasibility(top).feasible, false);
  assert.equal(P.feasibility(top).pinch, 'top');
  // Bottom pinch.
  const bot = { ...A.inp, xOut: 0.025 }; // > yIn/m = 0.020
  assert.equal(P.feasibility(bot).feasible, false);
  assert.equal(P.feasibility(bot).pinch, 'bottom');
});

test('A < 1 is FEASIBLE and reachable on all four presets (critique C-04)', () => {
  for (const { id, inp } of PRESET_INPUTS) {
    const xMax = P.clampXOut(inp, 1e9).value; // the 98% bottom clamp
    const atClamp = { ...inp, xOut: xMax };
    const Aval = P.absorptionFactor(atClamp);
    assert.ok(Aval < 1, `${id}: A at the clamp is ${Aval}, expected < 1`);
    assert.equal(P.feasibility(atClamp).feasible, true,
      `${id}: A < 1 was rejected — an illegal A >= 1 guard is present`);
    const N = P.theoreticalStages(atClamp);
    assert.ok(Number.isFinite(N) && N > 0, `${id}: N = ${N} at A = ${Aval}`);
  }
});

test('A < 1 gives a finite positive N well away from the pinch', () => {
  // PLAN §3.3 worked case: A = 0.9, R = 1.5 -> N ≈ 0.54.
  const m = 1, xIn = 0, yIn = 0.02;
  const yOut = yIn / 1.5;
  const inp = { m, V: 100, xIn, yIn, yOut, xOut: xIn + (yIn - yOut) / 0.9,
                HOG: 0.6, Eo: 0.7, traySpacing: 0.6, hTop: 1, hBot: 1 };
  assert.equal(P.feasibility(inp).feasible, true);
  const N = P.theoreticalStages(inp);
  assert.ok(N > 0.5 && N < 0.6, `N = ${N}, expected ≈ 0.54`);
});

test('log-guard and the geometric pinch are the same condition (critique C-10)', () => {
  const inp = { ...A.inp };
  const pinchAt = pinchX(inp);
  let prev = Infinity;
  for (const frac of [0.5, 0.9, 0.99, 0.999, 0.9999]) {
    const probe = { ...inp, xOut: inp.xIn + frac * (pinchAt - inp.xIn) };
    const Aval = P.absorptionFactor(probe);
    const b = 1 - 1 / Aval;
    const R = (probe.yIn - probe.m * probe.xIn) / (probe.yOut - probe.m * probe.xIn);
    const guard = 1 + b * (R - 1);
    assert.ok(guard > 0, `guard went non-positive at frac = ${frac}`);
    assert.ok(guard < prev, 'guard should decrease monotonically toward the pinch');
    prev = guard;
    assert.equal(P.feasibility(probe).feasible, true, `frac = ${frac} should be feasible`);
  }
  // Exactly at the pinch the guard hits 0 and feasibility flips — not before.
  const atPinch = { ...inp, xOut: pinchAt };
  assert.equal(P.feasibility(atPinch).feasible, false);
  assert.equal(P.feasibility(atPinch).pinch, 'bottom');
});

test('nothing returns NaN anywhere in the clamped region', () => {
  let n = 0;
  for (const { id, inp } of PRESET_INPUTS) {
    const yr = yOutBounds(inp);
    for (let i = 0; i <= 100; i++) {
      const yOut = yr.lower + (i / 100) * (yr.upper - yr.lower);
      const withY = { ...inp, yOut };
      const xr = xOutBounds(withY);
      for (let j = 0; j <= 100; j++) {
        const xOut = xr.lower + (j / 100) * (xr.upper - xr.lower);
        const probe = { ...withY, xOut };
        for (const v of [P.theoreticalStages(probe), P.ntuAnalytic(probe),
                         P.hetp(probe), P.packedHeight(probe),
                         P.trayColumnHeight(probe), P.actualTrays(probe)]) {
          assert.ok(Number.isFinite(v), `${id}: non-finite at yOut=${yOut} xOut=${xOut}`);
        }
        n++;
      }
    }
  }
  assert.ok(n > 40000, `expected a dense sweep, got ${n} points`);
});

test('the staircase iteration guard is never hit inside the clamps', () => {
  for (const { id, inp } of PRESET_INPUTS) {
    const yr = yOutBounds(inp);
    const probe = { ...inp, yOut: yr.lower };
    const xr = xOutBounds(probe);
    const worst = { ...probe, xOut: xr.upper };
    const st = P.stepStaircase(worst);
    // Contract-only check that the 200-step guard (PLAN §5.5) is nowhere near
    // being hit: N stays under the documented worst case of 49, and the drawn
    // polyline is correspondingly short. An implementation may or may not
    // expose a `guardHit` flag — §2.4 documents only {vertices, fullSteps, N}.
    assert.ok(st.N < 60, `${id}: N = ${st.N} exceeds the documented worst case of 49`);
    assert.ok(st.vertices.length < 2 * 200,
      `${id}: staircase drew ${st.vertices.length} vertices — the 200-step guard was hit`);
  }
});
