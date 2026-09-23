/**
 * render-yx.js — the central y–x diagram: equilibrium line, draggable operating
 * line, McCabe-Thiele staircase, pinch flag.
 *
 * Pure function of the derived bundle (PLAN §2.2). Computes no physics: no
 * Math.log appears in this file, and none should.
 */

import { s, clear, pathFrom, stext } from './dom.js';
import { makeScale, ticks, formatTick, powerSuffix } from './scale.js';
import { makeDraggable } from './drag.js';

const BOX = { width: 430, height: 380, pad: { t: 18, r: 40, b: 48, l: 72 } };

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

  handles.yOut = buildHandle('y_out', 'Treated gas composition', ['y', 'out'], { dx: -16, dy: -10, anchor: 'end' });
  handles.xOut = buildHandle('x_out', 'Liquid rate', ['x', 'out'], { dx: -16, dy: -14, anchor: 'end' });
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

function buildHandle(id, label, [sym, sub], tagAt) {
  const g = s('g', {
    class: 'handle',
    'data-handle': id,
    'aria-label': label,
  });
  // Large transparent hit circle first, so it sits beneath the visible dot but
  // captures the pointer. r = 22 user units ≈ 44 px at desktop render scale;
  // CSS enlarges it for coarse pointers, where the SVG renders smaller.
  g.appendChild(s('circle', { class: 'handle__hit handle__hit--dot', r: 22 }));
  g.appendChild(s('circle', { class: 'handle__ring', r: 13 }));
  const dot = s('circle', { class: 'handle__dot', r: 7.5 });
  g.appendChild(dot);
  g.appendChild(s('circle', { class: 'handle__core', r: 3 }));
  // An on-canvas name, so the handle is recognised rather than described.
  const tag = s('text', {
    class: 'handle__tag label-knock', x: tagAt.dx, y: tagAt.dy,
    'text-anchor': tagAt.anchor ?? 'start', 'aria-hidden': 'true',
  });
  tag.appendChild(s('tspan', { 'font-style': 'italic', text: sym }));
  tag.appendChild(s('tspan', { 'baseline-shift': 'sub', 'font-size': '10.5px', text: sub }));
  g.appendChild(tag);
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
  const eqLabel = s('text', {
    class: 'mark-label label-knock',
    fill: 'var(--ink-2)',
    x: sc.sx(xEqEnd) - 4,
    y: sc.sy(yEqEnd) - 8,
    'text-anchor': 'end',
  });
  eqLabel.appendChild(s('tspan', { 'font-style': 'italic', text: 'y' }));
  eqLabel.appendChild(s('tspan', { text: '* = ' }));
  eqLabel.appendChild(s('tspan', { 'font-style': 'italic', text: 'mx' }));
  layers.eq.appendChild(eqLabel);

  // --- Operating line.
  clear(layers.op);
  layers.op.appendChild(
    s('line', {
      class: 'op-line',
      x1: sc.sx(inp.xIn), y1: sc.sy(inp.yOut),
      x2: sc.sx(inp.xOut), y2: sc.sy(inp.yIn),
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
      // Number the complete risers. Selective labelling, not one per vertex:
      // near the pinch the steps crowd together, so a label is skipped when it
      // would sit within 18 px of the last one drawn.
      let last = null;
      const full = derived.staircase.fullSteps;
      for (let i = 0; i < full; i++) {
        const v = derived.staircase.vertices[i * 2 + 1];
        if (!v) continue;
        const px = sc.sx(v.x) - 10;
        const py = sc.sy(v.y) - 6;
        const isLast = i === full - 1;
        if (last && Math.hypot(px - last.x, py - last.y) < 18 && !isLast) continue;
        if (last && isLast && Math.hypot(px - last.x, py - last.y) < 18) continue;
        layers.stair.appendChild(
          s('text', {
            class: 'mark-label label-knock',
            fill: 'var(--tray-ink)',
            'text-anchor': 'end',
            x: px,
            y: py,
            text: String(i + 1),
          }),
        );
        last = { x: px, y: py };
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
    pinchFlag(sc.plot.x + sc.plot.w * 0.3, sc.sy(inp.yOut) - 9, 'Pinched: purity limit', 'start');
  } else if (pinched === 'bottom') {
    layers.flags.appendChild(
      s('line', {
        class: 'pinch-line',
        x1: sc.sx(derived.xOutPinch), y1: sc.sy(0),
        x2: sc.sx(derived.xOutPinch), y2: sc.sy(inp.yIn),
      }),
    );
    pinchFlag(sc.sx(derived.xOutPinch) - 6, sc.plot.y + 14, 'Minimum L/V', 'end');
  }

  // The y_out handle carries its name just left of the axis; hide any tick
  // label it would sit on, rather than printing one over the other.
  const tagY = sc.sy(inp.yOut) - 14;
  for (const t of layers.axes.querySelectorAll('[data-y]')) {
    t.style.visibility = Math.abs(Number(t.dataset.y) - tagY) < 13 ? 'hidden' : '';
  }

  // --- Handle positions.
  handles.yOut.drag.update(inp.yOut, sc.sx(inp.xIn), sc.sy(inp.yOut));
  handles.xOut.drag.update(inp.xOut, sc.sx(inp.xOut), sc.sy(inp.yIn));
}

/** A limit flag: a drawn warning mark plus words, knocked out of the plot. */
function pinchFlag(x, y, words, anchor) {
  const text = s('text', { class: 'pinch-flag label-knock', x, y, 'text-anchor': anchor, text: words });
  const markX = anchor === 'end' ? x - words.length * 7.4 - 14 : x;
  const textX = anchor === 'end' ? x : x + 14;
  text.setAttribute('x', textX);
  layers.flags.appendChild(s('path', {
    class: 'pinch-mark',
    d: `M${markX} ${y} l5 -9 l5 9 z`,
  }));
  layers.flags.appendChild(text);
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
        x: sc.sx(t), y: sc.plot.y + sc.plot.h + 18,
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
        x: sc.plot.x - 7, y: sc.sy(t) + 4,
        'text-anchor': 'end',
        'data-y': sc.sy(t),
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
    stext({
      class: 'axis-label',
      x: sc.plot.x + sc.plot.w / 2, y: sc.plot.y + sc.plot.h + 38,
      'text-anchor': 'middle',
    }, [{ i: 'x' }, ', solute mole fraction in liquid', ...powerSuffix(sc.domain.xMax)]),
  );
  layers.axes.appendChild(
    stext({
      class: 'axis-label',
      transform: `rotate(-90 14 ${sc.plot.y + sc.plot.h / 2})`,
      x: 14, y: sc.plot.y + sc.plot.h / 2,
      'text-anchor': 'middle',
    }, [{ i: 'y' }, ', solute mole fraction in gas', ...powerSuffix(sc.domain.yMax)]),
  );
}
