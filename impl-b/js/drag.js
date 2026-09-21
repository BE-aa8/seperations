import { screenToSvg } from "./scale.js";

/**
 * Generic direct-manipulation SVG handle.
 *
 * The scale is captured on pointerdown and held for the full gesture. This is
 * what prevents autoscaling from making the handle slip away from the pointer.
 */
export function makeDraggable({
  element,
  svg,
  axis,
  getScale,
  getData,
  onMove,
  onStart = () => {},
  onEnd = () => {},
  nudgeStep = 0.001,
  shiftFactor = 10
}) {
  let active = false;
  let pendingEvent = null;
  let rafId = 0;
  let gestureScale = null;

  const flush = () => {
    rafId = 0;

    if (!pendingEvent || !gestureScale) {
      return;
    }

    const event = pendingEvent;
    pendingEvent = null;

    const point = screenToSvg(svg, event.clientX, event.clientY);
    const value =
      axis === "y"
        ? gestureScale.svgToY(point.y)
        : gestureScale.svgToX(point.x);

    onMove(value, event);
  };

  element.addEventListener("pointerdown", (event) => {
    active = true;
    gestureScale = getScale();
    element.setPointerCapture(event.pointerId);
    onStart(event);
    event.preventDefault();
  });

  element.addEventListener("pointermove", (event) => {
    if (!active || !element.hasPointerCapture(event.pointerId)) {
      return;
    }

    pendingEvent = event;

    if (!rafId) {
      rafId = requestAnimationFrame(flush);
    }
  });

  for (const type of ["pointerup", "pointercancel"]) {
    element.addEventListener(type, (event) => {
      if (!active) {
        return;
      }

      active = false;

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      pendingEvent = null;

      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = 0;
      gestureScale = null;
      onEnd(event);
    });
  }

  element.addEventListener("keydown", (event) => {
    const positive =
      axis === "y"
        ? event.key === "ArrowUp"
        : event.key === "ArrowRight";

    const negative =
      axis === "y"
        ? event.key === "ArrowDown"
        : event.key === "ArrowLeft";

    if (!positive && !negative) {
      return;
    }

    event.preventDefault();

    const amount =
      (positive ? 1 : -1) *
      (event.shiftKey ? shiftFactor : 1) *
      nudgeStep;

    onMove(getData() + amount, { keyboard: true });
  });
}
