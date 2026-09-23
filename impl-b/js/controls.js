import {
  BALANCED,
  NEAR_BALANCED,
  PACKINGS,
  SYSTEMS
} from "./presets.js";
import {
  loadBalanced,
  loadPreset,
  setField,
  setPacking
} from "./state.js";

let root;
let refs = {};

const NUMBER_FIELDS = [
  ["m", "m"],
  ["V", "V [kmol/h]"],
  ["yIn", "y_in"],
  ["xIn", "x_in"],
  ["Eo", "Overall tray efficiency"],
  ["traySpacing", "Tray spacing [m]"],
  ["hTop", "Top allowance [m]"],
  ["hBot", "Bottom allowance [m]"]
];

function buildNumberFields() {
  return NUMBER_FIELDS.map(([id, label]) => (
    `
      <label for="${id}">
        ${label}
        <input id="${id}" type="number" inputmode="decimal">
      </label>
    `
  )).join("");
}

export function mount(elementRoot) {
  root = elementRoot;

  root.innerHTML = `
    <div class="control-row">
      <label for="system">
        Chemical system
        <select id="system"></select>
      </label>

      <label for="packing">
        Packing
        <select id="packing"></select>
      </label>
    </div>

    <div class="control-grid">
      ${buildNumberFields()}
    </div>

    <div class="button-row">
      <button id="balanced" type="button">Balanced (A = 1)</button>
      <button id="near" type="button">Near-balanced</button>
    </div>

    <p id="message" class="control-note" aria-live="polite"></p>
  `;

  refs.system = root.querySelector("#system");
  refs.packing = root.querySelector("#packing");
  refs.message = root.querySelector("#message");

  Object.values(SYSTEMS).forEach((preset) => {
    refs.system.add(new Option(preset.name, preset.id));
  });

  refs.system.add(new Option(BALANCED.name, "balanced"));
  refs.system.add(new Option(NEAR_BALANCED.name, "near-balanced"));

  Object.values(PACKINGS).forEach((packing) => {
    refs.packing.add(new Option(packing.name, packing.id));
  });

  refs.system.addEventListener("change", () => {
    if (refs.system.value === "balanced") {
      loadBalanced();
    } else if (refs.system.value === "near-balanced") {
      loadBalanced(true);
    } else {
      loadPreset(SYSTEMS[refs.system.value]);
    }
  });

  refs.packing.addEventListener("change", () => {
    setPacking(refs.packing.value);
  });

  root.querySelector("#balanced").addEventListener("click", () => {
    loadBalanced();
  });

  root.querySelector("#near").addEventListener("click", () => {
    loadBalanced(true);
  });

  for (const [id] of NUMBER_FIELDS) {
    refs[id] = root.querySelector("#" + id);

    refs[id].addEventListener("change", () => {
      const result = setField(id, Number(refs[id].value));

      if (result?.ok === false) {
        refs.message.textContent = result.message;
      }
    });
  }

  return refs;
}

export function update(state, derived) {
  for (const [id] of NUMBER_FIELDS) {
    if (document.activeElement !== refs[id]) {
      refs[id].value = state[id];
    }
  }

  refs.packing.value = state.packing;
  refs.system.value = state.presetId;

  refs.message.textContent =
    state.presetId === "so2"
      ? "Straight-line model strained here: real SO₂-water equilibrium is curved; values are illustrative."
      : derived.reason;
}
