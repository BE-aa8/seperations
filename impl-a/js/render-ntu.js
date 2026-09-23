/**
 * render-ntu.js — the secondary plot: 1/(y − y*) against y, with the area
 * between y_out and y_in shaded. That shaded area IS N_OG.
 *
 * Computes no physics. The curve samples come from the derived bundle's
 * driving-force data via a linear relation supplied by main.js, so no
 * logarithm appears in this file.
 */

import { s, clear, pathFrom, fmt, stext } from './dom.js';
import { makeScale, ticks, formatTick, powerSuffix } from './scale.js';

const BOX = { width: 430, height: 220, pad: { t: 14, r: 16, b: 44, l: 60 } };

let svg;
let layers = {};

export function mount(root) {
  svg = s('svg', {
    viewBox: `0 0 ${BOX.width} ${BOX.height}`,
    role: 'img',
    'aria-label':
      'Reciprocal driving force against gas composition. The shaded area ' +
      'between the inlet and outlet compositions equals the number of ' +
      'transfer units.',
  });
  for (const name of ['grid', 'axes', 'area', 'curve', 'labels']) {
    layers[name] = s('g', { class: `layer-${name}` });
    svg.appendChild(layers[name]);
  }
  root.appendChild(svg);
}

/**
 * @param {Object} derived
 * @param {Object} state
 * @param {(y:number) => number} invDriving  1/(y − y*) at gas composition y,
 *   supplied by main.js from the physics module.
 */
export function update(derived, state, invDriving) {
  clear(layers.grid);
  clear(layers.axes);
  clear(layers.area);
  clear(layers.curve);
  clear(layers.labels);
  if (!derived.feasible) return;

  const { yOut, yIn } = state.inp;
  const n = 120;
  const samples = [];
  let maxF = 0;
  for (let i = 0; i <= n; i++) {
    const y = yOut + (i / n) * (yIn - yOut);
    const f = invDriving(y);
    samples.push({ y, f });
    if (f > maxF) maxF = f;
  }

  const sc = makeScale(BOX, { xMax: yIn * 1.06, yMax: maxF * 1.22 });

  for (const t of ticks(sc.domain.xMax, 4)) {
    layers.grid.appendChild(
      s('line', {
        class: 'grid-line',
        x1: sc.sx(t), y1: sc.plot.y, x2: sc.sx(t), y2: sc.plot.y + sc.plot.h,
      }),
    );
    layers.axes.appendChild(
      s('text', {
        class: 'tick-label', x: sc.sx(t), y: sc.plot.y + sc.plot.h + 17,
        'text-anchor': 'middle', text: formatTick(t, sc.domain.xMax),
      }),
    );
  }
  for (const t of ticks(sc.domain.yMax, 3)) {
    layers.grid.appendChild(
      s('line', {
        class: 'grid-line',
        x1: sc.plot.x, y1: sc.sy(t), x2: sc.plot.x + sc.plot.w, y2: sc.sy(t),
      }),
    );
    layers.axes.appendChild(
      s('text', {
        class: 'tick-label', x: sc.plot.x - 6, y: sc.sy(t) + 3,
        'text-anchor': 'end', text: t >= 1000 ? t.toExponential(0) : t.toFixed(0),
      }),
    );
  }

  layers.axes.appendChild(
    s('line', {
      class: 'axis-line',
      x1: sc.plot.x, y1: sc.plot.y + sc.plot.h,
      x2: sc.plot.x + sc.plot.w, y2: sc.plot.y + sc.plot.h,
    }),
  );
  layers.axes.appendChild(
    stext({
      class: 'axis-label',
      x: sc.plot.x + sc.plot.w / 2, y: sc.plot.y + sc.plot.h + 37,
      'text-anchor': 'middle',
    }, [{ i: 'y' }, ', solute mole fraction in gas', ...powerSuffix(sc.domain.xMax)]),
  );
  layers.axes.appendChild(
    stext({
      class: 'axis-label',
      transform: `rotate(-90 13 ${sc.plot.y + sc.plot.h / 2})`,
      x: 13, y: sc.plot.y + sc.plot.h / 2,
      'text-anchor': 'middle',
    }, ['1 / (', { i: 'y' }, ' − ', { i: 'y' }, '*)']),
  );

  // Shaded area = N_OG.
  const areaPts = [
    { x: sc.sx(samples[0].y), y: sc.sy(0) },
    ...samples.map((p) => ({ x: sc.sx(p.y), y: sc.sy(p.f) })),
    { x: sc.sx(samples[samples.length - 1].y), y: sc.sy(0) },
  ];
  layers.area.appendChild(s('path', { class: 'ntu-area', d: `${pathFrom(areaPts)} Z` }));
  layers.curve.appendChild(
    s('path', {
      class: 'ntu-curve',
      d: pathFrom(samples.map((p) => ({ x: sc.sx(p.y), y: sc.sy(p.f) }))),
    }),
  );

  // Direct label on the area — it is the whole point of the plot.
  const midY = (yOut + yIn) / 2;
  layers.labels.appendChild(
    stext({
      class: 'mark-label label-knock', fill: 'var(--packed-ink)',
      x: sc.sx(midY), y: sc.sy(0) - 14, 'text-anchor': 'middle',
    }, ['area = ', { i: 'N' }, { sub: 'OG' }, ` = ${fmt(derived.NOG, 3)}`]),
  );
}
