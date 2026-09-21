/**
 * render-yx.js — the central y–x diagram: equilibrium line, draggable operating
 * line, McCabe-Thiele staircase, pinch flag.
 *
 * Pure function of the derived bundle (PLAN §2.2). Computes no physics: no
 * Math.log appears in this file, and none should.
 */

import { s, clear, pathFrom } from './dom.js';
import { makeScale, ticks, formatTick } from './scale.js';
import { makeDraggable } from './drag.js';

const BOX = { width: 430, height: 390, pad: { t: 16, r: 74, b: 42, l: 56 } };

let svg;
let layers = {};
let handles = {};
let currentScale;

/**
 * @param {HTMLElement} root
 * @param {Object} wiring callbacks supplied by main.js so this module never
 *   imports state.js
 */
export function mount(root, wiring) {
  svg = s('svg', {
    viewBox: `0 0 ${BOX.width} ${BOX.height}`,
    role: 'img',
    'aria-label':
      'Equilibrium and operating lines with the McCabe-Thiele staircase. ' +
      'Two draggable points set the separation specification and the liquid rate.',
  });

  // Draw order matters: grid, then lines, then staircase, then handles on top.
  for (const name of ['grid', 'axes', 'eq', 'op', 'stair', 'flags', 'handles']) {
    layers[name] = s('g', { class: `layer-${name}` });
    svg.appendChild(layers[name]);
  }

  handles.yOut = buildHandle('y_out', 'Treated gas composition');
  handles.xOut = buildHandle('x_out', 'Liquid rate');
  layers.handles.appendChild(handles.yOut.g);
  layers.handles.appendChild(handles.xOut.g);

  const getScale = () => currentScale;

  handles.yOut.drag = makeDraggable(handles.yOut.g, {
    svg,
    axis: 'y',
    getScale,
    onDrag: wiring.onDragYOut,
    onStart: wiring.onDragStart,
    onEnd: wiring.onDragEnd,
    getRange: wiring.getYOutRange,
    describe: (v) => `Treated gas y_out = ${v.toExponential(3)} mole fraction`,
  });

  handles.xOut.drag = makeDraggable(handles.xOut.g, {
    svg,
    axis: 'x',
    getScale,
    onDrag: wiring.onDragXOut,
    onStart: wiring.onDragStart,
    onEnd: wiring.onDragEnd,
    getRange: wiring.getXOutRange,
    describe: (v) => `Rich liquid x_out = ${v.toExponential(3)} mole fraction`,
  });

  root.appendChild(svg);
}

function buildHandle(id, label) {
  const g = s('g', {
    class: 'handle',
    'data-handle': id,
    'aria-label': label,
  });
  // Large transparent hit circle first, so it sits beneath the visible dot but
  // captures the pointer. r = 22 user units ≈ 44 px at typical render scale.
  g.appendChild(s('circle', { class: 'handle__hit', r: 22 }));
  g.appendChild(s('circle', { class: 'handle__ring', r: 13 }));
  const dot = s('circle', { class: 'handle__dot', r: 7 });
  g.appendChild(dot);
  return { g, dot };
}

export function update(derived, state, eqY) {
  const inp = state.inp;
  const axes = derived.axes;
  currentScale = makeScale(BOX, { xMax: axes.xMax, yMax: axes.yMax });
  const sc = currentScale;

  drawGridAndAxes(sc);

  // --- Equilibrium line: structural geometry, chrome ink, dashed + labelled.
  //
  // Sampled through the injected `eqY` adapter rather than computed here, so
  // this renderer never evaluates equilibrium itself (D-25, RISK-12). It is
  // drawn as a polyline of samples rather than a single straight segment, so
  // that a curved equilibrium relation (future phase F-4) renders correctly
  // through this same code with no change.
  clear(layers.eq);
  const eqPts = [];
  const nEq = 48;
  let xEqEnd = axes.xMax;
  for (let i = 0; i <= nEq; i++) {
    const x = (i / nEq) * axes.xMax;
    const y = eqY(x);
    if (y > axes.yMax) {
      xEqEnd = x;
      break;
    }
    eqPts.push({ x: sc.sx(x), y: sc.sy(y) });
    xEqEnd = x;
  }
  layers.eq.appendChild(s('path', { class: 'eq-line', d: pathFrom(eqPts) }));
  const yEqEnd = eqY(xEqEnd);
  layers.eq.appendChild(
    s('text', {
      class: 'mark-label',
      fill: 'var(--ink-muted)',
      x: sc.sx(xEqEnd) + 4,
      y: sc.sy(yEqEnd) - 4,
      text: 'y* = m·x',
    }),
  );

  // --- Operating line.
  clear(layers.op);
  layers.op.appendChild(
    s('line', {
      class: 'op-line',
      x1: sc.sx(inp.xIn), y1: sc.sy(inp.yOut),
      x2: sc.sx(inp.xOut), y2: sc.sy(inp.yIn),
    }),
  );
  layers.op.appendChild(
    s('text', {
      class: 'mark-label',
      fill: 'var(--ink)',
      x: sc.sx(inp.xOut) + 8,
      y: sc.sy(inp.yIn) + 4,
      text: 'operating',
    }),
  );

  // --- Staircase.
  clear(layers.stair);
  if (derived.feasible && derived.staircase) {
    const pts = derived.staircase.vertices.map((v) => ({ x: sc.sx(v.x), y: sc.sy(v.y) }));
    const dense = derived.staircase.risersDrawn > 20;
    layers.stair.appendChild(
      s('path', {
        class: `staircase${dense ? ' staircase--dense' : ''}`,
        d: pathFrom(pts),
      }),
    );
    if (!dense) {
      // Number the complete risers. Selective labelling, not one per vertex.
      for (let i = 0; i < derived.staircase.fullSteps; i++) {
        const v = derived.staircase.vertices[i * 2 + 1];
        if (!v) continue;
        layers.stair.appendChild(
          s('text', {
            class: 'mark-label',
            fill: 'var(--tray)',
            x: sc.sx(v.x) - 12,
            y: sc.sy(v.y) - 5,
            text: String(i + 1),
          }),
        );
      }
    }
  }

  // --- Pinch flag. Colour is never the only signal: a label appears too.
  clear(layers.flags);
  const pinched = state.pinch;
  handles.yOut.g.classList.toggle('handle--pinched', pinched === 'top');
  handles.xOut.g.classList.toggle('handle--pinched', pinched === 'bottom');

  if (pinched === 'top') {
    layers.flags.appendChild(
      s('line', {
        class: 'pinch-line',
        x1: sc.plot.x, y1: sc.sy(inp.yOut),
        x2: sc.plot.x + sc.plot.w, y2: sc.sy(inp.yOut),
      }),
    );
    layers.flags.appendChild(
      s('text', {
        class: 'pinch-flag',
        x: sc.plot.x + 6,
        y: sc.sy(inp.yOut) - 7,
        text: '▲ Pinched — purity limit',
      }),
    );
  } else if (pinched === 'bottom') {
    layers.flags.appendChild(
      s('line', {
        class: 'pinch-line',
        x1: sc.sx(derived.xOutPinch), y1: sc.sy(0),
        x2: sc.sx(derived.xOutPinch), y2: sc.sy(inp.yIn),
      }),
    );
    layers.flags.appendChild(
      s('text', {
        class: 'pinch-flag',
        x: sc.sx(derived.xOutPinch) - 4,
        y: sc.plot.y + 12,
        'text-anchor': 'end',
        text: '▲ Minimum L/V',
      }),
    );
  }

  // --- Handle positions.
  handles.yOut.drag.update(inp.yOut, sc.sx(inp.xIn), sc.sy(inp.yOut));
  handles.xOut.drag.update(inp.xOut, sc.sx(inp.xOut), sc.sy(inp.yIn));
}

function drawGridAndAxes(sc) {
  clear(layers.grid);
  clear(layers.axes);

  const xt = ticks(sc.domain.xMax);
  const yt = ticks(sc.domain.yMax);

  for (const t of xt) {
    layers.grid.appendChild(
      s('line', {
        class: 'grid-line',
        x1: sc.sx(t), y1: sc.plot.y,
        x2: sc.sx(t), y2: sc.plot.y + sc.plot.h,
      }),
    );
    layers.axes.appendChild(
      s('text', {
        class: 'tick-label',
        x: sc.sx(t), y: sc.plot.y + sc.plot.h + 14,
        'text-anchor': 'middle',
        text: formatTick(t, sc.domain.xMax),
      }),
    );
  }
  for (const t of yt) {
    layers.grid.appendChild(
      s('line', {
        class: 'grid-line',
        x1: sc.plot.x, y1: sc.sy(t),
        x2: sc.plot.x + sc.plot.w, y2: sc.sy(t),
      }),
    );
    layers.axes.appendChild(
      s('text', {
        class: 'tick-label',
        x: sc.plot.x - 6, y: sc.sy(t) + 3,
        'text-anchor': 'end',
        text: formatTick(t, sc.domain.yMax),
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
    s('line', {
      class: 'axis-line',
      x1: sc.plot.x, y1: sc.plot.y,
      x2: sc.plot.x, y2: sc.plot.y + sc.plot.h,
    }),
  );
  layers.axes.appendChild(
    s('text', {
      class: 'axis-label',
      x: sc.plot.x + sc.plot.w / 2, y: sc.plot.y + sc.plot.h + 34,
      'text-anchor': 'middle',
      text: 'x — solute mole fraction in liquid',
    }),
  );
  layers.axes.appendChild(
    s('text', {
      class: 'axis-label',
      transform: `rotate(-90 14 ${sc.plot.y + sc.plot.h / 2})`,
      x: 14, y: sc.plot.y + sc.plot.h / 2,
      'text-anchor': 'middle',
      text: 'y — solute mole fraction in gas',
    }),
  );
}
