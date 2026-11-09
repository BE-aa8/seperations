/**
 * render-summary.js — the side-by-side comparison panel.
 *
 * Computes no physics. Formats for display only; the consistency check compares
 * RAW numbers at a relative tolerance and formats afterwards, never the other
 * way round (RISK-11).
 */

import { h, clear, fmt } from './dom.js';

let root;

export function mount(el) {
  root = el;
}

export function update(derived, state) {
  clear(root);

  if (!derived.feasible) {
    root.appendChild(
      h('div', { class: 'note note--critical' }, [
        h('span', { class: 'note__icon', text: '!' }),
        h('div', {}, [h('strong', { text: 'Infeasible. ' }), derived.reason]),
      ]),
    );
    return;
  }

  const inp = state.inp;

  // --- Headline: the two heights, which is what the site is about.
  root.appendChild(
    h('div', { class: 'stat-row' }, [
      h('div', { class: 'stat stat--tray' }, [
        h('div', { class: 'stat__label', text: 'Tray column' }),
        h('div', { class: 'stat__value' }, [
          fmt(derived.ZTray, 2),
          h('span', { class: 'stat__unit', text: ' m' }),
        ]),
        h('div', { class: 'field__hint', text: `${derived.nActual} actual trays` }),
      ]),
      h('div', { class: 'stat stat--packed' }, [
        h('div', { class: 'stat__label', text: 'Packed bed' }),
        h('div', { class: 'stat__value' }, [
          fmt(derived.Z, 2),
          h('span', { class: 'stat__unit', text: ' m' }),
        ]),
        h('div', { class: 'field__hint', text: `N_OG = ${fmt(derived.NOG, 2)}` }),
      ]),
    ]),
  );

  // --- Comparison table.
  const rows = [
    ['Theoretical stages / transfer units', fmt(derived.N, 3), fmt(derived.NOG, 3)],
    ['Stage or unit height', `HETP ${fmt(derived.HETP, 3)} m`, `H_OG ${fmt(derived.HOG, 3)} m`],
    ['Count installed', `${derived.nActual} trays`, '— (continuous)'],
    ['Height reported', `${fmt(derived.ZTray, 3)} m shell`, `${fmt(derived.Z, 3)} m bed`],
    [
      'Shell with equal allowances',
      `${fmt(derived.ZTray, 3)} m`,
      `${fmt(derived.Z + inp.hTop + inp.hBot, 3)} m`,
    ],
  ];

  const table = h('table', {}, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', { text: '' }),
        h('th', { text: 'Tray' }),
        h('th', { text: 'Packed' }),
      ]),
    ]),
    h(
      'tbody',
      {},
      rows.map(([label, a, b]) =>
        h('tr', {}, [
          h('td', { text: label }),
          h('td', { class: 'num', text: a }),
          h('td', { class: 'num', text: b }),
        ]),
      ),
    ),
  ]);
  root.appendChild(table);

  root.appendChild(
    h('p', { class: 'field__hint', style: 'margin:0.4rem 0 0.9rem' }, [
      'The bed height and the tray shell height are not like-for-like: the bed ' +
        'excludes the disengaging allowances. The last row adds the same ' +
        'allowances to both so the comparison is fair.',
    ]),
  );

  // --- Shared operating conditions.
  root.appendChild(h('h3', { text: 'Shared conditions', style: 'margin-top:0.2rem' }));
  const cond = [
    ['L / V', fmt(derived.LoV, 3)],
    ['L', `${fmt(derived.L, 1)} kmol/h`],
    ['V', `${fmt(inp.V, 1)} kmol/h`],
    ['Absorption factor A', fmt(derived.A, 4)],
    ['(L/V) minimum', fmt(derived.LoVmin, 3)],
    ['L/V ÷ (L/V)min', `${fmt(derived.LoVratio, 3)} ×`],
  ];
  const list = h('div', { class: 'readout' });
  for (const [label, value] of cond) {
    list.appendChild(
      h('div', { class: 'readout__row' }, [
        h('span', { class: 'readout__label', text: label }),
        h('span', { class: 'readout__value', text: value }),
      ]),
    );
  }
  root.appendChild(list);

  // --- The consistency check, labelled honestly.
  const lhs = derived.N * derived.HETP;
  const rhs = derived.Z;
  const agree = Math.abs(lhs - rhs) / Math.abs(rhs) < 1e-9; // RAW comparison

  root.appendChild(
    h('div', { class: 'note', style: 'margin-top:0.9rem' }, [
      h('span', { class: 'note__icon', text: agree ? '✓' : '!' }),
      h('div', {}, [
        h('strong', { text: 'Consistency check: ' }),
        `N × HETP = ${fmt(lhs, 4)} m, Z = ${fmt(rhs, 4)} m. `,
        h('br'),
        h('em', {}, [
          'This is an algebraic identity, not independent validation — HETP is ' +
            'defined as H_OG·N_OG/N, so the product is Z by construction. It ' +
            'does catch an inverted g(A). The checks that genuinely validate ' +
            'the physics are the stepped staircase against Kremser, and ' +
            'numerical integration against Colburn — both in the test suite.',
        ]),
      ]),
    ]),
  );
}
