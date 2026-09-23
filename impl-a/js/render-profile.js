/**
 * render-profile.js — gas composition against height, both columns overlaid.
 *
 * Height is on the VERTICAL axis so the plot reads like the physical columns
 * beside it. The tray curve is a STAIRCASE (discrete jumps at each tray); the
 * packed curve is SMOOTH. That contrast is the physical meaning of "staged
 * versus continuous contacting" and is the single most important thing this
 * plot shows.
 *
 * The two columns have different total heights and the plot does NOT normalise
 * them (D-21) — the shorter curve simply ends first.
 *
 * Computes no physics; profile values arrive as callbacks from main.js.
 */

import { s, h, clear, pathFrom, fmt } from './dom.js';
import { makeScale, ticks, formatTick } from './scale.js';

const BOX = { width: 430, height: 300, pad: { t: 16, r: 18, b: 40, l: 56 } };

let svg;
let layers = {};

export function mount(root) {
  svg = s('svg', {
    viewBox: `0 0 ${BOX.width} ${BOX.height}`,
    role: 'img',
    'aria-label':
      'Gas composition against height for both columns. The tray column is a ' +
      'staircase of discrete jumps; the packed column is a smooth curve.',
  });
  for (const name of ['grid', 'axes', 'packed', 'tray', 'probe', 'labels']) {
    layers[name] = s('g', { class: `layer-${name}` });
    svg.appendChild(layers[name]);
  }
  root.appendChild(svg);
}

/**
 * @param {(j:number) => number} trayY   gas leaving actual tray j (1 = top)
 * @param {(zFromTop:number) => number} packedY gas at zFromTop metres below the bed top
 */
export function update(derived, state, trayY, packedY) {
  for (const k of Object.keys(layers)) clear(layers[k]);
  if (!derived.feasible) return;

  const inp = state.inp;
  const packedShell = derived.Z + inp.hTop + inp.hBot;
  const maxH = Math.max(derived.ZTray, packedShell) * 1.04;

  // x = composition, y = height.
  const sc = makeScale(BOX, { xMax: inp.yIn * 1.08, yMax: maxH });

  // --- grid and axes
  for (const t of ticks(sc.domain.xMax, 4)) {
    layers.grid.appendChild(
      s('line', { class: 'grid-line', x1: sc.sx(t), y1: sc.plot.y,
                  x2: sc.sx(t), y2: sc.plot.y + sc.plot.h }),
    );
    layers.axes.appendChild(
      s('text', { class: 'tick-label', x: sc.sx(t), y: sc.plot.y + sc.plot.h + 13,
                  'text-anchor': 'middle', text: formatTick(t, sc.domain.xMax) }),
    );
  }
  for (const t of ticks(sc.domain.yMax, 4)) {
    layers.grid.appendChild(
      s('line', { class: 'grid-line', x1: sc.plot.x, y1: sc.sy(t),
                  x2: sc.plot.x + sc.plot.w, y2: sc.sy(t) }),
    );
    layers.axes.appendChild(
      s('text', { class: 'tick-label', x: sc.plot.x - 6, y: sc.sy(t) + 3,
                  'text-anchor': 'end', text: t.toFixed(0) }),
    );
  }
  layers.axes.appendChild(
    s('text', { class: 'axis-label', x: sc.plot.x + sc.plot.w / 2,
                y: sc.plot.y + sc.plot.h + 31, 'text-anchor': 'middle',
                text: 'y — gas composition' }),
  );
  layers.axes.appendChild(
    s('text', { class: 'axis-label',
                transform: `rotate(-90 13 ${sc.plot.y + sc.plot.h / 2})`,
                x: 13, y: sc.plot.y + sc.plot.h / 2, 'text-anchor': 'middle',
                text: 'height, m' }),
  );

  // --- packed: smooth
  const bedBottom = inp.hBot;
  const bedTop = inp.hBot + derived.Z;
  const pts = [];
  const nSamp = 80;
  for (let i = 0; i <= nSamp; i++) {
    const z = bedBottom + (i / nSamp) * derived.Z;
    const y = packedY(bedTop - z);
    pts.push({ x: sc.sx(y), y: sc.sy(z) });
  }
  layers.packed.appendChild(s('path', { class: 'profile-packed', d: pathFrom(pts) }));

  // --- tray: a staircase, one discrete jump per actual tray.
  //
  // Built in DATA space (composition, height) and projected once, so the
  // geometry stays readable: the gas enters the base at y_in, rises unchanged
  // to the first tray, jumps to that tray's outlet composition, rises to the
  // next, and so on, leaving the top at y_out.
  const n = derived.nActual;
  const dataPts = [];
  let yNow = inp.yIn;
  dataPts.push({ y: yNow, z: 0 });
  for (let k = 1; k <= n; k++) {
    const z = inp.hBot + (k - 0.5) * inp.traySpacing;
    const j = n - k + 1; // tray k from the bottom is tray j from the top
    dataPts.push({ y: yNow, z }); // rise to this tray, composition unchanged
    yNow = trayY(j);
    dataPts.push({ y: yNow, z }); // the tray's discrete jump
  }
  dataPts.push({ y: yNow, z: derived.ZTray }); // rise to the top of the shell

  layers.tray.appendChild(
    s('path', {
      class: 'profile-tray',
      d: pathFrom(dataPts.map((p) => ({ x: sc.sx(p.y), y: sc.sy(p.z) }))),
    }),
  );

  // --- probe marker on both curves
  const z = state.probeZ;
  layers.probe.appendChild(
    s('line', { class: 'probe-line', x1: sc.plot.x, y1: sc.sy(z),
                x2: sc.plot.x + sc.plot.w, y2: sc.sy(z) }),
  );

  // --- direct labels (≤4 series are direct-labelled as well as legended)
  layers.labels.appendChild(
    s('text', { class: 'mark-label', fill: 'var(--tray)',
                x: sc.sx(inp.yOut) + 6, y: sc.sy(derived.ZTray) + 2,
                text: `tray · ${fmt(derived.ZTray, 2)} m` }),
  );
  layers.labels.appendChild(
    s('text', { class: 'mark-label', fill: 'var(--packed)',
                x: sc.sx(inp.yOut) + 6, y: sc.sy(bedTop) - 5,
                text: `packed · ${fmt(derived.Z, 2)} m bed` }),
  );
}

// ---------------------------------------------------------------------------
// Probe readout
// ---------------------------------------------------------------------------

let readoutRoot;

export function mountReadout(el) {
  readoutRoot = el;
}

/**
 * Show the local gas composition in each column at the probe height.
 *
 * The two columns have different heights, so above the shorter one's top the
 * readout says so rather than extrapolating — that asymmetry is the point.
 */
export function updateReadout(derived, state, trayY, packedY) {
  if (!readoutRoot) return;
  clear(readoutRoot);
  if (!derived.feasible) return;

  const inp = state.inp;
  const z = state.probeZ;

  // --- tray: which tray are we at or above?
  let trayText;
  let trayDetail;
  if (z > derived.ZTray) {
    trayText = '—';
    trayDetail = 'above the column';
  } else {
    const n = derived.nActual;
    let k = 0; // number of trays passed, counting from the bottom
    for (let i = 1; i <= n; i++) {
      if (z >= inp.hBot + (i - 0.5) * inp.traySpacing) k = i;
    }
    const y = k === 0 ? inp.yIn : trayY(n - k + 1);
    trayText = fmt(y, 5);
    trayDetail = k === 0 ? 'below the bottom tray' : `leaving tray ${n - k + 1} of ${n} from the top`;
  }

  // --- packed: continuous within the bed
  const bedBottom = inp.hBot;
  const bedTop = inp.hBot + derived.Z;
  let packText;
  let packDetail;
  if (z < bedBottom) {
    packText = fmt(inp.yIn, 5);
    packDetail = 'below the bed';
  } else if (z > bedTop) {
    packText = fmt(inp.yOut, 5);
    packDetail = 'above the bed';
  } else {
    packText = fmt(packedY(bedTop - z), 5);
    packDetail = `${fmt(bedTop - z, 2)} m below the bed top`;
  }

  const row = (label, value, detail, cls) =>
    h('div', { class: 'readout__row' }, [
      h('span', { class: 'readout__label' }, [
        h('span', {
          class: `legend__swatch legend__swatch--${cls}`,
          style: 'display:inline-block;margin-right:6px;vertical-align:middle',
        }),
        label,
        h('div', { class: 'field__hint', text: detail }),
      ]),
      h('span', { class: 'readout__value', text: value }),
    ]);

  readoutRoot.appendChild(
    h('div', { class: 'readout' }, [
      h('div', { class: 'readout__row' }, [
        h('span', { class: 'readout__label', text: 'Probe height' }),
        h('span', { class: 'readout__value', text: `${fmt(z, 2)} m` }),
      ]),
      row('Tray column y', trayText, trayDetail, 'tray'),
      row('Packed column y', packText, packDetail, 'packed'),
    ]),
  );
}
