/**
 * dom.js — minimal SVG/HTML element helpers.
 *
 * Not in the original PLAN §2.1 file list; added so the five render-* modules
 * do not each repeat createElementNS boilerplate. It contains no physics and no
 * state — it is pure DOM construction.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element with attributes and optional children. */
export function s(tag, attrs = {}, children = []) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === 'text') el.textContent = String(v);
    else if (k === 'class') el.setAttribute('class', v);
    else el.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) if (c) el.appendChild(c);
  return el;
}

/** Create an HTML element. */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === 'text') el.textContent = String(v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else el.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

/** Remove all children. */
export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Build an SVG path `d` from a list of {x, y} in screen space. */
export function pathFrom(points) {
  if (!points.length) return '';
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

/** Format a number for display. Display only — never used for comparisons. */
export function fmt(v, dp = 3) {
  if (!Number.isFinite(v)) return '—';
  if (v !== 0 && Math.abs(v) < 1e-3) return v.toExponential(2);
  return v.toFixed(dp);
}

// ---------------------------------------------------------------------------
// Icons and series glyphs. Drawn, one stroke weight, no font dependency —
// the Unicode stand-ins they replace (ℹ ⚠ ▲ ↕) rendered from whatever
// fallback font the platform had.
// ---------------------------------------------------------------------------

const ICONS = {
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.6v.1',
  caution: 'M12 3.5 21.5 20h-19zM12 10v4.5M12 17.2v.1',
  limit: 'M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3zM12 7.5v5.5M12 16.3v.1',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevron: 'M9.5 6l6 6-6 6',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4 4.5v4h4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

/** An inline stroke icon. Decorative unless a label is given. */
export function icon(name, label) {
  const svg = s('svg', {
    class: `icon icon--${name}`,
    viewBox: '0 0 24 24',
    'aria-hidden': label ? null : 'true',
    role: label ? 'img' : null,
    'aria-label': label ?? null,
  });
  svg.appendChild(s('path', { d: ICONS[name] }));
  return svg;
}

/**
 * A tiny column drawing that stands for one series in legends and readouts:
 * trays for the tray column, a filled bed for the packed column. It carries
 * the series by SHAPE as well as hue, so it survives greyscale projection.
 */
export function glyph(series) {
  const svg = s('svg', { class: `glyph glyph--${series}`, viewBox: '0 0 12 18', 'aria-hidden': 'true' });
  svg.appendChild(s('rect', { class: 'glyph__shell', x: 1, y: 1, width: 10, height: 16, rx: 2 }));
  if (series === 'tray') {
    for (const y of [5.5, 9, 12.5]) {
      svg.appendChild(s('line', { x1: 3, y1: y, x2: 9, y2: y, stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
    }
  } else {
    svg.appendChild(s('rect', { x: 3, y: 4.5, width: 6, height: 9, fill: 'currentColor', opacity: 0.8 }));
  }
  return svg;
}

/** A value with its unit set smaller, as a readout. */
export function withUnit(value, unit) {
  return h('span', {}, [value, unit ? h('span', { class: 'unit', text: unit }) : null]);
}

/**
 * Typeset plain-text notation from the preset data: `N_OG`, `E_o`, `y_in`
 * become a letter with a true subscript. Returns an array of nodes.
 */
export function notation(text) {
  const out = [];
  const re = /\b([A-Za-z])_([A-Za-z0-9]+)\b/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(document.createTextNode(text.slice(last, m.index)));
    out.push(h('i', { text: m[1] }), h('sub', { text: m[2] }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}

/**
 * SVG text with notation. `parts` mixes plain strings with {i:'y'} for an
 * italic variable and {sub:'OG'} for a subscript, e.g.
 *   stext({...}, ['area = ', {i:'N'}, {sub:'OG'}, ' = 3.409'])
 */
export function stext(attrs, parts) {
  const t = s('text', attrs);
  for (const p of parts) {
    if (typeof p === 'string') t.appendChild(s('tspan', { text: p }));
    else if (p.i) t.appendChild(s('tspan', { 'font-style': 'italic', text: p.i }));
    else if (p.sub) t.appendChild(s('tspan', { 'baseline-shift': 'sub', 'font-size': '0.75em', text: p.sub }));
    else if (p.sup) t.appendChild(s('tspan', { 'baseline-shift': 'super', 'font-size': '0.72em', text: p.sup }));
  }
  return t;
}
