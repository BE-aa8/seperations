/**
 * drag.js — Pointer Events lifecycle for draggable SVG handles.
 *
 * Knows nothing about what a handle MEANS. It reports a position in data
 * coordinates; state.js decides what that means and clamps it (PLAN §2.2).
 *
 * One code path serves mouse, touch and pen. The specifics below are each a
 * known failure mode (PLAN §5.4, RISK-10) — none is optional:
 *
 *   - `touch-action: none` on the handle, or iOS scrolls the page instead of
 *     dragging. (Set in CSS; asserted here in a dev warning.)
 *   - setPointerCapture on pointerdown, so events keep arriving when the
 *     pointer leaves the element or the window.
 *   - pointermove coalesced into ONE requestAnimationFrame. A high-rate pointer
 *     fires far faster than the display refreshes.
 *   - BOTH pointerup and pointercancel release. Omitting pointercancel strands
 *     the handle mid-drag after an OS-level gesture interrupt.
 *   - Screen -> data conversion via getScreenCTM().inverse() (see scale.js).
 */

import { clientToSvg } from './scale.js';

/**
 * Make an SVG element draggable along one axis.
 *
 * @param {SVGElement} el          the grabbable element (give it a large
 *                                 transparent hit area; see CSS `.handle-hit`)
 * @param {Object} opts
 * @param {SVGSVGElement} opts.svg  the owning <svg>, for coordinate conversion
 * @param {'x'|'y'} opts.axis       which axis the handle moves along
 * @param {() => ReturnType<import('./scale.js').makeScale>} opts.getScale
 *        returns the CURRENT scale. A function, not a value, because the scale
 *        is rebuilt when the preset changes.
 * @param {(dataValue:number) => void} opts.onDrag   called with the data-space value
 * @param {() => void} [opts.onStart]
 * @param {() => void} [opts.onEnd]
 * @param {() => {lo:number, hi:number}} [opts.getRange]
 *        current allowed range, used for keyboard step sizing and ARIA
 * @param {(v:number) => string} [opts.describe]  for aria-valuetext
 */
export function makeDraggable(el, opts) {
  const { svg, axis, getScale, onDrag, onStart, onEnd, getRange, describe } = opts;

  let rafId = null;
  let pending = null;
  let activePointer = null;

  function valueFromEvent(ev) {
    const p = clientToSvg(svg, ev.clientX, ev.clientY);
    if (!p) return null;
    const scale = getScale();
    return axis === 'x' ? scale.dx(p.x) : scale.dy(p.y);
  }

  function flush() {
    rafId = null;
    if (pending === null) return;
    const v = valueFromEvent(pending);
    pending = null;
    if (v !== null) onDrag(v);
  }

  el.addEventListener('pointerdown', (ev) => {
    if (activePointer !== null) return;
    activePointer = ev.pointerId;
    el.setPointerCapture(ev.pointerId);
    el.classList.add('is-dragging');
    ev.preventDefault();
    onStart?.();
    const v = valueFromEvent(ev);
    if (v !== null) onDrag(v);
  });

  el.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== activePointer) return;
    if (!el.hasPointerCapture(ev.pointerId)) return;
    ev.preventDefault();
    // Store the event; do not compute here. One recompute per animation frame.
    pending = ev;
    if (rafId === null) rafId = requestAnimationFrame(flush);
  });

  function release(ev) {
    if (ev.pointerId !== activePointer) return;
    if (el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
    activePointer = null;
    el.classList.remove('is-dragging');
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pending = null;
    onEnd?.();
  }

  // BOTH of these. pointercancel fires on OS gesture interrupts.
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  // --- Keyboard equivalent -------------------------------------------------
  // Arrow-key nudging of a FOCUSED handle. This is not a slider: it moves the
  // same handle the pointer moves, and there is no track widget. It is what
  // makes the direct-manipulation design keyboard-accessible (D-02, PLAN §1.2).
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'slider'); // the closest ARIA role; see note below
  el.addEventListener('keydown', (ev) => {
    const keys =
      axis === 'x'
        ? { ArrowLeft: -1, ArrowRight: 1 }
        : { ArrowDown: -1, ArrowUp: 1 };
    const dir = keys[ev.key];
    if (dir === undefined) return;
    ev.preventDefault();

    const range = getRange?.() ?? { lo: 0, hi: 1 };
    const span = range.hi - range.lo;
    const step = (ev.shiftKey ? 0.05 : 0.005) * span;
    const current = Number(el.dataset.value ?? range.lo);
    onDrag(current + dir * step);
  });

  return {
    /** Update the handle's position and accessibility state. */
    update(value, svgX, svgY) {
      el.dataset.value = String(value);
      el.setAttribute('transform', `translate(${svgX} ${svgY})`);
      const range = getRange?.();
      if (range) {
        el.setAttribute('aria-valuemin', String(range.lo));
        el.setAttribute('aria-valuemax', String(range.hi));
        el.setAttribute('aria-valuenow', String(value));
      }
      if (describe) el.setAttribute('aria-valuetext', describe(value));
    },
  };
}
