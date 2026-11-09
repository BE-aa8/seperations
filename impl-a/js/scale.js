/**
 * scale.js — bidirectional mapping between data coordinates (mole fractions)
 * and SVG user units, plus the screen -> SVG conversion.
 *
 * Knows nothing about absorption. It is a generic 2-D scale (PLAN §2.2).
 */

/**
 * Build a linear scale for a plot area inside an SVG viewBox.
 *
 * @param {{width:number, height:number, pad:{t:number,r:number,b:number,l:number}}} box
 * @param {{xMax:number, yMax:number}} domain
 */
export function makeScale(box, domain) {
  const { width, height, pad } = box;
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  return {
    domain,
    box,
    plot: { x: pad.l, y: pad.t, w: plotW, h: plotH },

    /** data x -> svg x */
    sx(x) {
      return pad.l + (x / domain.xMax) * plotW;
    },
    /** data y -> svg y (inverted: y grows upward on screen) */
    sy(y) {
      return pad.t + plotH - (y / domain.yMax) * plotH;
    },
    /** svg x -> data x */
    dx(px) {
      return ((px - pad.l) / plotW) * domain.xMax;
    },
    /** svg y -> data y */
    dy(py) {
      return ((pad.t + plotH - py) / plotH) * domain.yMax;
    },
  };
}

/**
 * Convert a pointer event's client coordinates into the SVG's user coordinate
 * system.
 *
 * Uses getScreenCTM().inverse() on a DOMPoint. Do NOT substitute
 * getBoundingClientRect() arithmetic: that happens to work when the SVG renders
 * 1:1 and breaks silently under a responsive viewBox, a CSS transform, page
 * zoom, or a device pixel ratio other than 1 — which is to say, on a phone.
 * (PLAN §5.4, RISK-10.)
 *
 * @returns {{x:number, y:number}|null} null if the CTM is unavailable
 */
export function clientToSvg(svg, clientX, clientY) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = new DOMPoint(clientX, clientY);
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** Clamp helper. */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Choose readable tick values for [0, max].
 * Handles the SO₂ preset, where xMax ≈ 1.4e-4 and naive fixed formatting would
 * render a column of "0.000" (PLAN §4.4).
 */
export function ticks(max, count = 5) {
  if (!(max > 0) || !Number.isFinite(max)) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  // Round the step UP to the next nice value. Rounding down overshoots the
  // requested tick count and collides the labels — e.g. norm = 4.6 taken as 2
  // yields 12 ticks where 5 were asked for.
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const step = nice * mag;
  const out = [];
  for (let v = 0; v <= max * 1.0000001; v += step) {
    // Snap to the step grid so floating-point accumulation does not produce
    // labels like 0.30000000000000004.
    out.push(Math.round(v / step) * step);
  }
  return out;
}

/** Format a mole fraction for an axis tick, switching to exponential when small. */
export function formatTick(v, max) {
  if (v === 0) return '0';
  if (max < 1e-3) return v.toExponential(1);
  if (max < 1e-2) return v.toFixed(4);
  return v.toFixed(3);
}
