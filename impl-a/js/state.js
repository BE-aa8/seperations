/**
 * state.js — the single application state object, subscribe/notify, and ALL
 * clamping.
 *
 * Must not touch the DOM (PLAN §2.2).
 *
 * The clamping rule is load-bearing (PLAN §5.2, RISK-06): every mutation is
 * clamped HERE and the clamped value is what gets stored. A renderer that
 * limits where it *draws* a handle while state holds the raw pointer value
 * produces a picture that disagrees with the numbers — and only at the
 * extremes, which is exactly where a live demo goes.
 */

import * as physics from './physics.js';
import {
  SYSTEMS,
  PACKINGS,
  DEMO_PRESETS,
  TRAY_DEFAULTS,
  DEFAULT_SYSTEM_ID,
  DEFAULT_PACKING_ID,
  buildInput,
} from './presets.js';

const listeners = new Set();

/** @type {{inp:Object, systemId:string, packingId:string, pinch:null|'top'|'bottom', axesFrozen:null|Object, probeZ:number, warning:string|null}} */
const state = {
  inp: buildInput(DEFAULT_SYSTEM_ID, DEFAULT_PACKING_ID),
  systemId: DEFAULT_SYSTEM_ID,
  packingId: DEFAULT_PACKING_ID,
  pinch: null,
  /** Axis domain held fixed for the duration of a drag gesture (RISK-09). */
  axesFrozen: null,
  /** Height probe position, metres from the bottom. */
  probeZ: 0,
  warning: SYSTEMS.find((s) => s.id === DEFAULT_SYSTEM_ID)?.warning ?? null,
};

let derived = physics.solve(state.inp);

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  derived = physics.solve(state.inp);
  // The axis domain a renderer should use: frozen during a drag, live otherwise.
  derived.axes = state.axesFrozen ?? derived.axes;
  for (const fn of listeners) fn(derived, state);
}

export function getState() {
  return state;
}
export function getDerived() {
  return derived;
}

// ---------------------------------------------------------------------------
// Axis freezing (PLAN §4.4, RISK-09)
// ---------------------------------------------------------------------------

/** Called on pointerdown. Without this the diagram creeps under the cursor. */
export function freezeAxes() {
  state.axesFrozen = physics.axesFor(state.inp);
  notify();
}

/** Called on pointerup/pointercancel. */
export function unfreezeAxes() {
  state.axesFrozen = null;
  notify();
}

// ---------------------------------------------------------------------------
// The two drag handles
// ---------------------------------------------------------------------------

/**
 * Set y_out from a raw (unclamped) drag position.
 *
 * Moving y_out changes the x_out LOWER bound (it depends on y_out through the
 * A_MAX cap), so x_out is re-clamped afterwards. The x_out UPPER bound does not
 * depend on y_out — the pinch constraints decouple (PLAN §3.10) — but the
 * displayed (L/V)min does, and that falls out of the recompute.
 */
export function setYOut(raw) {
  const r = physics.clampYOut(state.inp, raw);
  state.inp = { ...state.inp, yOut: r.value };
  state.pinch = r.pinch;

  const rx = physics.clampXOut(state.inp, state.inp.xOut);
  if (rx.clamped) {
    state.inp = { ...state.inp, xOut: rx.value };
    state.pinch = state.pinch ?? rx.pinch;
  }
  notify();
}

/** Set x_out (i.e. choose the liquid rate) from a raw drag position. */
export function setXOut(raw) {
  const r = physics.clampXOut(state.inp, raw);
  state.inp = { ...state.inp, xOut: r.value };
  state.pinch = r.pinch;
  notify();
}

/** Height probe, metres from the bottom of the taller column. */
export function setProbeZ(z) {
  const tallest = Math.max(derived.ZTray ?? 0, derived.Z ?? 0);
  state.probeZ = Math.max(0, Math.min(z, tallest));
  notify();
}

// ---------------------------------------------------------------------------
// Ranges, for the drag layer and ARIA
// ---------------------------------------------------------------------------

export function yOutRange() {
  const r = physics.yOutRange(state.inp);
  return { lo: r.lower, hi: r.upper };
}
export function xOutRange() {
  const r = physics.xOutRange(state.inp);
  return { lo: r.lower, hi: r.upper };
}
export function probeRange() {
  return { lo: 0, hi: Math.max(derived.ZTray ?? 1, derived.Z ?? 1) };
}

// ---------------------------------------------------------------------------
// Presets and numeric inputs
// ---------------------------------------------------------------------------

/**
 * Switch chemical system. Re-clamps both handles into the new valid ranges
 * rather than leaving them stranded outside (Phase 7 acceptance criterion 2).
 */
export function setSystem(systemId) {
  const sys = SYSTEMS.find((s) => s.id === systemId);
  if (!sys) return;
  state.systemId = systemId;
  state.inp = buildInput(systemId, state.packingId, {
    Eo: state.inp.Eo,
    traySpacing: state.inp.traySpacing,
    hTop: state.inp.hTop,
    hBot: state.inp.hBot,
  });
  state.warning = sys.warning ?? null;
  state.axesFrozen = null;
  reclampBoth();
  notify();
}

export function setPacking(packingId) {
  const pack = PACKINGS.find((p) => p.id === packingId);
  if (!pack) return;
  state.packingId = packingId;
  state.inp = { ...state.inp, HOG: pack.HOG };
  notify();
}

/** Apply one of the A ≈ 1 demonstration presets (PLAN §4.3). */
export function setDemoPreset(id) {
  const d = DEMO_PRESETS.find((p) => p.id === id);
  if (!d) return;
  state.systemId = `demo:${id}`;
  state.inp = {
    ...state.inp,
    m: d.m,
    V: d.V,
    yIn: d.yIn,
    xIn: d.xIn,
    yOut: d.yOut,
    xOut: d.xIn + (d.yIn - d.yOut) / d.LoV0,
  };
  state.warning = null;
  state.axesFrozen = null;
  reclampBoth();
  notify();
}

/**
 * Set a secondary numeric parameter. Rejects values that would make the state
 * infeasible or nonsensical, returning an error string instead of applying
 * them (Phase 7 acceptance criterion 3 — never put NaN on screen).
 *
 * @returns {string|null} an error message, or null on success
 */
export function setParam(key, value) {
  if (!Number.isFinite(value)) return 'Must be a number.';

  const guards = {
    m: (v) => (v > 0 ? null : 'm must be greater than zero.'),
    V: (v) => (v > 0 ? null : 'Gas flow must be greater than zero.'),
    Eo: (v) => (v > 0 && v <= 1 ? null : 'Tray efficiency must be between 0 and 1.'),
    traySpacing: (v) => (v > 0 ? null : 'Tray spacing must be positive.'),
    hTop: (v) => (v >= 0 ? null : 'Allowance cannot be negative.'),
    hBot: (v) => (v >= 0 ? null : 'Allowance cannot be negative.'),
    yIn: (v) => (v > 0 && v < 1 ? null : 'y_in must lie between 0 and 1.'),
    xIn: (v) => (v >= 0 && v < 1 ? null : 'x_in must lie between 0 and 1.'),
  };
  const err = guards[key]?.(value);
  if (err) return err;

  const candidate = { ...state.inp, [key]: value };

  // Changing m, y_in or x_in moves the clamps, so re-clamp before judging.
  const ry = physics.clampYOut(candidate, candidate.yOut);
  candidate.yOut = ry.value;
  const rx = physics.clampXOut(candidate, candidate.xOut);
  candidate.xOut = rx.value;

  const feas = physics.feasibility(candidate);
  if (!feas.feasible) return feas.reason;

  state.inp = candidate;
  state.pinch = ry.pinch ?? rx.pinch;
  state.axesFrozen = null;
  notify();
  return null;
}

/** Restore the tray defaults. */
export function resetTrayDefaults() {
  state.inp = {
    ...state.inp,
    Eo: TRAY_DEFAULTS.Eo,
    traySpacing: TRAY_DEFAULTS.traySpacing,
    hTop: TRAY_DEFAULTS.hTop,
    hBot: TRAY_DEFAULTS.hBot,
  };
  notify();
}

function reclampBoth() {
  const ry = physics.clampYOut(state.inp, state.inp.yOut);
  state.inp = { ...state.inp, yOut: ry.value };
  const rx = physics.clampXOut(state.inp, state.inp.xOut);
  state.inp = { ...state.inp, xOut: rx.value };
  state.pinch = ry.pinch ?? rx.pinch;
  state.probeZ = 0;
}

/** Kick the first render. */
export function init() {
  notify();
}
