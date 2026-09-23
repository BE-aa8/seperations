/**
 * render-summary.js — every numeric readout outside the figures:
 *
 *   headline    the two heights, set large beside the column drawing
 *   conditions  the shared operating point, with range gauges
 *   sheet       the worked calculation (static markup, numbered slots)
 *   live        a polite screen-reader summary of the result
 *
 * Computes no physics. Formats for display only; the consistency check compares
 * RAW numbers at a relative tolerance and formats afterwards, never the other
 * way round (RISK-11). The few sums and quotients here (shell with equal
 * allowances, N / E_o, R from the two driving forces) are display arithmetic
 * on values physics already returned.
 */

import { h, clear, fmt, glyph, icon, withUnit } from './dom.js';
import { PACKINGS } from './presets.js';

let roots = {};
let liveTimer = null;

export function mount({ headline, conditions, sheet, live }) {
  roots = { headline, conditions, sheet, live };
}

export function update(derived, state) {
  renderHeadline(derived, state);
  renderConditions(derived, state);
  renderSheet(derived, state);
  announce(derived, state);
}

// --- Headline ---------------------------------------------------------------

function renderHeadline(derived, state) {
  const root = roots.headline;
  if (!root) return;
  clear(root);

  if (!derived.feasible) {
    root.appendChild(
      h('div', { class: 'notice notice--limit' }, [
        icon('limit'),
        h('p', {}, [h('strong', { text: 'Infeasible. ' }), derived.reason]),
      ]),
    );
    return;
  }

  const inp = state.inp;
  const packedShell = derived.Z + inp.hTop + inp.hBot;
  const diff = derived.ZTray - packedShell;

  root.appendChild(
    h('div', { class: 'readouts' }, [
      h('div', { class: 'readout readout--tray' }, [
        h('span', { class: 'readout__tag' }, [glyph('tray'), 'Tray column']),
        h('span', { class: 'readout__value' }, [withUnit(fmt(derived.ZTray, 2), 'm')]),
        h('span', { class: 'readout__meta', text: `${derived.nActual} actual trays · shell` }),
      ]),
      h('div', { class: 'readout readout--packed' }, [
        h('span', { class: 'readout__tag' }, [glyph('packed'), 'Packed bed']),
        h('span', { class: 'readout__value' }, [withUnit(fmt(derived.Z, 2), 'm')]),
        h('span', { class: 'readout__meta', text: `${fmt(packedShell, 2)} m shell with allowances` }),
      ]),
      h('div', { class: 'readout readout--delta' }, [
        h('span', { class: 'readout__tag', text: 'Shell difference' }),
        h('span', { class: 'readout__value' }, [withUnit(`${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff), 2)}`, 'm')]),
        h('span', { class: 'readout__meta', text: diff >= 0 ? 'tray column taller' : 'packed column taller' }),
      ]),
    ]),
  );
}

// --- Operating point --------------------------------------------------------

/**
 * A range gauge on a log scale: a track, a fill up to the value, a marker, and
 * optional limit / reference marks. HTML rather than SVG, so the tick text
 * never stretches with the panel width. Pure presentation.
 */
function gauge({ value, lo, hi, ticks, limit, ref, label }) {
  const pct = (v) => `${((Math.log(Math.min(Math.max(v, lo), hi) / lo) / Math.log(hi / lo)) * 100).toFixed(2)}%`;
  return h('div', { class: 'gauge', role: 'img', 'aria-label': label }, [
    h('div', { class: 'gauge__track' }, [
      h('div', { class: 'gauge__fill', style: `width:${pct(value)}` }),
      limit !== undefined ? h('div', { class: 'gauge__limit', style: `left:${pct(limit)}` }) : null,
      ref !== undefined ? h('div', { class: 'gauge__ref', style: `left:${pct(ref)}` }) : null,
      h('div', { class: 'gauge__mark', style: `left:${pct(value)}` }),
    ]),
    h('div', { class: 'gauge__ticks', 'aria-hidden': 'true' },
      ticks.map((t) => h('span', { style: `left:${pct(t.v)}`, html: t.label }))),
  ]);
}

function row(label, value, extra = []) {
  return h('div', { class: 'row' }, [
    h('span', { class: 'row__label' }, [h('span', {}, [].concat(label))]),
    h('span', { class: 'row__value' }, [].concat(value)),
    ...extra,
  ]);
}

function renderConditions(derived, state) {
  const root = roots.conditions;
  if (!root) return;
  clear(root);
  const inp = state.inp;

  const rows = h('div', { class: 'rows' });

  if (derived.feasible) {
    rows.appendChild(
      row(['Liquid rate as a multiple of the minimum'], withUnit(fmt(derived.LoVratio, 2), '×'), [
        h('div', { class: 'row__bar' }, [
          gauge({
            value: derived.LoVratio, lo: 1, hi: 20, limit: 1,
            ticks: [{ v: 1, label: 'min' }, { v: 2, label: '2×' }, { v: 5, label: '5×' }, { v: 20, label: '20×' }],
            label: `L/V is ${fmt(derived.LoVratio, 2)} times the minimum`,
          }),
        ]),
      ]),
    );
  }
  rows.appendChild(
    row([h('span', {}, ['Absorption factor ', h('i', { text: 'A' })])], fmt(derived.A, 3), [
      h('div', { class: 'row__bar' }, [
        gauge({
          value: derived.A, lo: 0.5, hi: 20, ref: 1,
          ticks: [{ v: 0.5, label: '0.5' }, { v: 1, label: '<i>A</i> = 1' }, { v: 2, label: '2' }, { v: 5, label: '5' }, { v: 20, label: '20' }],
          label: `Absorption factor ${fmt(derived.A, 3)}`,
        }),
      ]),
    ]),
  );
  rows.appendChild(row([h('i', { text: 'L' }), '/', h('i', { text: 'V' })], fmt(derived.LoV, 3)));
  if (derived.feasible) {
    rows.appendChild(row(['Minimum ', h('i', { text: 'L' }), '/', h('i', { text: 'V' })], fmt(derived.LoVmin, 3)));
  }
  rows.appendChild(row(['Liquid flow ', h('i', { text: 'L' })], withUnit(fmt(derived.L, 1), 'kmol/h')));
  rows.appendChild(row(['Gas flow ', h('i', { text: 'V' })], withUnit(fmt(inp.V, 1), 'kmol/h')));
  root.appendChild(rows);
}

// --- The calculation sheet ---------------------------------------------------

function renderSheet(derived, state) {
  const root = roots.sheet;
  if (!root) return;
  const inp = state.inp;
  const set = (slot, text) => {
    for (const el of root.querySelectorAll(`[data-slot="${slot}"]`)) el.textContent = text;
  };
  const setU = (slot, value, unit) => {
    for (const el of root.querySelectorAll(`[data-slot="${slot}"]`)) {
      clear(el).append(value, unit ? h('span', { class: 'unit', text: unit }) : '');
    }
  };

  root.classList.toggle('is-infeasible', !derived.feasible);

  set('yIn', fmt(inp.yIn, 4));
  set('yOut', fmt(inp.yOut, 4));
  set('xIn', fmt(inp.xIn, 4));
  set('xOut', fmt(inp.xOut, 4));
  set('m', fmt(inp.m, 2));
  set('V', fmt(inp.V, 1));
  set('LoV', fmt(derived.LoV, 3));
  set('A', fmt(derived.A, 3));
  set('Aside', derived.A >= 1 ? 'more solvent capacity than needed' : 'solvent-limited');

  if (!derived.feasible) {
    for (const slot of ['R', 'N', 'Eo', 'NoverE', 'nActual', 'trayExpr', 'ZTray', 'NOG', 'HOG', 'bedExpr', 'Z', 'HETP', 'ZShell', 'diff', 'check']) set(slot, '—');
    return;
  }

  set('R', fmt(derived.driving.inlet / derived.driving.top, 3));
  set('N', fmt(derived.N, 3));
  set('Eo', fmt(inp.Eo, 2));
  set('NoverE', fmt(derived.N / inp.Eo, 3));
  set('nActual', `${derived.nActual} trays`);
  set('trayExpr', `${derived.nActual} × ${fmt(inp.traySpacing, 2)} + ${fmt(inp.hTop, 1)} + ${fmt(inp.hBot, 1)}`);
  setU('ZTray', fmt(derived.ZTray, 2), 'm');

  const pack = PACKINGS.find((p) => p.id === state.packingId);
  set('packing', pack ? pack.label.toLowerCase().replace(/^metal |^ceramic /, '') : 'this packing');
  set('NOG', fmt(derived.NOG, 3));
  setU('HOG', fmt(derived.HOG, 2), 'm');
  set('bedExpr', `${fmt(derived.HOG, 2)} × ${fmt(derived.NOG, 3)}`);
  setU('Z', fmt(derived.Z, 2), 'm');

  const shell = derived.Z + inp.hTop + inp.hBot;
  const diff = derived.ZTray - shell;
  setU('HETP', fmt(derived.HETP, 3), 'm');
  setU('ZShell', fmt(shell, 2), 'm');
  setU('diff', `${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff), 2)}`, 'm');
  set('diffWhat', diff >= 0 ? 'Tray shell is taller by' : 'Packed shell is taller by');

  // The consistency check, labelled honestly (it is an identity).
  const lhs = derived.N * derived.HETP;
  const agree = Math.abs(lhs - derived.Z) / Math.abs(derived.Z) < 1e-9; // RAW comparison
  set('check', agree ? `holds (${fmt(lhs, 4)} m)` : `FAILS (${fmt(lhs, 4)} m ≠ ${fmt(derived.Z, 4)} m)`);
}

// --- Screen-reader summary ----------------------------------------------------

function announce(derived, state) {
  const el = roots.live;
  if (!el) return;
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    if (!derived.feasible) {
      el.textContent = `Infeasible. ${derived.reason}`;
      return;
    }
    const pinch =
      state.pinch === 'top' ? ' Pinched at the purity limit.' :
      state.pinch === 'bottom' ? ' Pinched at the minimum liquid rate.' : '';
    el.textContent =
      `Tray column ${fmt(derived.ZTray, 2)} metres, ${derived.nActual} trays. ` +
      `Packed bed ${fmt(derived.Z, 2)} metres. Absorption factor ${fmt(derived.A, 2)}.${pinch}`;
  }, 700);
}
