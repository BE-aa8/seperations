/**
 * controls.js — the non-drag inputs: preset selection, the A ≈ 1 demo buttons,
 * numeric fields for secondary parameters, the standing caveats, and the
 * "What to try" shortcuts.
 *
 * There is deliberately no `<input type="range">` anywhere in this file. The
 * core interactions are direct manipulation (D-01); sliders are excluded from
 * the primary interaction path by design. Numeric fields for SECONDARY
 * parameters are expressly allowed.
 */

import { h, clear, icon, notation, fmt } from './dom.js';
import { SYSTEMS, PACKINGS, DEMO_PRESETS, ILLUSTRATIVE_NOTE } from './presets.js';

let alarmEl;
let digestEl;
let systemHint;
let packingHint;
let fieldEls = {};
let demoButtons = [];

// Secondary parameters: key, label (as nodes), unit, min, step.
const PARAMS = [
  ['m', ['Equilibrium slope ', h('i', { text: 'm' })], '', 0.01, 'any'],
  ['V', ['Gas flow ', h('i', { text: 'V' })], 'kmol/h', 0.1, 'any'],
  ['yIn', ['Gas in ', h('i', { text: 'y' }), h('sub', { text: 'in' })], 'mole fraction', 0, 'any'],
  ['xIn', ['Liquid in ', h('i', { text: 'x' }), h('sub', { text: 'in' })], 'mole fraction', 0, 'any'],
  ['Eo', ['Tray efficiency ', h('i', { text: 'E' }), h('sub', { text: 'o' })], '0 to 1', 0.01, '0.01'],
  ['traySpacing', ['Tray spacing ', h('i', { text: 'S' })], 'm', 0.05, '0.05'],
  ['hTop', ['Top allowance'], 'm', 0, '0.1'],
  ['hBot', ['Bottom allowance'], 'm', 0, '0.1'],
];

export function mount(root, wiring) {
  // --- Toolbar --------------------------------------------------------------
  const systemSel = h(
    'select',
    { id: 'sys-select', 'aria-describedby': 'sys-hint', onchange: (e) => wiring.onSystem(e.target.value) },
    [
      ...SYSTEMS.map((s) => h('option', { value: s.id, text: s.label })),
      h('option', { value: 'demo', text: 'Demonstration case (A ≈ 1)', disabled: '' }),
    ],
  );
  const packingSel = h(
    'select',
    { id: 'pack-select', 'aria-describedby': 'pack-hint', onchange: (e) => wiring.onPacking(e.target.value) },
    PACKINGS.map((p) => h('option', { value: p.id, text: p.label })),
  );
  systemHint = h('span', { class: 'field__hint', id: 'sys-hint' });
  packingHint = h('span', { class: 'field__hint', id: 'pack-hint' });

  demoButtons = DEMO_PRESETS.map((d) =>
    h('button', {
      type: 'button',
      class: 'btn',
      title: d.note,
      'aria-pressed': 'false',
      'data-demo': d.id,
      onclick: () => wiring.onDemo(d.id),
      // The second case is a numerical stress test of the A → 1 limit, not an
      // operating point anyone would design to, so it is labelled as one.
      html: d.id === 'balanced' ? '<span><i>A</i> = 1</span>' : '<span>Near-1 stress test</span>',
    }),
  );

  root.appendChild(
    h('div', { class: 'toolbar', role: 'group', 'aria-label': 'Duty and hardware' }, [
      h('div', { class: 'field field--system' }, [
        h('label', { class: 'field__label', for: 'sys-select', text: 'Chemical system' }),
        systemSel,
        systemHint,
      ]),
      h('div', { class: 'field field--packing' }, [
        h('label', { class: 'field__label', for: 'pack-select', text: 'Packing' }),
        packingSel,
        packingHint,
      ]),
      h('div', { class: 'field', role: 'group', 'aria-labelledby': 'demo-label' }, [
        h('span', { class: 'field__label', id: 'demo-label', text: 'Balanced cases' }),
        h('div', { class: 'seg' }, demoButtons),
        h('span', { class: 'field__hint', text: 'Round numbers you can check by hand' }),
      ]),
      h('div', { class: 'toolbar__end' }, [
        h('button', {
          type: 'button',
          class: 'btn btn--quiet',
          title: 'Put both drag handles back where this system starts',
          onclick: wiring.onReset,
        }, [icon('reset'), 'Reset']),
      ]),
    ]),
  );

  // --- Parameters panel -----------------------------------------------------
  const body = h('div', { class: 'params__body' });
  for (const [key, label, unit, min, step] of PARAMS) {
    const input = h('input', {
      type: 'number',
      id: `p-${key}`,
      min: String(min),
      step,
      inputmode: 'decimal',
      'aria-describedby': `e-${key}`,
      oninput: (e) => {
        const err = wiring.onParam(key, Number(e.target.value));
        setFieldError(key, err);
      },
    });
    const err = h('div', { class: 'field__error', id: `e-${key}`, role: 'status' });
    fieldEls[key] = { input, err };
    body.appendChild(
      h('div', { class: 'field' }, [
        h('label', { class: 'field__label', for: `p-${key}` }, [...label, unit ? `, ${unit}` : '']),
        input,
        err,
      ]),
    );
  }
  body.appendChild(
    h('div', { class: 'params__actions' }, [
      h('button', {
        type: 'button', class: 'btn', text: 'Reset tray defaults',
        onclick: wiring.onResetTray,
      }),
    ]),
  );

  digestEl = h('span', { class: 'params__digest' });
  root.appendChild(
    h('details', { class: 'params' }, [
      h('summary', {}, [
        h('span', { class: 'params__title' }, [icon('chevron'), 'Edit parameters']),
        digestEl,
      ]),
      body,
    ]),
  );

  // --- Per-preset caution (D-33) ---------------------------------------------
  alarmEl = h('div', { class: 'alarm-slot', role: 'status' });
  root.appendChild(alarmEl);
}

/** The standing note on what these numbers are (D-52). Quiet, but always on. */
export function mountNote(el) {
  if (!el) return;
  el.append(icon('info'), h('span', {}, [h('strong', { text: 'About these numbers. ' }), ILLUSTRATIVE_NOTE]));
}

/**
 * Wire the "What to try" buttons. Each applies a state, then brings the
 * console into view so the effect is seen rather than scrolled past.
 */
export function mountTry(root, wiring, target) {
  if (!root) return;
  // Which control each experiment changes, so it can be pointed out: the
  // buttons are shortcuts to the toolbar, not separate operations.
  const changes = {
    pinch: '[data-handle="x_out"]',
    balanced: '[data-demo="balanced"]',
    structured: '#pack-select',
    so2: '#sys-select',
  };
  for (const btn of root.querySelectorAll('[data-try]')) {
    btn.addEventListener('click', () => {
      wiring.onTry(btn.dataset.try);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
      const el = document.querySelector(changes[btn.dataset.try]);
      if (el) {
        el.classList.remove('is-changed');
        void el.getBoundingClientRect(); // restart the highlight if clicked twice
        el.classList.add('is-changed');
        setTimeout(() => el.classList.remove('is-changed'), 2400);
      }
    });
  }
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

  const inp = state.inp;
  const isDemo = state.systemId.startsWith('demo:');
  const sel = document.getElementById('sys-select');
  if (sel) sel.value = isDemo ? 'demo' : state.systemId;
  const psel = document.getElementById('pack-select');
  if (psel) psel.value = state.packingId;

  for (const b of demoButtons) {
    b.setAttribute('aria-pressed', String(state.systemId === `demo:${b.dataset.demo}`));
  }

  const sys = SYSTEMS.find((s) => s.id === state.systemId);
  clear(systemHint).append(
    h('i', { text: 'm' }), ` = ${fmt(inp.m, 2)}`,
    sys && sys.conditions && sys.conditions !== '—' ? ` · ${sys.conditions}` : '',
  );
  const pack = PACKINGS.find((p) => p.id === state.packingId);
  clear(packingHint).append(h('i', { text: 'H' }), h('sub', { text: 'OG' }), ` = ${fmt(inp.HOG, 2)} m`,
    pack ? ` · ${pack.note.split('.')[0]}` : '');

  clear(digestEl).append(
    ...[
      [h('i', { text: 'm' }), fmt(inp.m, 2)],
      [h('i', { text: 'V' }), `${fmt(inp.V, 0)} kmol/h`],
      [[h('i', { text: 'E' }), h('sub', { text: 'o' })], fmt(inp.Eo, 2)],
      [h('i', { text: 'S' }), `${fmt(inp.traySpacing, 2)} m`],
      [[h('i', { text: 'h' }), h('sub', { text: 'top' })], `${fmt(inp.hTop, 1)} m`],
      [[h('i', { text: 'h' }), h('sub', { text: 'bot' })], `${fmt(inp.hBot, 1)} m`],
    ].map(([k, v]) => h('span', {}, [].concat(k, ' ', h('b', { text: v })))),
  );

  if (state.warning) {
    clear(alarmEl).appendChild(
      h('div', { class: 'notice notice--caution' }, [
        icon('caution'),
        h('p', {}, [h('strong', { text: 'Caution on this system. ' }), ...notation(state.warning)]),
      ]),
    );
  } else {
    clear(alarmEl);
  }
}
