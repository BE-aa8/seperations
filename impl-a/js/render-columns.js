/**
 * render-columns.js — the two physical column drawings, side by side on a
 * SHARED metre scale, plus the draggable height probe.
 *
 * The two columns generally have different total heights. That difference is
 * the entire point of the site, so the height axes are deliberately NOT
 * normalised against each other (D-21).
 *
 * Computes no physics.
 */

import { s, clear } from './dom.js';
import { makeDraggable } from './drag.js';

const BOX = { width: 430, height: 430, pad: { t: 22, r: 16, b: 46, l: 46 } };
const COL_W = 74;
const DENSE_TRAYS = 40; // above this, switch to the compressed representation

let svg;
let layers = {};
let probe;
let currentScale;

export function mount(root, wiring) {
  svg = s('svg', {
    viewBox: `0 0 ${BOX.width} ${BOX.height}`,
    role: 'img',
    'aria-label':
      'Tray column and packed column drawn to the same height scale, with a ' +
      'draggable probe that reads the local gas composition in each.',
  });

  for (const name of ['axis', 'tray', 'packed', 'probe']) {
    layers[name] = s('g', { class: `layer-${name}` });
    svg.appendChild(layers[name]);
  }

  probe = s('g', { class: 'handle', 'data-handle': 'probe', 'aria-label': 'Height probe' });
  // Spans the plot from the height axis to the grab tab (x = 46 … 404).
  probe.appendChild(s('rect', { class: 'handle__hit', x: -160, y: -22, width: 364, height: 44 }));
  probe.appendChild(
    s('line', { class: 'probe-line', x1: -160, y1: 0, x2: 170, y2: 0 }),
  );
  // The grab tab sits at the right-hand end, clear of the height ticks.
  probe.appendChild(s('rect', { class: 'probe-tab', x: 170, y: -12, width: 28, height: 24, rx: 3 }));
  probe.appendChild(s('path', { class: 'probe-tab-mark', d: 'M179 -3l5 -5 5 5M179 3l5 5 5 -5' }));
  layers.probe.appendChild(probe);

  probe.drag = makeDraggable(probe, {
    svg,
    axis: 'y',
    // The probe moves in METRES, so it gets its own scale adapter.
    getScale: () => ({
      dy: (py) => currentScale.zFromPx(py),
      dx: (px) => px,
    }),
    onDrag: wiring.onDragProbe,
    onStart: wiring.onDragStart,
    onEnd: wiring.onDragEnd,
    getRange: wiring.getProbeRange,
    describe: (z) => `Probe at ${z.toFixed(2)} metres above the column base`,
  });

  root.appendChild(svg);
}

export function update(derived, state) {
  if (!derived.feasible) {
    clear(layers.tray);
    clear(layers.packed);
    return;
  }

  const inp = state.inp;
  const plotH = BOX.height - BOX.pad.t - BOX.pad.b;
  const plotY = BOX.pad.t;

  // Shared scale across both columns. The packed shell includes the same
  // disengaging allowances as the tray column so the drawings are comparable;
  // the reported Z remains the PACKED BED height, as the plan specifies.
  const packedShell = derived.Z + inp.hTop + inp.hBot;
  const maxH = Math.max(derived.ZTray, packedShell) * 1.04;
  const pxPerM = plotH / maxH;

  const zToPx = (z) => plotY + plotH - z * pxPerM;
  const zFromPx = (py) => (plotY + plotH - py) / pxPerM;
  currentScale = { zToPx, zFromPx, maxH };

  drawHeightAxis(plotY, plotH, maxH, pxPerM, zToPx);

  const trayX = BOX.pad.l + 20;
  const packX = BOX.pad.l + 190;

  drawTrayColumn(layers.tray, trayX, derived, inp, zToPx);
  drawPackedColumn(layers.packed, packX, derived, inp, zToPx, packedShell);

  probe.drag.update(state.probeZ, 206, zToPx(state.probeZ));
}

function drawHeightAxis(plotY, plotH, maxH, pxPerM, zToPx) {
  clear(layers.axis);
  const step = niceStep(maxH);
  for (let z = 0; z <= maxH; z += step) {
    layers.axis.appendChild(
      s('line', {
        class: 'grid-line',
        x1: BOX.pad.l - 4, y1: zToPx(z),
        x2: BOX.width - BOX.pad.r, y2: zToPx(z),
      }),
    );
    layers.axis.appendChild(
      s('text', {
        class: 'tick-label',
        x: BOX.pad.l - 8, y: zToPx(z) + 3,
        'text-anchor': 'end',
        text: z.toFixed(0),
      }),
    );
  }
  layers.axis.appendChild(
    s('text', {
      class: 'axis-label',
      transform: `rotate(-90 12 ${plotY + plotH / 2})`,
      x: 12, y: plotY + plotH / 2,
      'text-anchor': 'middle',
      text: 'height above base, m',
    }),
  );
}

function niceStep(maxH) {
  if (maxH <= 6) return 1;
  if (maxH <= 15) return 2;
  if (maxH <= 40) return 5;
  return 10;
}

function drawTrayColumn(layer, x, derived, inp, zToPx) {
  clear(layer);
  const H = derived.ZTray;
  const n = derived.nActual;

  layer.appendChild(
    s('rect', {
      class: 'col-shell',
      x, y: zToPx(H), width: COL_W,
      height: zToPx(0) - zToPx(H),
      rx: 6,
    }),
  );

  const dense = n > DENSE_TRAYS;
  const drawTray = (k) => {
    const z = inp.hBot + (k - 0.5) * inp.traySpacing;
    layer.appendChild(
      s('line', {
        class: 'col-tray',
        x1: x + 7, y1: zToPx(z),
        x2: x + COL_W - 7, y2: zToPx(z),
      }),
    );
  };

  if (!dense) {
    for (let k = 1; k <= n; k++) drawTray(k);
  } else {
    // Compressed representation: 8 at each end, a break, and an inline count.
    for (let k = 1; k <= 8; k++) drawTray(k);
    for (let k = n - 7; k <= n; k++) drawTray(k);
    const midZ = inp.hBot + (n / 2) * inp.traySpacing;
    layer.appendChild(
      s('line', {
        class: 'col-break',
        x1: x + 4, y1: zToPx(midZ) - 5,
        x2: x + COL_W - 4, y2: zToPx(midZ) - 5,
      }),
    );
    layer.appendChild(
      s('line', {
        class: 'col-break',
        x1: x + 4, y1: zToPx(midZ) + 5,
        x2: x + COL_W - 4, y2: zToPx(midZ) + 5,
      }),
    );
    // The count sits on its own ground between the two break marks, so the
    // dashed lines never strike through it.
    layer.appendChild(
      s('rect', { class: 'col-break-bg', x: x + 3, y: zToPx(midZ) - 3.5, width: COL_W - 6, height: 7 }),
    );
    layer.appendChild(
      s('text', {
        class: 'col-label label-knock',
        x: x + COL_W + 8, y: zToPx(midZ) + 4,
        fill: 'var(--tray-ink)',
        'font-weight': '600',
        text: `+${n - 16} trays`,
      }),
    );
  }

  layer.appendChild(
    s('text', {
      class: 'col-name', x: x + COL_W / 2, y: zToPx(H) - 8,
      'text-anchor': 'middle', fill: 'var(--tray-ink)',
      text: 'TRAY',
    }),
  );

}

function drawPackedColumn(layer, x, derived, inp, zToPx, shellH) {
  clear(layer);
  const bedBottom = inp.hBot;
  const bedTop = inp.hBot + derived.Z;

  layer.appendChild(
    s('rect', {
      class: 'col-shell',
      x, y: zToPx(shellH), width: COL_W,
      height: zToPx(0) - zToPx(shellH), rx: 6,
    }),
  );
  layer.appendChild(
    s('rect', {
      class: 'col-pack',
      x: x + 5, y: zToPx(bedTop),
      width: COL_W - 10, height: Math.max(1, zToPx(bedBottom) - zToPx(bedTop)),
      rx: 3,
    }),
  );
  // A few hatch marks so the bed reads as packing rather than liquid.
  const bedPx = zToPx(bedBottom) - zToPx(bedTop);
  const marks = Math.max(1, Math.min(14, Math.round(bedPx / 12)));
  for (let i = 1; i < marks; i++) {
    const yy = zToPx(bedTop) + (i * bedPx) / marks;
    layer.appendChild(
      s('line', {
        class: 'col-hatch',
        x1: x + 8, y1: yy, x2: x + COL_W - 8, y2: yy,
      }),
    );
  }

  layer.appendChild(
    s('text', {
      class: 'col-name', x: x + COL_W / 2, y: zToPx(shellH) - 8,
      'text-anchor': 'middle', fill: 'var(--packed-ink)',
      text: 'PACKED',
    }),
  );

}
