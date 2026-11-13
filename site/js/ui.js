// ui.js: reads inputs, calls simulate(), renders cards, charts and the PFD. No physics here.
import { DATA } from './data.js';
import { simulate, DEFAULT_INPUTS, RANGES, solubility, phiSat, bpe, hfg, F_LI } from './model.js';
import { EQ, THEORY_GROUPS } from './content.js';
import { renderAll } from './charts.js';
import { mountPFD, updatePFD } from './pfd.js';

// ---------- formatting (never shows NaN) ----------
const ok = (v) => typeof v === 'number' && Number.isFinite(v);
const fmt = (v, d = 2) => (ok(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const tex = (s, display = false) => {
  try { return window.katex.renderToString(s, { displayMode: display, throwOnError: false, output: 'html' }); }
  catch { return `<code>${s}</code>`; }
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- state ----------
let state = { ...DEFAULT_INPUTS };
let Tcold = 20;

// ---------- slider definitions (ranges from §5.4) ----------
const est = (o) => o && o.estimate;
const SLIDERS = [
  { group: 'Feed and crystallizer' },
  { key: 'F', label: 'Feed F', units: 'kg/h', step: 500, d: 0, estimate: true },
  { key: 'xF', label: 'Feed LiOH x_F', units: 'mass frac', step: 0.001, d: 3, estimate: est(DATA.feed.xF) },
  { key: 'zF', label: 'Feed impurity z_F (NaOH-eq.)', units: 'mass frac', step: 0.0001, d: 4, estimate: est(DATA.feed.zF) },
  { key: 'T_C', label: 'Liquor (boiling) T_b', units: '°C', step: 0.5, d: 1 },
  { key: 'purgeRatio', label: 'Purge ratio p = P/F', units: '–', step: 0.005, d: 3 },
  { key: 'epsilon', label: 'Adhering liquor ε', units: 'kg/kg crystals', step: 0.005, d: 3, estimate: est(DATA.feed.epsilon) },
  { group: 'Boiling-point elevation' },
  { toggle: 'useOsmotic', label: 'Real electrolyte: use φ_sat(T) (Monnin & Dubois 2005). Off = ideal × activity factor.' },
  { key: 'activityFactor', label: 'Activity factor a (if not real)', units: '–', step: 0.01, d: 2, estimate: true, dependsOff: 'useOsmotic' },
  { fixed: 'i = 2 ions per LiOH (fixed); γ = 1.33 (fixed, ESTIMATE)' },
  { group: 'MVR compressor and heater' },
  { key: 'dT_heater', label: 'Heater ΔT', units: 'K', step: 0.5, d: 1, estimate: est(DATA.compressor.dT_heater) },
  { key: 'etaIs', label: 'Isentropic efficiency η_is', units: '–', step: 0.01, d: 2, estimate: est(DATA.compressor.etaIs) },
  { key: 'etaMotor', label: 'Motor efficiency η_m', units: '–', step: 0.01, d: 2, estimate: est(DATA.compressor.etaMotor) },
  { group: 'Multi-effect evaporator' },
  { key: 'N', label: 'Number of effects N', units: '', step: 1, d: 0 },
  { key: 'Ts_C', label: 'Heating steam T_s', units: '°C', step: 1, d: 0, estimate: est(DATA.evaporator.Ts_C) },
  { key: 'Tlast_C', label: 'Last-effect condenser T_last', units: '°C', step: 1, d: 0, estimate: est(DATA.evaporator.Tlast_C) },
  { key: 'dTmin', label: 'Minimum ΔT per effect', units: 'K', step: 0.5, d: 1, estimate: est(DATA.evaporator.dTmin) },
  { group: 'Prices and operation' },
  { key: 'ce', label: 'Electricity c_e', units: '$/kWh', step: 0.001, d: 3, note: 'EIA Texas industrial Aug 2026 = 0.0721' },
  { key: 'cs', label: 'Steam c_s', units: '$/t', step: 0.05, d: 2, estimate: est(DATA.prices.steam), note: 'fuel-only ESTIMATE = 7.33' },
  { key: 'hours', label: 'Operating hours', units: 'h/yr', step: 10, d: 0 },
];

function buildSliders() {
  const host = document.getElementById('sliders');
  let html = '';
  for (const s of SLIDERS) {
    if (s.group) { html += `<div class="slider-group"><h4>${s.group}</h4></div>`; continue; }
    if (s.fixed) { html += `<p class="slider hint">${s.fixed}</p>`; continue; }
    if (s.toggle) { html += `<label class="toggle"><input type="checkbox" id="in-${s.toggle}"> ${s.label}</label>`; continue; }
    const [min, max] = RANGES[s.key];
    html += `<label class="slider" id="wrap-${s.key}"><span class="row"><span>${s.label}${s.estimate ? ' <span class="flag">ESTIMATE</span>' : ''}</span><output id="out-${s.key}"></output></span>
      <input type="range" id="in-${s.key}" min="${min}" max="${max}" step="${s.step}" aria-label="${esc(s.label)}">
      ${s.note ? `<span class="hint">${s.note}</span>` : ''}</label>`;
  }
  host.innerHTML = html;
  for (const s of SLIDERS) {
    if (s.key) document.getElementById(`in-${s.key}`).addEventListener('input', (e) => { state[s.key] = parseFloat(e.target.value); schedule(); });
    if (s.toggle) document.getElementById(`in-${s.toggle}`).addEventListener('change', (e) => { state[s.toggle] = e.target.checked; schedule(); });
  }
}
function syncSliders() {
  for (const s of SLIDERS) {
    if (s.key) {
      const el = document.getElementById(`in-${s.key}`);
      el.value = state[s.key];
      document.getElementById(`out-${s.key}`).textContent = `${fmt(state[s.key], s.d)} ${s.units}`.trim();
      if (s.dependsOff) document.getElementById(`wrap-${s.key}`).classList.toggle('disabled', !!state[s.dependsOff]);
    }
    if (s.toggle) document.getElementById(`in-${s.toggle}`).checked = !!state[s.toggle];
  }
}

// ---------- presets ----------
const PRESETS = {
  handcalc: () => ({ ...DEFAULT_INPUTS }),
  highbpe: () => ({ ...DEFAULT_INPUTS, T_C: 100, useOsmotic: false, activityFactor: 1.2 }),
  cheap: () => ({ ...state, ce: DATA.prices.electricity.value }),
  expensive: () => ({ ...state, ce: RANGES.ce[1] }),
  infeasible: () => ({ ...DEFAULT_INPUTS, xF: 0.02, purgeRatio: 0.2 }),
};
function applyPreset(name) {
  state = PRESETS[name]();
  document.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', b.dataset.preset === name));
  schedule();
}

// ---------- result cards ----------
// Each: eq id (content.js) or custom tex, value(out), units, short live interpretation, and substituted equation for the "?" panel.
const CARDS = [
  { group: 'Solubility and boiling-point elevation', items: [
    { id: 's', name: 'Solubility s', tex: String.raw`s = s(T_b)\ \text{(linear interp., Monnin \& Dubois)}`, units: 'g LiOH/100 g H₂O', d: 3, v: (o) => o.s,
      say: (o) => `Saturated liquor at ${fmt(o.inputs.T_C, 1)} °C holds ${fmt(o.s, 2)} g LiOH per 100 g water; it changes little with T (P1).` },
    { id: 'm', name: 'Molality m', tex: String.raw`m = \dfrac{s/100}{M_{LiOH}}`, units: 'mol/kg H₂O', d: 3, v: (o) => o.m,
      sub: (o) => String.raw`m = \dfrac{${fmt(o.s, 4)}/100}{0.023947} = ${fmt(o.m, 3)}`,
      say: (o) => `Concentrated: about ${fmt(o.m, 1)} mol LiOH per kg water (P2).` },
    { id: 'Kb', name: 'Ebullioscopic constant K_b', tex: String.raw`K_b = \dfrac{R\,T_b^2}{h_{fg}(T_b)}`, units: 'K·kg/mol', d: 4, v: (o) => o.Kb,
      sub: (o) => String.raw`K_b = \dfrac{8.314\times(${fmt(o.inputs.T_C + 273.15, 2)})^2}{${fmt(hfg(o.inputs.T_C) * 1000, 0)}} = ${fmt(o.Kb, 4)}`,
      say: () => 'Smaller than 0.512 (the 100 °C value) at lower T because K_b ∝ T².' },
    { id: 'phi', name: 'Activity factor a', tex: String.raw`a = \varphi_{sat}(T_b)\ \text{or slider}`, units: '–', d: 3, v: (o) => (o.inputs.useOsmotic ? o.phi : o.inputs.activityFactor),
      say: (o) => (o.inputs.useOsmotic ? `Real LiOH(aq) acts like only ${fmt(o.phi * 100, 0)} % of the ideal ion count.` : 'Ideal-solution mode: a is set by the slider (ESTIMATE).') },
    { id: 'BPE', eq: 'B1', name: 'Boiling-point elevation', units: 'K', d: 3, v: (o) => o.BPE,
      sub: (o) => String.raw`\mathrm{BPE} = ${fmt(o.inputs.useOsmotic ? o.phi : o.inputs.activityFactor, 3)}\times 2\times ${fmt(o.Kb, 4)}\times ${fmt(o.m, 3)} = ${fmt(o.BPE, 3)}\ \mathrm{K}`,
      say: (o) => `The liquor boils ${fmt(o.BPE, 2)} K hotter than pure water at the same pressure.` },
    { id: 'Tv', eq: 'B2', name: 'Vapor condensing temperature T_v', units: '°C', d: 2, v: (o) => o.mvr?.Tv_C,
      sub: (o) => String.raw`T_v = ${fmt(o.inputs.T_C, 1)} - ${fmt(o.BPE, 3)} = ${fmt(o.mvr?.Tv_C, 2)}\ ^\circ\mathrm{C}`,
      say: () => 'The vapor itself only condenses at T_v, which is why the compressor must lift it.' },
  ] },
  { group: 'Mass balance with purge', items: [
    { id: 'zML', eq: 'M4', name: 'Mother-liquor impurity z_ML', units: 'mass frac', d: 4, v: (o) => o.mass.zML,
      sub: (o) => String.raw`z_{ML} = ${fmt(o.inputs.zF, 4)}/${fmt(o.inputs.purgeRatio, 3)} = ${fmt(o.mass.zML, 4)}`,
      say: (o) => `Impurity concentrates ${fmt(1 / o.inputs.purgeRatio, 0)}× in the mother liquor.` },
    { id: 'xL', eq: 'M5', name: 'Liquor LiOH x_L', units: 'mass frac', d: 4, v: (o) => o.mass.xL,
      say: () => 'Saturated: the LiOH:water ratio is fixed by solubility.' },
    { id: 'C', eq: 'M2', name: 'Crystal product C', units: 'kg/h LiOH·H₂O', d: 1, v: (o) => o.mass.C,
      sub: (o) => String.raw`C = \dfrac{F x_F - P x_L}{${fmt(F_LI, 4)}} = \dfrac{${fmt(o.inputs.F * o.inputs.xF, 1)} - ${fmt(o.mass.P == null ? null : o.mass.P * o.mass.xL, 2)}}{${fmt(F_LI, 4)}} = ${fmt(o.mass.C, 1)}`,
      say: () => 'Whatever LiOH the purge does not carry leaves as crystals.' },
    { id: 'V', eq: 'M6', name: 'Water evaporated V', units: 'kg/h', d: 1, v: (o) => o.mass.V,
      say: () => 'Most of the feed water must be boiled off: this is the energy bill.' },
    { id: 'P', eq: 'M3', name: 'Purge P', units: 'kg/h', d: 1, v: (o) => o.mass.P,
      say: () => 'The purge is the only exit for impurities.' },
    { id: 'yield', eq: 'M7', name: 'Lithium yield', units: '%', d: 2, v: (o) => (o.mass.liYield == null ? null : 100 * o.mass.liYield),
      say: (o) => (o.mass.liYield == null ? 'No product at these inputs.' : `${fmt(100 - 100 * o.mass.liYield, 1)} % of the Li leaves in the purge (P7).`) },
    { id: 'imp', eq: 'M8', name: 'Product impurity', units: 'ppm', d: 0, v: (o) => o.mass.productImpurity_ppm,
      sub: (o) => String.raw`\dfrac{${fmt(o.inputs.epsilon, 3)}\times ${fmt(o.mass.zML, 4)}}{1+${fmt(o.inputs.epsilon, 3)}}\times10^6 = ${fmt(o.mass.productImpurity_ppm, 0)}\ \mathrm{ppm}`,
      say: () => 'Set by the liquor film on the crystals: washing (smaller ε) is the purity lever.' },
    { id: 'closure', eq: 'M1', name: 'Mass closure V + C + P − F', units: 'kg/h', d: 6, v: (o) => o.mass.closureError,
      say: () => 'Should be ~0: the water balance and the overall balance agree.' },
  ] },
  { group: 'MVR compressor', items: [
    { id: 'Q', eq: 'E1', name: 'Heat duty Q', units: 'kW', d: 0, v: (o) => o.Q_kW,
      sub: (o) => String.raw`Q = \dfrac{${fmt(o.mass.V, 1)}\times ${fmt(o.lambdaV, 1)}}{3600} = ${fmt(o.Q_kW, 0)}\ \mathrm{kW}`,
      say: () => 'Almost all the energy goes into boiling water off.' },
    { id: 'P12', eq: 'C1', name: 'Suction / discharge P₁ → P₂', units: 'kPa', d: 2, v: (o) => o.mvr?.P1, v2: (o) => o.mvr?.P2,
      say: (o) => `Vacuum operation; condensing at T_c = ${fmt(o.mvr?.Tc_C, 1)} °C needs ${fmt(o.mvr?.P2, 2)} kPa.` },
    { id: 'r', eq: 'C2', name: 'Pressure ratio r', units: '–', d: 3, v: (o) => o.mvr?.r,
      sub: (o) => String.raw`r = ${fmt(o.mvr?.P2, 3)}/${fmt(o.mvr?.P1, 3)} = ${fmt(o.mvr?.r, 3)};\ \text{lift} = ${fmt(o.mvr?.lift, 2)}\ \mathrm{K}`,
      say: (o) => `Lift ${fmt(o.mvr?.lift, 2)} K, of which BPE is ${fmt(100 * o.BPE / o.mvr?.lift, 0)} % (P3). ${o.mvr?.r > 2 ? 'Above ~2: two stages needed.' : 'One centrifugal stage can do this.'}` },
    { id: 'ws', eq: 'C3', name: 'Isentropic work w_s', units: 'kJ/kg', d: 2, v: (o) => o.mvr?.ws,
      sub: (o) => String.raw`w_s = \dfrac{1.33}{0.33}\times 461.5\times ${fmt(o.inputs.T_C + 273.15, 2)}\times\left[${fmt(o.mvr?.r, 3)}^{0.248}-1\right]/1000 = ${fmt(o.mvr?.ws, 2)}`,
      say: (o) => `Only ${fmt(100 * o.mvr?.ws / o.lambdaV, 1)} % of the latent heat: work pays for the lift, not the boiling.` },
    { id: 'w', eq: 'C4', name: 'Actual work w and electric power', units: 'kJ/kg', d: 2, v: (o) => o.mvr?.w, v2: (o) => o.mvr?.Welec_kW, units2: 'kW',
      say: (o) => `W_elec = ${fmt(o.mvr?.Welec_kW, 1)} kW, vs Q = ${fmt(o.Q_kW, 0)} kW of heat moved.` },
    { id: 'kwh', eq: 'C5', name: 'Specific energy', units: 'kWh/t water', d: 2, v: (o) => o.mvr?.kWh_per_t,
      sub: (o) => String.raw`\dfrac{${fmt(o.mvr?.w, 2)}}{3.6\times ${fmt(o.inputs.etaMotor, 2)}} = ${fmt(o.mvr?.kWh_per_t, 2)}`,
      say: (o) => `Vendor range 20–60 kWh/t (ESTIMATE); this case is ${o.mvr?.kWh_per_t < 20 ? 'below' : o.mvr?.kWh_per_t > 60 ? 'above' : 'inside'} it (P4).` },
    { id: 'cop', eq: 'C6', name: 'COP (actual / Carnot)', units: '–', d: 1, v: (o) => o.mvr?.COP, v2: (o) => o.mvr?.COP_carnot,
      say: (o) => `${fmt(o.mvr?.COP, 0)} units of heat moved per unit of compressor work.` },
    { id: 'T2', eq: 'C7', name: 'Discharge temperature T₂', units: '°C', d: 1, v: (o) => o.mvr?.T2_C,
      sub: (o) => String.raw`T_2 = ${fmt(o.inputs.T_C + 273.15, 2)}\left[1+\dfrac{${fmt(o.mvr?.r, 3)}^{0.248}-1}{${fmt(o.inputs.etaIs, 2)}}\right] - 273.15 = ${fmt(o.mvr?.T2_C, 1)}\ ^\circ\mathrm{C}`,
      say: (o) => `${fmt(o.mvr?.T2_C - o.mvr?.Tc_C, 0)} K superheated above T_c: compression makes steam superheated, not wet.` },
  ] },
  { group: 'Multi-effect evaporator (same feed)', items: [
    { id: 'S1', eq: 'E2', name: 'Single effect: steam S and economy', units: 'kg/h', d: 0, v: (o) => o.effects[1]?.S, v2: (o) => o.effects[1]?.economy, units2: 'kg/kg',
      say: (o) => `1 kg steam boils ${fmt(o.effects[1]?.economy, 3)} kg water (h_fg is smaller at 120 °C than at T_v).` },
    { id: 'EN', eq: 'E3', name: 'N effects: economy E_N and steam', units: 'kg/kg', d: 2, v: (o) => o.effects[o.inputs.N]?.economy, v2: (o) => o.effects[o.inputs.N]?.S, units2: 'kg/h',
      say: (o) => `With N = ${o.inputs.N}, the latent heat is reused ${o.inputs.N} times (ideal upper bound).` },
    { id: 'dTe', eq: 'E4', name: 'ΔT per effect', units: 'K', d: 2, v: (o) => o.effects[o.inputs.N]?.dT_per_effect, bad: (o) => o.effects[o.inputs.N] && !o.effects[o.inputs.N].feasible,
      sub: (o) => String.raw`\dfrac{${o.inputs.Ts_C} - ${o.inputs.Tlast_C} - ${o.inputs.N}\times ${fmt(o.BPE, 2)}}{${o.inputs.N}} = ${fmt(o.effects[o.inputs.N]?.dT_per_effect, 2)}\ \mathrm{K}`,
      say: (o) => `${o.effects[o.inputs.N]?.feasible ? 'Feasible' : 'INFEASIBLE'}: max ${o.effects[o.inputs.N]?.maxFeasibleN} effects fit (P11).` },
  ] },
  { group: 'Operating cost', items: [
    { id: 'cMVR', eq: '$1', name: 'MVR cost', units: '$/t water', d: 2, v: (o) => o.econ[1]?.cost_MVR_per_t,
      sub: (o) => String.raw`${fmt(o.inputs.ce, 4)}\times ${fmt(o.mvr?.kWh_per_t, 2)} = ${fmt(o.econ[1]?.cost_MVR_per_t, 2)}`,
      say: () => 'You pay only for the lift.' },
    { id: 'cN', eq: '$2', name: 'N-effect cost', units: '$/t water', d: 2, v: (o) => o.econ[o.inputs.N]?.cost_ME_per_t,
      sub: (o) => String.raw`${fmt(o.inputs.cs, 2)}/${fmt(o.effects[o.inputs.N]?.economy, 3)} = ${fmt(o.econ[o.inputs.N]?.cost_ME_per_t, 2)}`,
      say: (o) => `Steam divided by ${o.inputs.N} reuses. Steam price is a fuel-only ESTIMATE.` },
    { id: 'cx', eq: '$3', name: 'Crossover electricity price c_e*', units: '$/kWh', d: 4, v: (o) => o.econ[o.inputs.N]?.ce_crossover,
      say: (o) => `MVR is cheaper to run than ${o.inputs.N} effects if electricity < $${fmt(o.econ[o.inputs.N]?.ce_crossover, 3)}/kWh (now $${fmt(o.inputs.ce, 3)}) (P6).` },
    { id: 'ann', eq: '$4', name: 'Annual cost: MVR vs N effects', units: '$/yr', d: 0, v: (o) => o.econ[1]?.annual_MVR, v2: (o) => o.econ[o.inputs.N]?.annual_ME, units2: '$/yr',
      say: (o) => `Over ${fmt(o.inputs.hours, 0)} h/yr at this feed rate.` },
  ] },
];

function buildCards() {
  const host = document.getElementById('cards');
  host.innerHTML = CARDS.map((g) => `<div class="card-group"><h3>${g.group}</h3><div class="cards">${g.items.map((c) => {
    const e = c.eq ? EQ[c.eq] : null;
    const t = c.tex || e.tex;
    const units = e ? e.units : c.units;
    return `<div class="rcard" id="card-${c.id}">
      <div class="head"><span class="name">${c.eq ? `<span class="tag">${c.eq}</span>` : ''}${c.name}</span><button type="button" class="help" aria-label="Explain ${esc(c.name)}" aria-expanded="false">?</button></div>
      <div class="val"><span class="num">—</span><span class="u">${c.units}</span></div>
      <div class="eq">${tex(t, false)}</div>
      <p class="units">Units: ${units}</p>
      <p class="short interp"></p>
      <div class="more">${c.sub ? '<div class="eq sub"></div>' : ''}${e ? `<p class="interp">${e.interp}</p>` : ''}</div>
    </div>`;
  }).join('')}</div></div>`).join('');
  host.querySelectorAll('.rcard .help').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.rcard');
    card.classList.toggle('open');
    b.setAttribute('aria-expanded', card.classList.contains('open'));
    if (lastOut) updateCards(lastOut);
  }));
}

function updateCards(o) {
  for (const g of CARDS) for (const c of g.items) {
    const card = document.getElementById(`card-${c.id}`);
    if (!card) continue;
    let txt;
    try {
      const v = c.v(o);
      txt = fmt(v, c.d);
      if (c.v2) txt += ` <span class="u">${c.units}</span> · ${fmt(c.v2(o), c.units2 === '$/yr' || c.units2 === 'kg/h' ? 0 : c.d)}`;
    } catch { txt = '—'; }
    const num = card.querySelector('.num');
    num.innerHTML = txt;
    card.querySelector('.val .u:last-child').textContent = c.v2 ? (c.units2 || c.units) : c.units;
    let say = '';
    try { say = c.say ? c.say(o) : ''; } catch { say = ''; }
    card.querySelector('.short').textContent = say.replace(/NaN/g, '—');
    const bad = (c.bad && c.bad(o)) || (o.mass && !o.mass.feasible && /^(C|V|P|yield|imp|closure|Q|w|S1|EN|ann)$/.test(c.id));
    card.classList.toggle('bad', !!bad);
    if (c.sub && card.classList.contains('open')) {
      let s = '';
      try { s = c.sub(o); } catch { s = ''; }
      card.querySelector('.sub').innerHTML = s ? tex(s, false) : '';
    }
  }
}

// ---------- update loop ----------
let pending = false, lastOut = null;
function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
function update() {
  pending = false;
  syncSliders();
  let out;
  try { out = simulate(state); } catch (e) {
    document.getElementById('warnings').innerHTML = `<ul><li>Calculation error: ${esc(e.message)}</li></ul>`;
    return;
  }
  lastOut = out;
  const w = document.getElementById('warnings');
  w.innerHTML = out.warnings.length ? `<strong>Warning</strong><ul>${out.warnings.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : '';
  updateCards(out);
  updatePFD(out);
  if (currentTab() === 'simulator' && window.Plotly) {
    const yc = renderAll(out, Tcold);
    document.getElementById('cool-yield').textContent = `Cooling ${fmt(out.inputs.T_C, 0)} → ${Tcold} °C recovers only ${fmt(100 * yc, 1)} % of the dissolved LiOH (M9).`;
  }
}

// ---------- router ----------
const TABS = ['overview', 'industry', 'theory', 'simulator', 'ai-workflow', 'video', 'references'];
function currentTab() { const h = location.hash.replace('#', ''); return TABS.includes(h) ? h : 'overview'; }
function route() {
  const t = currentTab();
  document.querySelectorAll('section.tab').forEach((s) => { s.hidden = s.dataset.tab !== t; });
  document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === t));
  const active = document.querySelector(`.tabs a[data-tab="${t}"]`);
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (t === 'simulator') schedule();
}

// ---------- static content ----------
function renderTheory() {
  const host = document.getElementById('theory-equations');
  host.innerHTML = THEORY_GROUPS.map((g) => `<div class="eq-group"><h3>${g.title}</h3><div class="eq-list">${g.ids.map((id) => {
    const e = EQ[id];
    return `<div class="eq-card"><h4><span class="tag">${id}</span>${e.title}</h4><div class="eq">${tex(e.tex, true)}</div><p class="units">Units: ${e.units}</p><p class="interp">${e.interp}</p></div>`;
  }).join('')}</div></div>`).join('');
  // live numbers in Theory text (hand-calc state)
  const s60 = solubility(60);
  const live = {
    phi60: fmt(phiSat(60), 3),
    bpeReal: fmt(bpe({ s: s60, T_C: 60, i: 2, activityFactor: phiSat(60) }), 2),
    bpeIdeal: fmt(bpe({ s: s60, T_C: 60, i: 2, activityFactor: 1 }), 2),
    s20: fmt(solubility(20), 1), s100: fmt(solubility(100), 1),
  };
  document.querySelectorAll('[data-live]').forEach((el) => { el.textContent = live[el.dataset.live] ?? '—'; });
}

const SOURCE_IDS = Object.keys(DATA.sources);
function citeLabel(id) { const n = SOURCE_IDS.indexOf(id) + 1; return n ? `<a href="#references" title="${esc(DATA.sources[id].citation)}">[${n}]</a>` : ''; }

function renderReferences() {
  document.getElementById('source-list').innerHTML = SOURCE_IDS.map((id) => {
    const s = DATA.sources[id];
    return `<li id="src-${id}">${esc(s.citation)}${s.url ? ` <a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.url)}</a>` : ''}${s.accessed ? ` (accessed ${esc(s.accessed)})` : ''}${s.verify ? ` <span class="flag">TO VERIFY</span> ${esc(s.verify)}` : ''}</li>`;
  }).join('');
  const rows = [];
  const show = (v) => (v === null ? '<span class="flag">SOURCE NEEDED</span>' : Array.isArray(v) ? v.join('–') : esc(v));
  (function walk(o, path) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    if ('sourceId' in o) {
      let num;
      if ('value' in o) num = show(o.value);
      else if (o.rows) num = `table, ${o.rows.length} rows (${o.columns.join(', ')})`;
      else if (o.points) num = `table, ${o.points.length} points (${o.columns.join(', ')})`;
      else if ('A' in o) num = `A = ${o.A}, B = ${o.B}, C = ${o.C}`;
      rows.push(`<tr><td><code>${esc(path)}</code></td><td>${num}${o.estimate ? ' <span class="flag">ESTIMATE</span>' : ''}</td><td>${esc(o.units || '')}</td><td>${citeLabel(o.sourceId)} ${esc(o.sourceId)}</td><td>${esc(o.note || o.form || '')}</td></tr>`);
      return;
    }
    for (const [k, v] of Object.entries(o)) if (k !== 'sources' && k !== 'meta') walk(v, path ? `${path}.${k}` : k);
  })(DATA, '');
  rows.push(`<tr><td>MVR market share</td><td>55–60 % <span class="flag">ESTIMATE</span></td><td>% of market</td><td>Meticulous Research (market estimate, from the project plan; not in data.js)</td><td>Industry tab only; not used in calculations.</td></tr>`);
  document.querySelector('#value-table tbody').innerHTML = rows.join('');
  // inline citations and values elsewhere
  document.querySelectorAll('.cite[data-src]').forEach((el) => { el.innerHTML = citeLabel(el.dataset.src); });
  document.querySelectorAll('[data-value]').forEach((el) => {
    const v = el.dataset.value.split('.').reduce((o, k) => o?.[k], DATA);
    el.textContent = v && v.value != null ? v.value : '—';
  });
  document.querySelectorAll('[data-tex]').forEach((el) => { el.innerHTML = tex(el.dataset.tex, true); });
}

function initSubtabs() {
  document.querySelectorAll('.subtab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.subtab').forEach((x) => x.classList.toggle('active', x === b));
    document.querySelectorAll('.subpanel').forEach((p) => { p.hidden = p.dataset.sub !== b.dataset.sub; });
  }));
}

function init() {
  renderTheory();
  renderReferences();
  initSubtabs();
  buildSliders();
  buildCards();
  mountPFD(document.getElementById('pfd'));
  document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  const tc = document.getElementById('tcold');
  tc.addEventListener('input', () => { Tcold = parseFloat(tc.value); document.getElementById('tcold-out').textContent = Tcold; schedule(); });
  window.addEventListener('hashchange', route);
  route();
  schedule();
  // expose for the browser test only (read-only view of the last result)
  window.__mvr = { get out() { return lastOut; }, applyPreset };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
