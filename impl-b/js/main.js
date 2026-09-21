import {
  getState,
  setField,
  subscribe
} from "./state.js";
import {
  getScale as getYXScale,
  mount as mountYX,
  update as updateYX
} from "./render-yx.js";
import {
  getScale as getColumnScale,
  mount as mountColumns,
  update as updateColumns
} from "./render-columns.js";
import {
  mount as mountNTU,
  update as updateNTU
} from "./render-ntu.js";
import {
  mount as mountProfile,
  update as updateProfile
} from "./render-profile.js";
import {
  mount as mountSummary,
  update as updateSummary
} from "./render-summary.js";
import {
  mount as mountControls,
  update as updateControls
} from "./controls.js";
import { makeDraggable } from "./drag.js";

const $ = (id) => document.getElementById(id);

const yx = mountYX($("yxDiagram"));
const columns = mountColumns($("columns"));

mountNTU($("ntu"));
mountProfile($("profile"));
mountSummary($("summary"));
mountControls($("controls"));

// These are the three direct-manipulation handles required by the plan.
makeDraggable({
  element: yx.top,
  svg: yx.svg,
  axis: "y",
  getScale: getYXScale,
  getData: () => getState().yOut,
  nudgeStep: 0.001,
  onMove: (value) => setField("yOut", value)
});

makeDraggable({
  element: yx.bottom,
  svg: yx.svg,
  axis: "x",
  getScale: getYXScale,
  getData: () => getState().xOut,
  nudgeStep: 0.001,
  onMove: (value) => setField("xOut", value)
});

makeDraggable({
  element: columns.probe,
  svg: columns.svg,
  axis: "y",
  getScale: getColumnScale,
  getData: () => getState().probeZ,
  nudgeStep: 0.05,
  onMove: (value) => setField("probeZ", value)
});

subscribe((state, derived) => {
  updateYX(derived);
  updateColumns(derived);
  updateNTU(derived);
  updateProfile(derived);
  updateSummary(derived);
  updateControls(state, derived);

  const pinchBadge = $("pinchBadge");
  pinchBadge.textContent = derived.pinch
    ? `Pinched: ${derived.pinch}`
    : "Feasible";
  pinchBadge.className =
    "status " + (derived.pinch ? "warning" : "ok");

  const probe = derived.probe;

  const trayReadout =
    probe.trayY === null
      ? "— (above tray column)"
      : `y = ${probe.trayY.toExponential(3)}`;

  const packedReadout =
    probe.packedY === null
      ? "— (above packed bed)"
      : `y = ${probe.packedY.toExponential(3)}`;

  const probeMessage =
    probe.trayY === null && probe.packedY === null
      ? "Above both columns"
      : probe.trayY === null
        ? "Above tray column"
        : probe.packedY === null
          ? "Above packed bed"
          : "Both columns present at this elevation";

  $("probeReadout").innerHTML = `
    <strong>Height probe:</strong>
    z = ${probe.z.toFixed(3)} m ·
    tray readout = ${trayReadout} ·
    packed readout = ${packedReadout} ·
    tray index from top = ${probe.trayIndex} ·
    <span class="muted">${probeMessage}</span>
  `;

  $("so2Warning").hidden = state.presetId !== "so2";

  yx.top.setAttribute(
    "aria-valuetext",
    `y_out = ${state.yOut.toExponential(3)} mole fraction`
  );

  yx.bottom.setAttribute(
    "aria-valuetext",
    `x_out = ${state.xOut.toExponential(3)} mole fraction; L/V = ${derived.LoV.toFixed(3)}`
  );
});
