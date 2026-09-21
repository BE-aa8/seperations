import * as physics from "./physics.js";
import {
  BALANCED,
  DEFAULTS,
  NEAR_BALANCED,
  PACKINGS
} from "./presets.js";

let state = makeState(DEFAULTS);
let derived = physics.solve(state);
const listeners = new Set();

function makeState(source) {
  const packing = source.packing || "pall";

  return {
    m: source.m,
    V: source.V,
    xIn: source.xIn,
    yIn: source.yIn,
    yOut: source.yOut,
    xOut:
      source.xOut ??
      source.xIn + (source.yIn - source.yOut) / (2 * source.m),
    HOG: source.HOG ?? PACKINGS[packing].HOG,
    Eo: source.Eo,
    traySpacing: source.traySpacing,
    hTop: source.hTop,
    hBot: source.hBot,
    packing,
    presetId: source.id || "generic",
    probeZ: 0
  };
}

function clampState(candidate) {
  const yClamp = physics.clampYOut(candidate, candidate.yOut);
  const withY = {
    ...candidate,
    yOut: yClamp.value
  };

  return {
    ...withY,
    xOut: physics.clampXOut(withY, withY.xOut).value
  };
}

function emit() {
  derived = physics.solve(state);

  const maxZ = Math.max(derived.Z, derived.ZTray, 0);
  const probeZ = Math.min(Math.max(state.probeZ, 0), maxZ);

  let trayIndex = derived.nActual + 1;

  if (derived.nActual > 0 && derived.ZTray > 0) {
    const step = derived.ZTray / derived.nActual;
    trayIndex = Math.min(
      derived.nActual + 1,
      Math.max(1, derived.nActual + 1 - Math.ceil(probeZ / step))
    );
  }

  const packedY =
    probeZ <= derived.Z
      ? physics.gasProfilePacked(
        state,
        derived.Z - probeZ
      )
      : null;

  const trayY =
    probeZ <= derived.ZTray
      ? physics.gasProfileTray(state, trayIndex)
      : null;

  derived = {
    ...derived,
    probe: {
      z: probeZ,
      packedY,
      trayY,
      trayIndex,
      packedAboveTop: probeZ > derived.Z,
      trayAboveTop: probeZ > derived.ZTray
    }
  };

  listeners.forEach((listener) => listener({ ...state }, derived));
}

export function getState() {
  return { ...state };
}

export function getDerived() {
  return derived;
}

export function subscribe(listener) {
  listeners.add(listener);
  listener({ ...state }, derived);
  return () => listeners.delete(listener);
}

export function setField(field, value) {
  if (!(field in state) || !Number.isFinite(value)) {
    return {
      ok: false,
      message: "Enter a finite number."
    };
  }

  const candidate = {
    ...state,
    [field]: value
  };

  if (field === "m" && value <= 0) {
    return { ok: false, message: "m must be positive." };
  }

  if (field === "V" && value <= 0) {
    return { ok: false, message: "V must be positive." };
  }

  if (field === "Eo" && (value <= 0 || value > 1)) {
    return { ok: false, message: "E_o must be greater than 0 and no more than 1." };
  }

  if (
    ["traySpacing", "hTop", "hBot"].includes(field) &&
    value < 0
  ) {
    return { ok: false, message: "Geometry values cannot be negative." };
  }

  if (field === "probeZ") {
    state = {
      ...state,
      probeZ: Math.max(0, value)
    };
    emit();
    return { ok: true };
  }

  if (candidate.yIn <= candidate.m * candidate.xIn) {
    return {
      ok: false,
      message: "The gas inlet composition must exceed equilibrium with the liquid inlet."
    };
  }

  const next = clampState(candidate);
  const f = physics.feasibility(next);

  if (!f.feasible) {
    return {
      ok: false,
      message: f.reason
    };
  }

  state = next;
  emit();

  return { ok: true };
}

export function loadPreset(preset) {
  state = clampState(makeState(preset));
  emit();
}

export function setPacking(id) {
  if (!PACKINGS[id]) {
    return;
  }

  state = {
    ...state,
    packing: id,
    HOG: PACKINGS[id].HOG
  };

  emit();
}

export function loadBalanced(near = false) {
  loadPreset(near ? NEAR_BALANCED : BALANCED);
}
