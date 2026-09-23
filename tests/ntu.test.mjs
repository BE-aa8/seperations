import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr } from './helpers/load-physics.mjs';
import { ALL, B } from './fixtures/worked-examples.mjs';

const PUB = 1e-6;
const EXACT = 1e-12;

test('ntuAnalytic matches the published N_OG', () => {
  for (const ex of ALL) {
    const NOG = P.ntuAnalytic(ex.inp);
    assert.ok(relErr(NOG, ex.published.NOG) < PUB, `${ex.name}: N_OG = ${NOG}`);
  }
});

test('Simpson integration agrees with Colburn (independent route)', () => {
  for (const ex of ALL) {
    const num = P.ntuNumeric(ex.inp, 1000);
    const ana = P.ntuAnalytic(ex.inp);
    assert.ok(relErr(num, ana) < 1e-9, `${ex.name}: Simpson ${num} vs Colburn ${ana}`);
  }
});

test('log-mean driving force agrees with Colburn (independent route)', () => {
  for (const ex of ALL) {
    const lm = P.ntuLogMean(ex.inp);
    const ana = P.ntuAnalytic(ex.inp);
    assert.ok(relErr(lm, ana) < EXACT, `${ex.name}: log-mean ${lm} vs Colburn ${ana}`);
  }
});

test('Simpson converges: n = 1000 beats n = 100', () => {
  for (const ex of ALL) {
    const ana = P.ntuAnalytic(ex.inp);
    const e100 = relErr(P.ntuNumeric(ex.inp, 100), ana);
    const e1000 = relErr(P.ntuNumeric(ex.inp, 1000), ana);
    assert.ok(e1000 <= e100 + 1e-15, `${ex.name}: error grew with n`);
  }
});

test('ntuNumeric forces an even interval count', () => {
  const ex = ALL[0];
  const odd = P.ntuNumeric(ex.inp, 101);
  assert.ok(Number.isFinite(odd) && relErr(odd, P.ntuAnalytic(ex.inp)) < 1e-6);
});

test('at A = 1 the driving force is constant: the NTU area is a rectangle', () => {
  const { m, xIn, yIn, yOut } = B.inp;
  const A = P.absorptionFactor(B.inp);
  assert.ok(Math.abs(A - 1) < 1e-15, 'Example B should have A = 1 exactly');
  const dTop = yOut - m * xIn;
  // y - y* must equal dTop at every height.
  for (let i = 0; i <= 20; i++) {
    const y = yOut + (i / 20) * (yIn - yOut);
    const x = xIn + (y - yOut) / P.liquidToGasRatio(B.inp);
    assert.ok(Math.abs(y - m * x - dTop) < 1e-15, `driving force varies at y = ${y}`);
  }
  assert.ok(relErr(P.ntuAnalytic(B.inp), (yIn - yOut) / dTop) < EXACT);
});

test('packedHeight = H_OG * N_OG, and H_OG does not leak into N_OG', () => {
  for (const ex of ALL) {
    assert.ok(relErr(P.packedHeight(ex.inp), ex.published.Z) < PUB, `${ex.name}: Z`);
  }
  // Phase 5 criterion: changing packing must not move N_OG.
  const base = ALL[0].inp;
  const NOG = P.ntuAnalytic(base);
  for (const HOG of [0.4, 0.9, 1.7]) {
    const alt = { ...base, HOG };
    assert.ok(relErr(P.ntuAnalytic(alt), NOG) < EXACT,
      'N_OG changed when H_OG changed: H_OG has leaked into the NTU calculation');
    assert.ok(relErr(P.packedHeight(alt), HOG * NOG) < EXACT);
  }
});
