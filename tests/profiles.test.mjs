import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physics as P, relErr } from './helpers/load-physics.mjs';
import { ALL, A, B } from './fixtures/worked-examples.mjs';

test('packed profile hits y_out at the top and y_in at the bottom', () => {
  for (const ex of ALL) {
    const Z = P.packedHeight(ex.inp);
    assert.ok(relErr(P.gasProfilePacked(ex.inp, 0), ex.inp.yOut) < 1e-10, `${ex.name}: top`);
    assert.ok(relErr(P.gasProfilePacked(ex.inp, Z), ex.inp.yIn) < 1e-10, `${ex.name}: bottom`);
  }
});

test('packed profile is richest at the BOTTOM (RISK-08)', () => {
  for (const ex of ALL) {
    const Z = P.packedHeight(ex.inp);
    let prev = -Infinity;
    for (let i = 0; i <= 50; i++) {
      const y = P.gasProfilePacked(ex.inp, (i / 50) * Z);
      assert.ok(y > prev - 1e-15, `${ex.name}: profile not monotone increasing downward`);
      prev = y;
    }
    assert.ok(P.gasProfilePacked(ex.inp, Z) > P.gasProfilePacked(ex.inp, 0),
      `${ex.name}: profile is inverted — y should be highest where gas ENTERS`);
  }
});

test('at A = 1 the packed profile is exactly LINEAR in height (eq. 28)', () => {
  const Z = P.packedHeight(B.inp);
  const ys = [];
  for (let i = 0; i <= 20; i++) ys.push(P.gasProfilePacked(B.inp, (i / 20) * Z));
  // Second differences of a linear sequence vanish.
  for (let i = 1; i < ys.length - 1; i++) {
    const d2 = ys[i + 1] - 2 * ys[i] + ys[i - 1];
    assert.ok(Math.abs(d2) < 1e-15, `second difference ${d2} at i = ${i}`);
  }
});

test('tray profile lands exactly on y_out at j = 1 and y_in at j = nAct+1', () => {
  for (const ex of ALL) {
    const nAct = P.actualTrays(ex.inp);
    assert.ok(relErr(P.gasProfileTray(ex.inp, 1), ex.inp.yOut) < 1e-10, `${ex.name}: j = 1`);
    assert.ok(relErr(P.gasProfileTray(ex.inp, nAct + 1), ex.inp.yIn) < 1e-10,
      `${ex.name}: j = nAct+1`);
  }
});

test('tray profile matches the published Example A values', () => {
  A.trayProfile.forEach((want, i) => {
    const got = P.gasProfileTray(A.inp, i + 1);
    assert.ok(relErr(got, want) < 1e-6, `tray j = ${i + 1}: got ${got}, want ${want}`);
  });
  // Phase 6 criterion: probing tray 3 from the top reads ≈ 7.38e-3.
  assert.ok(relErr(P.gasProfileTray(A.inp, 3), 7.380832e-3) < 1e-6);
});

test('each actual tray delivers at most E_o theoretical stages', () => {
  for (const ex of ALL) {
    const ratio = P.theoreticalStages(ex.inp) / P.actualTrays(ex.inp);
    assert.ok(ratio <= ex.inp.Eo + 1e-12,
      `${ex.name}: N/nAct = ${ratio} exceeds E_o = ${ex.inp.Eo}`);
  }
});

test('tray profile is monotone from top tray to bottom', () => {
  for (const ex of ALL) {
    const nAct = P.actualTrays(ex.inp);
    let prev = -Infinity;
    for (let j = 1; j <= nAct + 1; j++) {
      const y = P.gasProfileTray(ex.inp, j);
      assert.ok(y > prev, `${ex.name}: tray profile not increasing at j = ${j}`);
      prev = y;
    }
  }
});
