/**
 * controls.js — the non-drag inputs: preset selection, the A ≈ 1 demo buttons,
 * numeric fields for secondary parameters, and the standing caveats.
 *
 * There is deliberately no `<input type="range">` anywhere in this file. The
 * core interactions are direct manipulation (D-01); sliders are excluded from
 * the primary interaction path by design. Numeric fields for SECONDARY
 * parameters are expressly allowed.
 */

import { h, clear } from './dom.js';
import { SYSTEMS, PACKINGS, DEMO_PRESETS, ILLUSTRATIVE_NOTE } from './presets.js';

let warningEl;
let fieldEls = {};

export function mount(root, wiring) {
  // --- Preset row -----------------------------------------------------------
  const systemSel = h('select', {
    id: 'sys-select',
    onchange: (e) => wiring.onSystem(e.target.value),
  }, SYSTEMS.map((s) => h('option', { value: s.id, text: s.label })));

  const packingSel = h('select', {
    id: 'pack-select',
    onchange: (e) => wiring.onPacking(e.target.value),
  }, PACKINGS.map((p) => h('option', { value: p.id, text: `${p.label} — H_OG ${p.HOG} m` })));

  const demoButtons = h(
    'div',
    { class: 'controls__group' },
    DEMO_PRESETS.map((d) =>
      h('button', {
        type: 'button',
        class: 'btn',
        title: d.note,
        onclick: () => wiring.onDemo(d.id),
        text: d.label,
      }),
    ),
  );

  root.appendChild(
    h('div', { class: 'controls' }, [
      h('div', { class: 'field' }, [
        h('label', { for: 'sys-select', text: 'Chemical system' }),
        systemSel,
      ]),
      h('div', { class: 'field' }, [
        h('label', { for: 'pack-select', text: 'Packing' }),
        packingSel,
      ]),
      h('div', { class: 'field' }, [
        h('label', { text: 'Demonstration presets' }),
        demoButtons,
      ]),
    ]),
  );

  // --- The SO₂-style per-preset warning (D-33) ------------------------------
  warningEl = h('div', { style: 'display:none' });
  root.appendChild(warningEl);

  // --- Settings drawer ------------------------------------------------------
  const params = [
    ['m', 'Equilibrium slope m', 'y* = m·x', 0.01, 'any'],
    ['V', 'Gas flow V, kmol/h', '', 0.1, 'any'],
    ['yIn', 'Entering gas y_in', 'mole fraction', 0, 'any'],
    ['xIn', 'Entering liquid x_in', 'mole fraction', 0, 'any'],
    ['Eo', 'Tray efficiency E_o', '0 < E_o ≤ 1', 0.01, '0.01'],
    ['traySpacing', 'Tray spacing, m', '', 0.05, '0.05'],
    ['hTop', 'Top allowance, m', '', 0, '0.1'],
    ['hBot', 'Bottom allowance, m', '', 0, '0.1'],
  ];

  const body = h('div', { class: 'drawer__body' });
  for (const [key, label, hint, min, step] of params) {
    const input = h('input', {
      type: 'number',
      id: `p-${key}`,
      min: String(min),
      step,
      oninput: (e) => {
        const err = wiring.onParam(key, Number(e.target.value));
        setFieldError(key, err);
      },
    });
    const err = h('div', { class: 'field__error', id: `e-${key}` });
    fieldEls[key] = { input, err };
    body.appendChild(
      h('div', { class: 'field' }, [
        h('label', { for: `p-${key}`, text: label }),
        input,
        hint ? h('div', { class: 'field__hint', text: hint }) : null,
        err,
      ]),
    );
  }
  body.appendChild(
    h('div', { class: 'field' }, [
      h('label', { text: ' ' }),
      h('button', {
        type: 'button', class: 'btn', text: 'Reset tray defaults',
        onclick: wiring.onResetTray,
      }),
    ]),
  );

  root.appendChild(
    h('details', { class: 'drawer' }, [
      h('summary', { text: 'Parameters (m, flows, tray geometry)' }),
      body,
    ]),
  );

  // --- The standing note on what these numbers are (D-52) -------------------
  // Informational, not a warning: nothing here is wrong, but nobody should
  // mistake a teaching default for a design figure.
  root.appendChild(
    h('div', { class: 'note', style: 'margin-bottom:1rem' }, [
      h('span', { class: 'note__icon', text: 'ℹ' }),
      h('div', {}, [h('strong', { text: 'About these numbers. ' }), ILLUSTRATIVE_NOTE]),
    ]),
  );
}

function setFieldError(key, err) {
  const f = fieldEls[key];
  if (!f) return;
  f.err.textContent = err ?? '';
  f.input.setAttribute('aria-invalid', err ? 'true' : 'false');
}

export function update(derived, state) {
  // Keep numeric fields in step with state, without stomping on the field the
  // user is currently typing in.
  const active = document.activeElement;
  for (const [key, f] of Object.entries(fieldEls)) {
    if (f.input === active) continue;
    const v = state.inp[key];
    if (v !== undefined) f.input.value = String(Number(v.toPrecision(10)));
  }

  const sel = document.getElementById('sys-select');
  if (sel && !state.systemId.startsWith('demo:')) sel.value = state.systemId;
  const psel = document.getElementById('pack-select');
  if (psel) psel.value = state.packingId;

  if (state.warning) {
    clear(warningEl);
    warningEl.style.display = '';
    warningEl.className = '';
    warningEl.appendChild(
      h('div', { class: 'note note--critical', style: 'margin-bottom:1rem' }, [
        h('span', { class: 'note__icon', text: '⚠' }),
        h('div', {}, [
          h('strong', { text: 'Model limitation. ' }),
          state.warning,
        ]),
      ]),
    );
  } else {
    warningEl.style.display = 'none';
    clear(warningEl);
  }
}
