import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr } from './helpers/load-physics.mjs';
import { ALL } from './fixtures/worked-examples.mjs';

const PUB = 1e-6; // published §7 values carry 6 decimal places

test('basic groups match the published worked examples', () => {
  for (const ex of ALL) {
    assert.ok(relErr(P.liquidToGasRatio(ex.inp), ex.published.LoV) < PUB, `${ex.name}: L/V`);
    assert.ok(relErr(P.absorptionFactor(ex.inp), ex.published.A) < PUB, `${ex.name}: A`);
    assert.ok(relErr(P.liquidFlow(ex.inp), ex.published.LoV * ex.inp.V) < PUB, `${ex.name}: L`);
  }
});

test('theoreticalStages matches the published N', () => {
  for (const ex of ALL) {
    const N = P.theoreticalStages(ex.inp);
    assert.ok(relErr(N, ex.published.N) < PUB, `${ex.name}: N = ${N}, want ${ex.published.N}`);
  }
});

test('actualTrays applies ceil AFTER dividing by Eo (RISK-07)', () => {
  for (const ex of ALL) {
    assert.equal(P.actualTrays(ex.inp), ex.published.nActual, ex.name);
  }
  // The distinguishing case: ceil(2.4594)/0.7 = 3/0.7 = 4.28 -> 5, which is wrong.
  const ex = ALL[0];
  assert.equal(P.actualTrays(ex.inp), 4);
  assert.notEqual(P.actualTrays(ex.inp), 5);
});

test('Eo = 1.0 on Example A gives 3 trays and 3.80 m (Phase 4 criterion)', () => {
  const inp = { ...ALL[0].inp, Eo: 1.0 };
  assert.equal(P.actualTrays(inp), 3);
  assert.ok(relErr(P.trayColumnHeight(inp), 3.8) < 1e-12);
});

test('trayColumnHeight matches the published Z_tray', () => {
  for (const ex of ALL) {
    assert.ok(relErr(P.trayColumnHeight(ex.inp), ex.published.ZTray) < PUB, ex.name);
  }
});

test('minimum L/V and A_min match', () => {
  for (const ex of ALL) {
    assert.ok(relErr(P.minLiquidToGasRatio(ex.inp), ex.published.LoVmin) < PUB, `${ex.name}: (L/V)min`);
    assert.ok(relErr(P.xOutPinch(ex.inp), ex.published.xOutPinch) < PUB, `${ex.name}: x_out,pinch`);
  }
});
