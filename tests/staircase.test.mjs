import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr } from './helpers/load-physics.mjs';
import { ALL, A, B, C, naiveFractionalStages } from './fixtures/worked-examples.mjs';

const EXACT = 1e-12; // two independent routes, both at full double precision

test('stepped staircase agrees with closed-form Kremser EXACTLY', () => {
  for (const ex of ALL) {
    const st = P.stepStaircase(ex.inp);
    const kr = P.theoreticalStages(ex.inp);
    assert.ok(relErr(st.N, kr) < EXACT, `${ex.name}: staircase ${st.N} vs Kremser ${kr}`);
  }
});

test('staircase agrees with Kremser across the reachable sweep', () => {
  // Ranges per PLAN §7.5: R from the minimum-separation clamp (1.02) to 100,
  // A from below 1 up to the A_MAX cap of 20.
  let checked = 0;
  for (let ai = 0; ai <= 60; ai++) {
    const Aval = 0.5 + (ai * (20 - 0.5)) / 60;
    for (let ri = 0; ri <= 60; ri++) {
      const R = 1.02 + (ri * (100 - 1.02)) / 60;
      // Construct an input realising (A, R) with x_in = 0, m = 1.
      const m = 1, xIn = 0, yIn = 0.02;
      const yOut = yIn / R;             // R = (yIn - 0)/(yOut - 0)
      const LoV = Aval * m;
      const xOut = xIn + (yIn - yOut) / LoV;
      const inp = { m, V: 100, xIn, yIn, yOut, xOut, HOG: 0.6, Eo: 0.7,
                    traySpacing: 0.6, hTop: 1, hBot: 1 };
      if (!P.feasibility(inp).feasible) continue;
      const st = P.stepStaircase(inp);
      const kr = P.theoreticalStages(inp);
      assert.ok(relErr(st.N, kr) < EXACT,
        `A=${Aval} R=${R}: staircase ${st.N} vs Kremser ${kr}`);
      checked++;
    }
  }
  assert.ok(checked > 1500, `expected a broad sweep, only checked ${checked}`);
});

test('sweep includes points across every §3.8 branch threshold', () => {
  const m = 1, xIn = 0, yIn = 0.02, yOut = 0.004;
  for (const d of [1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 0, -1e-8, -1e-6, -1e-5]) {
    const LoV = (1 + d) * m;
    const inp = { m, V: 100, xIn, yIn, yOut, xOut: xIn + (yIn - yOut) / LoV,
                  HOG: 0.6, Eo: 0.7, traySpacing: 0.6, hTop: 1, hBot: 1 };
    const st = P.stepStaircase(inp);
    const kr = P.theoreticalStages(inp);
    assert.ok(Number.isFinite(kr), `A = 1+${d}: N is not finite`);
    assert.ok(relErr(st.N, kr) < 1e-9, `A = 1+${d}: staircase ${st.N} vs Kremser ${kr}`);
  }
});

test('fullSteps counts risers landing AT OR BELOW y_in (critique C-03)', () => {
  for (const ex of ALL) {
    const st = P.stepStaircase(ex.inp);
    assert.equal(st.fullSteps, ex.fullSteps,
      `${ex.name}: fullSteps = ${st.fullSteps}, want ${ex.fullSteps} (N = ${st.N})`);
  }
  // Explicitly: A and C are 2, NOT 3. This is the v1.0 error.
  assert.equal(P.stepStaircase(A.inp).fullSteps, 2);
  assert.equal(P.stepStaircase(C.inp).fullSteps, 2);
  // B's last riser lands exactly on y_in, so all four are complete.
  assert.equal(P.stepStaircase(B.inp).fullSteps, 4);
});

test('fullSteps === floor(N) unless N is an integer', () => {
  for (const ex of ALL) {
    const st = P.stepStaircase(ex.inp);
    const isInt = Math.abs(st.N - Math.round(st.N)) < 1e-9;
    assert.equal(st.fullSteps, isInt ? Math.round(st.N) : Math.floor(st.N), ex.name);
  }
});

test('the NAIVE fractional rule is not what the implementation uses', () => {
  // Pinned constants, not merely "different" (critique C-11).
  assert.ok(Math.abs(naiveFractionalStages(A.inp) - A.naiveN) < 1e-6,
    `naive rule on A should be ${A.naiveN}`);
  assert.ok(Math.abs(naiveFractionalStages(C.inp) - C.naiveN) < 1e-6,
    `naive rule on C should be ${C.naiveN}`);

  // And the implementation must NOT agree with it on A and C.
  assert.ok(Math.abs(P.theoreticalStages(A.inp) - A.naiveN) > 1e-3,
    'implementation appears to use the naive fractional-stage rule (Example A)');
  assert.ok(Math.abs(P.theoreticalStages(C.inp) - C.naiveN) > 1e-4,
    'implementation appears to use the naive fractional-stage rule (Example C)');

  // On B the naive rule coincides — which is why B alone cannot catch this.
  assert.ok(Math.abs(naiveFractionalStages(B.inp) - P.theoreticalStages(B.inp)) < 1e-9);
});

test('vertices start at (x_in, y_out) and alternate equilibrium/operating', () => {
  for (const ex of ALL) {
    const { vertices } = P.stepStaircase(ex.inp);
    assert.ok(Math.abs(vertices[0].x - ex.inp.xIn) < 1e-15, `${ex.name}: start x`);
    assert.ok(Math.abs(vertices[0].y - ex.inp.yOut) < 1e-15, `${ex.name}: start y`);
    // Odd-indexed vertices sit on the equilibrium line y = m*x.
    for (let i = 1; i < vertices.length; i += 2) {
      const v = vertices[i];
      assert.ok(Math.abs(v.y - ex.inp.m * v.x) < 1e-12,
        `${ex.name}: vertex ${i} not on equilibrium line`);
    }
  }
});

test('the operating line lies ABOVE equilibrium throughout (RISK-02)', () => {
  for (const ex of ALL) {
    const { m, xIn, yIn, yOut, xOut } = ex.inp;
    const LoV = P.liquidToGasRatio(ex.inp);
    for (let i = 0; i <= 50; i++) {
      const x = xIn + (i / 50) * (xOut - xIn);
      const yOp = LoV * (x - xIn) + yOut;
      assert.ok(yOp > m * x - 1e-15,
        `${ex.name}: operating line dips below equilibrium at x = ${x}`);
    }
  }
});

test('no staircase overshoots y_in in the drawn geometry', () => {
  for (const ex of ALL) {
    for (const v of P.stepStaircase(ex.inp).vertices) {
      assert.ok(v.y <= ex.inp.yIn + 1e-12, `${ex.name}: vertex above y_in`);
    }
  }
});
