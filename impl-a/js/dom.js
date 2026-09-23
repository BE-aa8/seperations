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
