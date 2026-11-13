// model.js: all physics for the MVR Crystallizer Explorer (plan-v2-final.md §5.3–§5.4, §8).
// Pure functions, no DOM. Imports in the browser and in Node 18+.
// Units: T in °C, ΔT in K, P in kPa, mass flows in kg/h, specific energy in kJ/kg, power in kW, money in $.
import { DATA } from './data.js';

const MW_LIOH = DATA.molarMass.LiOH.value;          // g/mol
const MW_H2O = DATA.molarMass.H2O.value;            // g/mol
const MW_HYD = DATA.molarMass.LiOH_H2O.value;       // g/mol
export const F_LI = MW_LIOH / MW_HYD;               // kg LiOH per kg LiOH·H2O (≈0.5707)
export const F_W = 1 - F_LI;                        // kg hydrate water per kg crystals (≈0.4293)
const R = DATA.constants.R.value;                   // J/(mol K)
const RV = DATA.constants.Rv.value;                 // J/(kg K)
const MMHG_TO_KPA = 0.133322;

// ---------- helpers ----------
function interp(points, x, { clamp = false, name = 'table' } = {}) {
  const n = points.length;
  const x0 = points[0][0], xn = points[n - 1][0];
  if (x < x0 || x > xn) {
    if (!clamp) throw new RangeError(`${name}: ${x} outside table range ${x0}–${xn}`);
    x = Math.min(Math.max(x, x0), xn);
  }
  for (let k = 0; k < n - 1; k++) {
    const [xa, ya] = points[k], [xb, yb] = points[k + 1];
    if (x <= xb) return ya + (yb - ya) * (x - xa) / (xb - xa);
  }
  return points[n - 1][1];
}
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const steamCol = (name) => {
  const j = DATA.steamTable.columns.indexOf(name);
  return DATA.steamTable.rows.map((r) => [r[0], r[j]]);
};
const HFG_PTS = steamCol('hfg_kJkg');
const HF_PTS = steamCol('hf_kJkg');
const HG_PTS = steamCol('hg_kJkg');

// ---------- properties ----------
/** Saturation pressure of water, kPa (Antoine only, B3). */
export function psat(T_C) {
  const { A, B, C } = DATA.antoine;
  return Math.pow(10, A - B / (C + T_C)) * MMHG_TO_KPA;
}
/** Saturation temperature of water, °C: exact inverse of the same Antoine equation. */
export function tsat(P_kPa) {
  const { A, B, C } = DATA.antoine;
  return B / (A - Math.log10(P_kPa / MMHG_TO_KPA)) - C;
}
/** Latent heat of vaporization, kJ/kg (NIST table, linear interpolation; throws outside 30–150 °C). */
export function hfg(T_C) { return interp(HFG_PTS, T_C, { name: 'hfg' }); }
export function hf(T_C) { return interp(HF_PTS, T_C, { name: 'hf' }); }
export function hg(T_C) { return interp(HG_PTS, T_C, { name: 'hg' }); }
/** LiOH solubility, g LiOH / 100 g H2O (Monnin & Dubois 2005, linear interpolation). */
export function solubility(T_C) { return interp(DATA.solubility.points, T_C, { clamp: true, name: 'solubility' }); }
/** Osmotic coefficient of saturated LiOH(aq) (Monnin & Dubois 2005 Pitzer model). */
export function phiSat(T_C) { return interp(DATA.osmoticSat.points, T_C, { clamp: true, name: 'osmoticSat' }); }
/** Molality of LiOH, mol/kg water, from s in g/100 g water. */
export function molality(s) { return (s / 100) / (MW_LIOH / 1000); }
/** Ebullioscopic constant at the liquor temperature, K·kg/mol. */
export function kb(T_C) { return R * (T_C + 273.15) ** 2 / (hfg(T_C) * 1000); }

/** Boiling-point elevation, K (B1): BPE = a · i · Kb · m. */
export function bpe({ s, T_C, i = 2, activityFactor = 1 }) {
  return activityFactor * i * kb(T_C) * molality(s);
}

// ---------- unit models ----------
/** Steady-state mass balance with purge (M1–M8). */
export function massBalance({ F, xF, zF, T_C, purgeRatio, epsilon }) {
  const warnings = [];
  const s = solubility(T_C);
  const p = purgeRatio;
  const P = p * F;
  const zML = p > 0 ? zF / p : Infinity;
  const xL = (1 - zML) * s / (100 + s);
  const C = (F * xF - P * xL) / F_LI;
  // water balance (M6) gives V independently of M1; M1 is then the closure check
  const V = F * (1 - xF - zF) - F_W * C - P * (1 - xL - zML);
  const closureError = V + C + P - F;
  const feasible = [C, V, xL].every(Number.isFinite) && C >= 0 && V >= 0 && xL > 0 && zML < 1;
  if (!feasible) {
    if (!(zML < 1) || !(xL > 0)) warnings.push(`Purge too small: impurity in the mother liquor would reach ${(zML * 100).toFixed(0)} wt % (z_ML = z_F/p ≥ 1 or x_L ≤ 0). Increase the purge ratio or lower z_F.`);
    if (C < 0) warnings.push('No crystals: the purge carries away more LiOH than the feed brings in (C < 0). Lower the purge ratio or raise x_F.');
    if (V < 0) warnings.push('Negative evaporation (V < 0): the feed is already too concentrated for this purge. Change x_F or p.');
    return { C: null, V: null, P: null, xL: fin(xL), zML: fin(zML), liYield: null,
      productImpurity_ppm: null, closureError: null, feasible: false, warnings };
  }
  return {
    C, V, P, xL, zML,
    liYield: F_LI * C / (F * xF),
    productImpurity_ppm: 1e6 * epsilon * zML / (1 + epsilon),
    closureError, feasible: true, warnings,
  };
}

/** Mechanical vapor recompression (C1–C7). V may be null (infeasible mass balance). */
export function mvr({ V, Tb_C, BPE, dT_heater, etaIs, etaMotor, gamma }) {
  const Tv_C = Tb_C - BPE;
  const Tc_C = Tb_C + dT_heater;
  const P1 = psat(Tv_C);
  const P2 = psat(Tc_C);
  const r = P2 / P1;
  const lift = Tc_C - Tv_C;
  const k = (gamma - 1) / gamma;
  const T1 = Tb_C + 273.15;                // vapor leaves the boiling liquor at T_b (superheated by BPE)
  const ws = gamma / (gamma - 1) * RV * T1 * (r ** k - 1) / 1000;   // kJ/kg
  const w = ws / etaIs;
  const T2_C = T1 * (1 + (r ** k - 1) / etaIs) - 273.15;
  const hasV = typeof V === 'number' && Number.isFinite(V);
  const Wshaft_kW = hasV ? V * w / 3600 : null;
  const Welec_kW = hasV ? Wshaft_kW / etaMotor : null;
  const kWh_per_t = w / (3.6 * etaMotor);
  const COP = hfg(Tv_C) / w;
  const COP_carnot = lift > 0 ? (Tc_C + 273.15) / lift : null;
  return { Tv_C, P1, Tc_C, P2, r, lift, ws, w, T2_C, Wshaft_kW, Welec_kW, kWh_per_t,
    COP: fin(COP), COP_carnot: fin(COP_carnot) };
}

/** N-effect evaporator, ideal (E2–E4). */
export function multiEffect({ V, Q_kW, Ts_C, Tlast_C, N, BPE, dTmin, lambdaV }) {
  const economy = N * hfg(Ts_C) / lambdaV;
  const hasV = typeof V === 'number' && Number.isFinite(V);
  const S = hasV ? V / economy : null;
  const dT_per_effect = (Ts_C - Tlast_C - N * BPE) / N;
  const maxFeasibleN = Math.max(0, Math.floor((Ts_C - Tlast_C) / (BPE + dTmin)));
  return { S, economy, dT_per_effect, feasible: dT_per_effect >= dTmin, maxFeasibleN, Q_kW: fin(Q_kW) };
}

/** Operating-cost comparison ($1–$4). */
export function economics({ kWh_per_t, economy, ce, cs, V, hours }) {
  const cost_MVR_per_t = ce * kWh_per_t;
  const cost_ME_per_t = cs / economy;
  const ce_crossover = cs / (economy * kWh_per_t);
  const hasV = typeof V === 'number' && Number.isFinite(V);
  return {
    cost_MVR_per_t, cost_ME_per_t, ce_crossover: fin(ce_crossover),
    annual_MVR: hasV ? cost_MVR_per_t * V * hours / 1000 : null,
    annual_ME: hasV ? cost_ME_per_t * V * hours / 1000 : null,
  };
}

// ---------- extra pure helpers for plots ----------
/** Cooling-crystallization yield (M9): fraction of dissolved LiOH recovered by cooling Th → Tc. */
export function coolingYield(Th_C, Tc_C) {
  const sh = solubility(Th_C), sc = solubility(Tc_C);
  return (sh - sc) / sh;
}
/** Fuel (primary) energy per tonne of water evaporated, kWh_fuel/t (P5). */
export function primaryEnergy({ kWh_per_t, economy }) {
  const heatRate = DATA.prices.gridHeatRate.value / 3412.14;   // kWh fuel per kWh electricity (Btu/kWh ÷ 3412.14 Btu/kWh)
  const steamFuel_kJkg = (hg(DATA.evaporator.Ts_C.value) - hf(DATA.prices.feedwaterT_C.value)) / DATA.prices.boilerEfficiency.value;
  const steamFuel_kWh_per_t = steamFuel_kJkg / 3.6;            // kJ/kg = MJ/t → kWh/t
  return {
    heatRate, steamFuel_kWh_per_t,
    mvr: kWh_per_t * heatRate,
    me: (economy) => steamFuel_kWh_per_t / economy,
    meValue: economy ? steamFuel_kWh_per_t / economy : null,
  };
}

// ---------- defaults (§5.4, exact) ----------
export const DEFAULT_INPUTS = Object.freeze({
  F: 10000,
  xF: DATA.feed.xF.value,
  zF: DATA.feed.zF.value,
  T_C: 60,
  purgeRatio: 0.05,
  epsilon: DATA.feed.epsilon.value,
  i: 2,
  useOsmotic: true,
  activityFactor: 1.0,
  dT_heater: DATA.compressor.dT_heater.value,
  etaIs: DATA.compressor.etaIs.value,
  etaMotor: DATA.compressor.etaMotor.value,
  gamma: DATA.constants.gamma.value,
  Ts_C: DATA.evaporator.Ts_C.value,
  Tlast_C: DATA.evaporator.Tlast_C.value,
  dTmin: DATA.evaporator.dTmin.value,
  N: 3,
  ce: DATA.prices.electricity.value,
  cs: DATA.prices.steam.value,
  hours: 8000,
  U: DATA.evaporator.U.value,    // Phase 2 (unused)
  loadFraction: 1.0,             // Phase 2 (unused)
});

/** Slider ranges (§5.4) for the UI. */
export const RANGES = Object.freeze({
  F: [2000, 50000], xF: [0.02, 0.11], zF: [0, 0.005], T_C: [40, 100], purgeRatio: [0.005, 0.20],
  epsilon: [0, 0.10], activityFactor: [0.75, 1.20], dT_heater: [1, 15], etaIs: [0.60, 0.85],
  etaMotor: [0.90, 0.97], Ts_C: [100, 150], Tlast_C: [40, 60], dTmin: [3, 10], N: [1, 7],
  ce: [0.03, 0.25], cs: [5, 40], hours: [4000, 8760],
});

/** BPE for a given state, using the osmotic coefficient or the activity slider. */
export function bpeFor(inp, s = solubility(inp.T_C)) {
  const a = inp.useOsmotic ? phiSat(inp.T_C) : inp.activityFactor;
  return { a, BPE: bpe({ s, T_C: inp.T_C, i: inp.i, activityFactor: a }) };
}

/** Run every unit model (§5.4). Never throws for slider-range inputs; non-finite values become null. */
export function simulate(inputs = {}) {
  const inp = { ...DEFAULT_INPUTS, ...inputs };
  const warnings = [];
  const s = solubility(inp.T_C);
  const m = molality(s);
  const Kb = kb(inp.T_C);
  const { a: phi, BPE } = bpeFor(inp, s);

  const mass = massBalance(inp);
  warnings.push(...mass.warnings);

  const Tv_C = inp.T_C - BPE;
  let lambdaV = null, mv = null, Q_kW = null;
  try {
    lambdaV = hfg(Tv_C);
    mv = mvr({ V: mass.V, Tb_C: inp.T_C, BPE, dT_heater: inp.dT_heater, etaIs: inp.etaIs,
      etaMotor: inp.etaMotor, gamma: inp.gamma });
    Q_kW = mass.feasible ? mass.V * lambdaV / 3600 : null;
    if (mv.r > DATA.compressor.rMaxSingleStage.value) {
      warnings.push(`Pressure ratio r = ${mv.r.toFixed(2)} exceeds ~${DATA.compressor.rMaxSingleStage.value} for one centrifugal stage (ESTIMATE): two stages in series would be needed.`);
    }
  } catch (e) {
    warnings.push(`Outside property-table range: ${e.message}`);
  }

  const effects = {}, econ = {};
  if (mv && lambdaV) {
    for (const N of [...new Set([1, 3, 5, inp.N])]) {
      const ef = multiEffect({ V: mass.V, Q_kW, Ts_C: inp.Ts_C, Tlast_C: inp.Tlast_C, N, BPE,
        dTmin: inp.dTmin, lambdaV });
      effects[N] = ef;
      econ[N] = economics({ kWh_per_t: mv.kWh_per_t, economy: ef.economy, ce: inp.ce, cs: inp.cs,
        V: mass.V, hours: inp.hours });
    }
    if (!effects[inp.N].feasible) {
      warnings.push(`${inp.N} effects are infeasible: ΔT per effect = ${effects[inp.N].dT_per_effect.toFixed(1)} K < ΔT_min = ${inp.dTmin} K. At most ${effects[inp.N].maxFeasibleN} effects fit between ${inp.Ts_C} °C steam and the ${inp.Tlast_C} °C condenser.`);
    }
  }

  return { inputs: inp, s, m, Kb, phi, BPE, lambdaV, mass, Q_kW, mvr: mv, effects, econ, warnings };
}

// ---------- sweeps for plots (pure) ----------
const linspace = (a, b, n) => Array.from({ length: n }, (_, k) => a + (b - a) * k / (n - 1));
export { linspace };

/** MVR performance vs BPE at the current state (P4). BPE range trimmed so T_v stays ≥ 30 °C. */
export function sweepBPE(inp, n = 61) {
  const maxBPE = Math.min(15, inp.T_C - 30);
  const xs = linspace(0, Math.max(maxBPE, 0.1), n);
  return xs.map((B) => {
    const r = mvr({ V: null, Tb_C: inp.T_C, BPE: B, dT_heater: inp.dT_heater, etaIs: inp.etaIs,
      etaMotor: inp.etaMotor, gamma: inp.gamma });
    return { BPE: B, kWh_per_t: r.kWh_per_t, r: r.r, T2_C: r.T2_C };
  });
}
/** Yield and product impurity vs purge ratio (P7). */
export function sweepPurge(inp, epsilons = [inp.epsilon], n = 80) {
  const ps = linspace(0.005, 0.20, n);
  return ps.map((p) => {
    const mb = massBalance({ ...inp, purgeRatio: p });
    const row = { p, feasible: mb.feasible, liYield: mb.liYield, zML: mb.zML };
    row.impurity = epsilons.map((e) => (mb.feasible ? 1e6 * e * mb.zML / (1 + e) : null));
    return row;
  });
}
/** Driving force per effect vs number of effects (P11). */
export function sweepN(inp, BPE, Nmax = 10) {
  return Array.from({ length: Nmax }, (_, k) => {
    const N = k + 1;
    const dT = (inp.Ts_C - inp.Tlast_C - N * BPE) / N;
    return { N, dT, feasible: dT >= inp.dTmin };
  });
}
/** BPE vs molality at the current T for several activity factors (P2). */
export function sweepMolality(inp, aList = [0.75, 1.0, 1.2], n = 50) {
  const Kb = kb(inp.T_C);
  const ms = linspace(0, 8, n);
  return { ms, curves: aList.map((a) => ({ a, BPE: ms.map((m) => a * inp.i * Kb * m) })) };
}
