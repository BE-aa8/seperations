import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr } from './helpers/load-physics.mjs';

/**
 * Build an input with a chosen A, at R = 5 (so N = N_OG = 4 when A = 1).
 *
 * NOTE: at R = 5, A_min = (y_in - y_out)/(y_in/m - x_in)/m = 0.8. Values of A
 * at or below 0.8 put the operating line ON or THROUGH the equilibrium line and
 * are genuinely infeasible — not a numerical problem. Keep test values above it.
 */
function atA(Aval) {
  const m = 1, xIn = 0, yIn = 0.02, yOut = 0.004; // R = 5
  return { m, V: 100, xIn, yIn, yOut, xOut: xIn + (yIn - yOut) / (Aval * m),
           HOG: 0.6, Eo: 0.7, traySpacing: 0.6, hTop: 1, hBot: 1 };
}

test('A = 1 exactly returns R - 1, not NaN', () => {
  const inp = atA(1);
  assert.equal(P.absorptionFactor(inp), 1);
  assert.equal(P.theoreticalStages(inp), 4);
  assert.equal(P.ntuAnalytic(inp), 4);
  assert.equal(P.gFactor(1), 1);
  // The naive forms are NaN here — that is what the branches exist for.
  assert.ok(Number.isNaN(Math.log((1 - 1 / 1) * 5 + 1 / 1) / Math.log(1)),
    'sanity: the naive Kremser form should be NaN at A = 1');
});

test('finite and continuous across A = 1 +/- 10^-k for k = 2..12', () => {
  for (let k = 2; k <= 12; k++) {
    for (const sign of [1, -1]) {
      const Aval = 1 + sign * 10 ** -k;
      const inp = atA(Aval);
      for (const [name, v] of [['N', P.theoreticalStages(inp)],
                               ['N_OG', P.ntuAnalytic(inp)],
                               ['g', P.gFactor(P.absorptionFactor(inp))]]) {
        assert.ok(Number.isFinite(v), `${name} not finite at A = 1${sign > 0 ? '+' : '-'}1e-${k}`);
      }
      // N varies genuinely with A: dN/dA ≈ R(1-R)/2 = -10 here, so the
      // expected departure from 4 is ~10*|A-1|. Scale the tolerance to match
      // rather than asserting a fixed bound that only holds for large k.
      const drift = Math.abs(P.theoreticalStages(inp) - 4);
      assert.ok(drift < 20 * 10 ** -k,
        `N drifted by ${drift} at A = 1${sign > 0 ? '+' : '-'}1e-${k}, ` +
        `expected about ${10 * 10 ** -k}`);
    }
  }
});

test('N is monotone decreasing in A across the branch boundary', () => {
  const As = [0.99, 0.999, 0.9999, 0.99999, 0.999999, 1, 1.000001, 1.00001, 1.0001, 1.001, 1.01];
  let prev = Infinity;
  for (const Aval of As) {
    const N = P.theoreticalStages(atA(Aval));
    assert.ok(N < prev, `N not monotone at A = ${Aval} (got ${N}, previous ${prev})`);
    prev = N;
  }
});

test('the series branch is accurate AT its threshold', () => {
  // The right question is not "do two nearby A values agree?" — they should not,
  // since N genuinely varies with A (dN/dA ≈ -10 here, so stepping across the
  // threshold moves N by ~2e-8 for purely physical reasons). The right question
  // is: at one fixed A on the series side, does the series agree with the
  // accurate log1p form? Verified agreement is 3.5e-11 at |A-1| = 1e-6.
  const referenceN = (A, R) => Math.log1p((A - 1) * R) / Math.log(A) - 1;
  const referenceG = (A) => (A * Math.log(A)) / (A - 1);

  for (const sign of [1, -1]) {
    for (const frac of [0.999, 0.5, 0.1]) {
      const Aval = 1 + sign * P.TOL_N * frac; // inside the series band
      const got = P.theoreticalStages(atA(Aval));
      const want = referenceN(Aval, 5);
      assert.ok(Math.abs(got - want) < 1e-9,
        `series N off by ${Math.abs(got - want)} at A - 1 = ${sign * P.TOL_N * frac}`);
    }
    const Ag = 1 + sign * P.TOL_G * 0.999;
    assert.ok(Math.abs(P.gFactor(Ag) - referenceG(Ag)) < 1e-9,
      `series g off at A - 1 = ${sign * P.TOL_G * 0.999}`);
  }
});

test('N is continuous across the threshold to the precision A itself resolves', () => {
  // Stepping from just inside to just outside the branch changes A by 0.002*TOL,
  // so N must change by no more than |dN/dA| * that, plus the branch error.
  for (const sign of [1, -1]) {
    const inside = P.theoreticalStages(atA(1 + sign * P.TOL_N * 0.999));
    const outside = P.theoreticalStages(atA(1 + sign * P.TOL_N * 1.001));
    const physicalChange = 10 * P.TOL_N * 0.002; // |dN/dA| * dA
    assert.ok(Math.abs(inside - outside) < physicalChange + 1e-9,
      `jump of ${Math.abs(inside - outside)} exceeds the physical change ` +
      `of ${physicalChange} at the threshold`);
  }
});

test('branched form agrees with the naive form where the naive form is valid', () => {
  const naiveN = (A, R) => Math.log((1 - 1 / A) * R + 1 / A) / Math.log(A);
  const naiveG = (A) => (A * Math.log(A)) / (A - 1);
  for (const d of [0.01, 0.005, 0.001, -0.001, -0.005, -0.01]) {
    const Aval = 1 + d;
    const inp = atA(Aval);
    assert.ok(relErr(P.theoreticalStages(inp), naiveN(Aval, 5)) < 1e-9, `N at A = ${Aval}`);
    assert.ok(relErr(P.gFactor(Aval), naiveG(Aval)) < 1e-9, `g at A = ${Aval}`);
  }
});

test('the near-balanced demo value sits INSIDE the series band (D-31)', () => {
  // L/V = 0.9999995 -> |A - 1| = 5e-7 < TOL_N = 1e-6. The rejected value
  // 0.999999 would give exactly 1e-6, which fails the strict comparison.
  assert.ok(Math.abs(0.9999995 - 1) < P.TOL_N, 'chosen value must be inside the band');
  assert.ok(!(Math.abs(0.999999 - 1) < P.TOL_N),
    'the rejected value 1 - 1e-6 must fall OUTSIDE the band, as documented');
  const inp = atA(0.9999995);
  assert.ok(relErr(P.theoreticalStages(inp), 4.000005) < 1e-6);
});

test('extreme but FEASIBLE A values stay finite', () => {
  // A_min = 0.8 at R = 5, so 0.85 is the lowest sensible probe. A = 20 is the
  // A_MAX cap. Both ends of the reachable range, plus A < 1 (critique C-04).
  for (const Aval of [0.85, 0.9, 0.99, 1.5, 5, 20]) {
    const inp = atA(Aval);
    assert.equal(P.feasibility(inp).feasible, true, `A = ${Aval} should be feasible`);
    assert.ok(Number.isFinite(P.theoreticalStages(inp)), `N at A = ${Aval}`);
    assert.ok(Number.isFinite(P.ntuAnalytic(inp)), `N_OG at A = ${Aval}`);
    assert.ok(Number.isFinite(P.hetp(inp)), `HETP at A = ${Aval}`);
  }
});

test('A below A_min is reported infeasible, not silently wrong', () => {
  // At R = 5, A_min = 0.8: the operating line touches equilibrium at the bottom.
  for (const Aval of [0.8, 0.5, 0.1]) {
    const f = P.feasibility(atA(Aval));
    assert.equal(f.feasible, false, `A = ${Aval} is below A_min and must be rejected`);
    assert.equal(f.pinch, 'bottom');
    assert.ok(f.reason.length > 0, 'an infeasible result must carry a reason');
  }
});
