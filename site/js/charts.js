// charts.js: Plotly renderers (plan §9: P1–P8, P11). Each takes the simulate() output and redraws with Plotly.react.
import { DATA } from './data.js';
import { solubility, sweepBPE, sweepPurge, sweepN, sweepMolality, primaryEnergy, coolingYield, linspace } from './model.js';

const C = { mvr: '#1f5fae', e1: '#b45309', e3: '#0f766e', e5: '#7c3aed', grey: '#a3a9b5', warn: '#c2410c', ok: '#1f7a4d', text: '#1d2330', grid: '#e6e9ef' };
const CONFIG = { responsive: true, displayModeBar: false };
const font = { family: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', size: 12, color: C.text };
const base = (extra = {}) => ({
  font, margin: { l: 56, r: 16, t: 10, b: 46 }, paper_bgcolor: '#fff', plot_bgcolor: '#fff',
  showlegend: true, legend: { orientation: 'h', y: -0.22, x: 0, font: { size: 11 } },
  hovermode: 'closest', ...extra,
});
const ax = (title, extra = {}) => ({ title: { text: title, standoff: 6 }, gridcolor: C.grid, zeroline: false, automargin: true, ...extra });
const draw = (id, data, layout) => {
  const el = document.getElementById(id);
  if (el && window.Plotly) window.Plotly.react(el, data, layout, CONFIG);
};
const nn = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// P1: solubility with operating point and cooling yield
export function p1(out, Tcold) {
  const T = out.inputs.T_C;
  const pts = DATA.solubility.points;
  const yc = coolingYield(T, Tcold);
  draw('p1', [
    { x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), mode: 'lines+markers', name: 'Solubility (Monnin & Dubois 2005), linear interp.', line: { color: C.mvr }, marker: { size: 5 } },
    { x: [T], y: [out.s], mode: 'markers', name: `Operating point ${T.toFixed(0)} °C`, marker: { size: 12, color: C.warn, symbol: 'diamond' } },
    { x: [T, Tcold], y: [out.s, solubility(Tcold)], mode: 'lines+markers', name: `Cool to ${Tcold} °C: recovers ${(yc * 100).toFixed(1)} % of dissolved LiOH`, line: { color: C.e3, dash: 'dot' }, marker: { size: 8 } },
  ], base({ xaxis: ax('Temperature T (°C)', { range: [0, 100] }), yaxis: ax('Solubility s (g LiOH / 100 g H₂O)') }));
  return yc;
}

// P1b: schematic metastable zone / spinodal (no numeric concentration axis: no LiOH data)
export function p1b(out) {
  const Ts = linspace(0, 100, 41);
  const bin = Ts.map(solubility);
  const msz = bin.map((s) => s + 1.2);      // SCHEMATIC offsets, not data
  const spin = bin.map((s) => s + 2.6);
  const top = bin.map((s) => s + 3.4);
  const T = out.inputs.T_C;
  const band = (y0, y1, name, color) => [
    { x: Ts, y: y0, mode: 'lines', line: { width: 0 }, showlegend: false, hoverinfo: 'skip' },
    { x: Ts, y: y1, mode: 'lines', fill: 'tonexty', fillcolor: color, line: { width: 0 }, name, hoverinfo: 'skip' },
  ];
  draw('p1b', [
    ...band(bin, msz, 'Metastable zone: seeds grow', 'rgba(15,118,110,0.18)'),
    ...band(msz, spin, 'Labile: nucleation shower → fines', 'rgba(194,65,12,0.16)'),
    ...band(spin, top, 'Beyond spinodal: unstable', 'rgba(124,58,237,0.16)'),
    { x: Ts, y: bin, mode: 'lines', name: 'Binodal c* (solubility)', line: { color: C.mvr, width: 2.5 }, hoverinfo: 'skip' },
    { x: Ts, y: msz, mode: 'lines', name: 'Metastable limit (schematic)', line: { color: C.e3, dash: 'dash' }, hoverinfo: 'skip' },
    { x: Ts, y: spin, mode: 'lines', name: 'Spinodal (schematic)', line: { color: C.e5, dash: 'dot' }, hoverinfo: 'skip' },
    { x: [T], y: [solubility(T) + 0.5], mode: 'markers+text', text: ['seeded operation'], textposition: 'top center', name: 'Operating point (just supersaturated)', marker: { size: 11, color: C.warn, symbol: 'diamond' }, hoverinfo: 'skip' },
  ], base({
    xaxis: ax('Temperature T (°C)', { range: [0, 100] }),
    yaxis: ax('Concentration (schematic, no scale)', { showticklabels: false }),
    annotations: [{ text: 'SCHEMATIC: band widths are not LiOH data', xref: 'paper', yref: 'paper', x: 0.01, y: 0.99, showarrow: false, font: { size: 11, color: C.warn }, xanchor: 'left' }],
  }));
}

// P2: BPE vs molality (ideal ± activity band, osmotic point at saturation)
export function p2(out) {
  const inp = out.inputs;
  const { ms, curves } = sweepMolality(inp, [0.75, 1.0, 1.2]);
  const [lo, ideal, hi] = curves;
  const tr = [
    { x: ms, y: lo.BPE, mode: 'lines', line: { width: 0 }, showlegend: false, hoverinfo: 'skip' },
    { x: ms, y: hi.BPE, mode: 'lines', fill: 'tonexty', fillcolor: 'rgba(31,95,174,0.12)', line: { width: 0 }, name: 'Activity factor a = 0.75–1.20 band' },
    { x: ms, y: ideal.BPE, mode: 'lines', name: 'Ideal (a = 1, i = 2)', line: { color: C.mvr, dash: 'dash' } },
    { x: [out.m], y: [out.BPE], mode: 'markers', name: `Current: m = ${out.m.toFixed(2)} mol/kg, BPE = ${out.BPE.toFixed(2)} K (a = ${(inp.useOsmotic ? out.phi : inp.activityFactor).toFixed(3)})`, marker: { size: 12, color: C.warn, symbol: 'diamond' } },
  ];
  if (!inp.useOsmotic) {
    tr.push({ x: [out.m], y: [out.phi * inp.i * out.Kb * out.m], mode: 'markers', name: `Real (φ_sat = ${out.phi.toFixed(3)}, Monnin & Dubois)`, marker: { size: 10, color: C.ok } });
  } else {
    tr.push({ x: [out.m], y: [inp.i * out.Kb * out.m], mode: 'markers', name: 'Ideal at saturation', marker: { size: 9, color: C.grey } });
  }
  draw('p2', tr, base({ xaxis: ax('Molality m (mol LiOH / kg H₂O)'), yaxis: ax(`BPE (K) at T_b = ${inp.T_C.toFixed(0)} °C`) }));
}

// P3: lift breakdown
export function p3(out) {
  const mv = out.mvr; if (!mv) return;
  const dT = out.inputs.dT_heater;
  const pct = (100 * out.BPE / mv.lift).toFixed(0);
  draw('p3', [
    { y: ['Lift'], x: [out.BPE], type: 'bar', orientation: 'h', name: `BPE = ${out.BPE.toFixed(2)} K (${pct} %)`, marker: { color: C.warn }, text: [`BPE ${out.BPE.toFixed(2)} K`], textposition: 'inside' },
    { y: ['Lift'], x: [dT], type: 'bar', orientation: 'h', name: `ΔT_heater = ${dT.toFixed(1)} K`, marker: { color: C.mvr }, text: [`ΔT_heater ${dT.toFixed(1)} K`], textposition: 'inside' },
  ], base({ barmode: 'stack', xaxis: ax(`Temperature lift T_c − T_v (K); total ${mv.lift.toFixed(2)} K`), yaxis: { showticklabels: false }, margin: { l: 16, r: 16, t: 10, b: 46 }, legend: { orientation: 'h', y: -0.5, x: 0, font: { size: 11 } } }));
}

// P4: kWh/t, r, T2 vs BPE (three stacked panels)
export function p4(out) {
  if (!out.mvr) return;
  const sw = sweepBPE(out.inputs);
  const x = sw.map((d) => d.BPE);
  const cur = { x: [out.BPE], mode: 'markers', showlegend: false, marker: { size: 10, color: C.warn, symbol: 'diamond' } };
  const [lo, hi] = DATA.compressor.specificEnergyRange.value;
  draw('p4', [
    { x, y: sw.map((d) => d.kWh_per_t), name: 'kWh per t water', line: { color: C.mvr }, yaxis: 'y' },
    { ...cur, y: [out.mvr.kWh_per_t], yaxis: 'y' },
    { x, y: sw.map((d) => d.r), name: 'Pressure ratio r', line: { color: C.e3 }, yaxis: 'y2', xaxis: 'x' },
    { ...cur, y: [out.mvr.r], yaxis: 'y2' },
    { x, y: sw.map((d) => d.T2_C), name: 'Discharge T₂ (°C)', line: { color: C.e5 }, yaxis: 'y3' },
    { ...cur, y: [out.mvr.T2_C], yaxis: 'y3' },
  ], base({
    grid: { rows: 3, columns: 1, pattern: 'coupled' },
    xaxis: ax('BPE (K), at the current T_b, ΔT_heater, η'),
    yaxis: ax('kWh/t', { domain: [0.70, 1] }), yaxis2: ax('r', { domain: [0.36, 0.64] }), yaxis3: ax('T₂ °C', { domain: [0, 0.30] }),
    shapes: [
      { type: 'rect', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: lo, y1: hi, fillcolor: 'rgba(31,122,77,0.08)', line: { width: 0 } },
      { type: 'line', xref: 'paper', yref: 'y2', x0: 0, x1: 1, y0: DATA.compressor.rMaxSingleStage.value, y1: DATA.compressor.rMaxSingleStage.value, line: { color: C.warn, dash: 'dot', width: 1 } },
    ],
    annotations: [
      { text: `vendor range ${lo}–${hi} kWh/t (ESTIMATE)`, xref: 'paper', yref: 'y', x: 0.99, y: hi, xanchor: 'right', yanchor: 'top', showarrow: false, font: { size: 10, color: C.ok } },
      { text: 'one-stage limit ≈ 2 (ESTIMATE)', xref: 'paper', yref: 'y2', x: 0.01, y: DATA.compressor.rMaxSingleStage.value, xanchor: 'left', yanchor: 'bottom', showarrow: false, font: { size: 10, color: C.warn } },
    ],
    showlegend: false, margin: { l: 56, r: 12, t: 8, b: 46 },
  }));
}

// P5: primary energy and $/t for 1/3/5 effects and MVR
export function p5(out) {
  if (!out.mvr || !out.effects[1]) return;
  const note = document.getElementById('p5-note');
  const kWh = out.mvr.kWh_per_t;
  const pe = primaryEnergy({ kWh_per_t: kWh, economy: 1 });
  const labels = ['1 effect', '3 effects', '5 effects', 'MVR'];
  const effs = [1, 3, 5].map((N) => out.effects[N]);
  const fuel = [...effs.map((e) => pe.steamFuel_kWh_per_t / e.economy), pe.mvr];
  const cost = [...[1, 3, 5].map((N) => out.econ[N].cost_ME_per_t), out.econ[1].cost_MVR_per_t];
  const colors = [C.e1, C.e3, C.e5, C.mvr].map((c, k) => (k < 3 && !effs[k].feasible ? C.grey : c));
  const txt = (v, d) => v.map((x) => x.toFixed(d));
  if (note) note.textContent = `Fuel basis: steam = ${pe.steamFuel_kWh_per_t.toFixed(0)} kWh fuel per t steam (h_g(120 °C) − h_f(100 °C), boiler η = 0.85 ESTIMATE); electricity = ${pe.heatRate.toFixed(2)} kWh fuel per kWh (EIA gas-plant heat rate). Grey bar = infeasible number of effects.`;
  draw('p5', [
    { x: labels, y: fuel, type: 'bar', marker: { color: colors }, text: txt(fuel, 0), textposition: 'outside', cliponaxis: false, name: 'Fuel energy', xaxis: 'x', yaxis: 'y', hovertemplate: '%{x}: %{y:.0f} kWh fuel/t<extra></extra>' },
    { x: labels, y: cost, type: 'bar', marker: { color: colors }, text: txt(cost, 2), textposition: 'outside', cliponaxis: false, name: 'Operating cost', xaxis: 'x2', yaxis: 'y2', hovertemplate: '%{x}: $%{y:.2f}/t<extra></extra>' },
  ], base({
    grid: { rows: 1, columns: 2 },
    xaxis: { domain: [0, 0.46], tickfont: { size: 10 } }, xaxis2: { domain: [0.56, 1], tickfont: { size: 10 } },
    yaxis: ax('kWh fuel per t water'), yaxis2: ax('$ per t water', { anchor: 'x2' }),
    showlegend: false, margin: { l: 56, r: 10, t: 26, b: 56 },
  }));
}

// P6: crossover map in (c_e, c_s) space
export function p6(out) {
  if (!out.mvr || !out.effects[1]) return;
  const inp = out.inputs, kWh = out.mvr.kWh_per_t;
  const ce = linspace(0.03, 0.25, 45);
  const yMax = 40;
  const line = (N, color) => ({ x: ce, y: ce.map((c) => c * out.effects[N].economy * kWh), mode: 'lines', name: `${N}-effect = MVR cost`, line: { color, width: N === inp.N ? 3 : 1.5 } });
  const Nshade = out.effects[inp.N] ? inp.N : 3;
  const yLine = ce.map((c) => Math.min(c * out.effects[Nshade].economy * kWh, yMax));
  draw('p6', [
    { x: ce, y: ce.map(() => 0), mode: 'lines', line: { width: 0 }, showlegend: false, hoverinfo: 'skip' },
    { x: ce, y: yLine, mode: 'lines', fill: 'tonexty', fillcolor: 'rgba(15,118,110,0.10)', line: { width: 0 }, name: `${Nshade}-effect cheaper`, hoverinfo: 'skip' },
    { x: ce, y: ce.map(() => yMax), mode: 'lines', fill: 'tonexty', fillcolor: 'rgba(31,95,174,0.10)', line: { width: 0 }, name: 'MVR cheaper', hoverinfo: 'skip' },
    line(1, C.e1), line(3, C.e3), line(5, C.e5),
    ...(inp.N !== 1 && inp.N !== 3 && inp.N !== 5 ? [line(inp.N, C.text)] : []),
    { x: [DATA.prices.electricity.value], y: [DATA.prices.steam.value], mode: 'markers+text', text: ['Texas (EIA Aug 2026)'], textposition: 'top right', name: 'Texas prices (steam = fuel-only ESTIMATE)', marker: { size: 10, color: C.ok, symbol: 'square' } },
    { x: [inp.ce], y: [inp.cs], mode: 'markers', name: `Current: $${inp.ce.toFixed(3)}/kWh, $${inp.cs.toFixed(2)}/t`, marker: { size: 12, color: C.warn, symbol: 'diamond' } },
  ], base({ xaxis: ax('Electricity price c_e ($/kWh)', { range: [0.03, 0.25] }), yaxis: ax('Steam price c_s ($/t steam)', { range: [0, yMax] }) }));
}

// P7: purge trade-off
export function p7(out) {
  const inp = out.inputs;
  const eps = [...new Set([0.01, inp.epsilon, 0.10])].sort((a, b) => a - b);
  const sw = sweepPurge(inp, eps);
  const x = sw.map((d) => d.p);
  const tr = [{ x, y: sw.map((d) => (d.liYield == null ? null : 100 * d.liYield)), name: 'Li yield (%)', line: { color: C.mvr }, yaxis: 'y', connectgaps: false }];
  const dash = ['dot', 'solid', 'dash'];
  eps.forEach((e, k) => tr.push({ x, y: sw.map((d) => d.impurity[k]), name: `Impurity, ε = ${e.toFixed(3)}${e === inp.epsilon ? ' (current)' : ''}`, line: { color: C.warn, dash: e === inp.epsilon ? 'solid' : dash[k], width: e === inp.epsilon ? 2.5 : 1.3 }, yaxis: 'y2', connectgaps: false }));
  const ok = out.mass.feasible;
  tr.push({ x: [inp.purgeRatio], y: [ok ? 100 * out.mass.liYield : null], mode: 'markers', marker: { size: 11, color: ok ? C.warn : C.grey, symbol: 'diamond' }, name: 'Current p', yaxis: 'y' });
  tr.push({ x: [inp.purgeRatio], y: [ok ? out.mass.productImpurity_ppm : null], mode: 'markers', marker: { size: 11, color: ok ? C.warn : C.grey, symbol: 'diamond' }, showlegend: false, yaxis: 'y2' });
  const shapes = [];
  const spec = DATA.spec.naMax_ppm.value;
  if (spec != null) shapes.push({ type: 'line', xref: 'paper', yref: 'y2', x0: 0, x1: 1, y0: spec, y1: spec, line: { color: C.e5, dash: 'dash' } });
  draw('p7', tr, base({
    grid: { rows: 2, columns: 1, pattern: 'coupled' },
    xaxis: ax('Purge ratio p = P/F'),
    yaxis: ax('Li yield (%)', { domain: [0.56, 1] }), yaxis2: ax('Impurity (ppm, log)', { domain: [0, 0.44], type: 'log' }),
    shapes, legend: { orientation: 'h', y: -0.25, font: { size: 10 } },
    annotations: spec == null ? [{ text: 'Battery-grade Na spec line hidden: SOURCE NEEDED', xref: 'paper', yref: 'paper', x: 0.99, y: 0.44, xanchor: 'right', yanchor: 'top', showarrow: false, font: { size: 10, color: '#5b6475' } }] : [],
  }));
}

// P8: Sankey of the mass balance
export function p8(out) {
  const mb = out.mass, F = out.inputs.F;
  if (!mb.feasible) {
    draw('p8', [], base({ xaxis: { visible: false }, yaxis: { visible: false }, annotations: [{ text: 'Infeasible mass balance: no flows to show', xref: 'paper', yref: 'paper', x: 0.5, y: 0.5, showarrow: false, font: { size: 14, color: C.warn } }] }));
    return;
  }
  const f = (v) => `${Math.round(v).toLocaleString('en-US')} kg/h`;
  draw('p8', [{
    type: 'sankey', arrangement: 'fixed', valueformat: ',.0f', valuesuffix: ' kg/h',
    node: { label: [`Feed ${f(F)}`, `Vapor ${f(mb.V)}`, `Crystals ${f(mb.C)}`, `Purge ${f(mb.P)}`], color: [C.text, C.mvr, C.ok, C.warn], pad: 18, thickness: 16, x: [0.01, 0.99, 0.99, 0.99], y: [0.5, 0.35, 0.8, 0.95] },
    link: { source: [0, 0, 0], target: [1, 2, 3], value: [mb.V, mb.C, mb.P], color: ['rgba(31,95,174,0.25)', 'rgba(31,122,77,0.3)', 'rgba(194,65,12,0.3)'] },
  }], base({ margin: { l: 10, r: 10, t: 10, b: 10 }, showlegend: false }));
}

// P11: ΔT per effect vs N
export function p11(out) {
  const inp = out.inputs;
  const sw = sweepN(inp, out.BPE, 10);
  draw('p11', [
    { x: sw.map((d) => d.N), y: sw.map((d) => d.dT), type: 'bar', name: 'ΔT per effect', marker: { color: sw.map((d) => (d.N === inp.N ? (d.feasible ? C.warn : '#7f1d1d') : d.feasible ? C.e3 : C.grey)) }, hovertemplate: 'N = %{x}: %{y:.2f} K<extra></extra>' },
    { x: [0.5, 10.5], y: [inp.dTmin, inp.dTmin], mode: 'lines', name: `ΔT_min = ${inp.dTmin} K`, line: { color: C.warn, dash: 'dash' } },
  ], base({
    xaxis: ax('Number of effects N', { dtick: 1, range: [0.5, 10.5] }), yaxis: ax('ΔT per effect (K)'),
    annotations: [{ text: `max feasible N = ${out.effects[1]?.maxFeasibleN ?? '—'} (grey = infeasible; orange = current N)`, xref: 'paper', yref: 'paper', x: 0.99, y: 0.99, xanchor: 'right', showarrow: false, font: { size: 11 } }],
  }));
}

export function renderAll(out, Tcold) {
  p5(out); p6(out); p3(out); p4(out); p2(out); p11(out); p7(out); p8(out); p1b(out);
  return p1(out, Tcold);
}
export { nn };
