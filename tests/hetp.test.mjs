import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr, gOf } from './helpers/load-physics.mjs';
import { ALL, B } from './fixtures/worked-examples.mjs';

const PUB = 1e-6;
const EXACT = 1e-12;

test('g(A) = A ln A / (A - 1); g(2) = 2 ln 2 exactly', () => {
  // g is recovered as HETP/H_OG — `hetp` is in the contract, `gFactor` is not.
  const gAt2 = gOf(ALL[0].inp); // Example A has A = 2 exactly
  assert.ok(relErr(gAt2, 2 * Math.log(2)) < EXACT, 'g(2)');
  assert.ok(relErr(gAt2, 1.3862944) < 1e-7, 'g(2) against the published pin');
  assert.equal(gOf(B.inp), 1, 'g(1) must be exactly 1'); // Example B has A = 1
});

test('HETP = H_OG * g(A), NOT H_OG / g(A) (RISK-04)', () => {
  for (const ex of ALL) {
    const h = P.hetp(ex.inp);
    assert.ok(relErr(h, ex.published.HETP) < PUB, `${ex.name}: HETP = ${h}`);
  }
  // The inverted form would give 0.6/1.386294 = 0.4328 on Example A, not 0.8318.
  const A2 = P.absorptionFactor(ALL[0].inp);
  const trueG = (A2 * Math.log(A2)) / (A2 - 1);
  const inverted = ALL[0].inp.HOG / trueG;
  assert.ok(Math.abs(P.hetp(ALL[0].inp) - inverted) > 0.1,
    'HETP appears to use the inverted (reciprocal) form');
});

test('HETP === H_OG exactly when A = 1', () => {
  assert.equal(P.hetp(B.inp), B.inp.HOG);
});

test('N_OG / N === g(A)', () => {
  for (const ex of ALL) {
    const ratio = P.ntuAnalytic(ex.inp) / P.theoreticalStages(ex.inp);
    assert.ok(relErr(ratio, gOf(ex.inp)) < 1e-9, ex.name);
  }
});

test('CONSISTENCY CHECK (an identity, not a validation): N * HETP === Z_packed', () => {
  // Since HETP := H_OG * N_OG / N, the product N * HETP is H_OG * N_OG == Z by
  // definition (PLAN §7.5). This catches an inverted g(A), but it does NOT
  // independently validate the physics. The checks with teeth are the
  // staircase-vs-Kremser test and the Simpson/log-mean-vs-Colburn tests.
  for (const ex of ALL) {
    const lhs = P.theoreticalStages(ex.inp) * P.hetp(ex.inp);
    const rhs = P.packedHeight(ex.inp);
    // Compare RAW numbers, never formatted strings (RISK-11).
    assert.ok(relErr(lhs, rhs) < 1e-9, `${ex.name}: ${lhs} vs ${rhs}`);
  }
});
