/**
 * main.js — wiring only.
 *
 * If a formula or a decision about absorption appears in this file, the
 * architecture has leaked (PLAN §2.2). Everything here is: import, mount,
 * subscribe, forward.
 */

import * as physics from './physics.js';
import * as state from './state.js';
import * as yx from './render-yx.js';
import * as columns from './render-columns.js';
import * as ntu from './render-ntu.js';
import * as profile from './render-profile.js';
import * as summary from './render-summary.js';
import * as controls from './controls.js';

function boot() {
  const el = (id) => document.getElementById(id);

  controls.mount(el('controls'), {
    onSystem: state.setSystem,
    onPacking: state.setPacking,
    onDemo: state.setDemoPreset,
    onParam: state.setParam,
    onResetTray: state.resetTrayDefaults,
  });

  yx.mount(el('yx-diagram'), {
    onDragYOut: state.setYOut,
    onDragXOut: state.setXOut,
    onDragStart: state.freezeAxes,
    onDragEnd: state.unfreezeAxes,
    getYOutRange: state.yOutRange,
    getXOutRange: state.xOutRange,
  });

  columns.mount(el('columns'), {
    onDragProbe: state.setProbeZ,
    onDragStart: state.freezeAxes,
    onDragEnd: state.unfreezeAxes,
    getProbeRange: state.probeRange,
  });

  ntu.mount(el('ntu-plot'));
  profile.mount(el('profile-plot'));
  profile.mountReadout(el('probe-readout'));
  summary.mount(el('summary'));

  state.subscribe((derived, st) => {
    const inp = st.inp;
    // Thin adapters so the renderers never call physics themselves.
    const invDriving = (y) => physics.ntuIntegrand(inp, y);
    const trayY = (j) => physics.gasProfileTray(inp, j);
    const packedY = (zFromTop) => physics.gasProfilePacked(inp, zFromTop);
    const eqY = (x) => physics.yStar(inp, x);

    yx.update(derived, st, eqY);
    columns.update(derived, st);
    ntu.update(derived, st, invDriving);
    profile.update(derived, st, trayY, packedY);
    profile.updateReadout(derived, st, trayY, packedY);
    summary.update(derived, st);
    controls.update(derived, st);
  });

  state.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
