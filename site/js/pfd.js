// pfd.js: static labeled process flow diagram (inline SVG) with live stream values.
const SVG = `
<svg viewBox="0 0 760 300" role="img" aria-label="Process flow diagram of an MVR evaporative crystallizer" font-family="system-ui, sans-serif" font-size="12">
  <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1d2330"/></marker></defs>
  <style>.u{fill:#f2f6fc;stroke:#1f5fae;stroke-width:2}.s{fill:none;stroke:#1d2330;stroke-width:1.6;marker-end:url(#arr)}.v{stroke:#1f5fae}.l{fill:#1d2330}.n{fill:#5b6475;font-size:11px}.k{font-weight:700}</style>
  <!-- crystallizer body -->
  <rect class="u" x="270" y="70" width="120" height="150" rx="30"/>
  <text class="l k" x="330" y="140" text-anchor="middle">Crystallizer</text>
  <text class="l" x="330" y="156" text-anchor="middle" id="pfd-Tb">T_b</text>
  <text class="n" x="330" y="172" text-anchor="middle" id="pfd-P1">P₁</text>
  <!-- compressor -->
  <path class="u" d="M480,30 L540,45 L540,85 L480,100 z"/>
  <text class="l k" x="510" y="22" text-anchor="middle">Compressor</text>
  <text class="n" x="470" y="118" id="pfd-r">r</text>
  <text class="n" x="470" y="133" id="pfd-W">W</text>
  <!-- heater -->
  <rect class="u" x="550" y="150" width="95" height="80" rx="6"/>
  <text class="l k" x="597" y="186" text-anchor="middle">Heater</text>
  <text class="n" x="597" y="204" text-anchor="middle" id="pfd-Tc">T_c</text>
  <!-- centrifuge -->
  <rect class="u" x="250" y="250" width="70" height="36" rx="6"/>
  <text class="l k" x="285" y="273" text-anchor="middle">Centrifuge</text>
  <!-- streams -->
  <path class="s" d="M20,150 L268,150"/>
  <text class="l k" x="22" y="140">Feed</text>
  <text class="n" x="22" y="168" id="pfd-F">F</text>
  <text class="n" x="22" y="183" id="pfd-xF">x_F</text>
  <path class="s v" d="M330,70 L330,60 L478,60"/>
  <text class="n" x="345" y="52" id="pfd-V">V</text>
  <path class="s v" d="M540,65 L595,65 L595,148"/>
  <text class="n" x="604" y="120" id="pfd-T2">T₂</text>
  <path class="s" d="M550,200 L470,200 L392,200"/>
  <text class="n" x="430" y="192" text-anchor="middle">circulating liquor</text>
  <path class="s" d="M645,215 L745,215"/>
  <text class="n" x="650" y="232">condensate out</text>
  <path class="s" d="M300,220 L300,248"/>
  <path class="s" d="M320,268 L470,268"/>
  <text class="l k" x="480" y="265">Crystals</text>
  <text class="n" x="480" y="281" id="pfd-C">C</text>
  <path class="s" d="M250,268 L140,268"/>
  <text class="l k" x="30" y="265">Purge</text>
  <text class="n" x="30" y="281" id="pfd-P">P</text>
  <text class="n" x="150" y="258">mother liquor</text>
</svg>`;

export function mountPFD(el) { el.innerHTML = SVG; }

export function updatePFD(out) {
  const set = (id, t) => { const n = document.getElementById(id); if (n) n.textContent = t; };
  const kg = (v) => (v == null ? '—' : `${Math.round(v).toLocaleString('en-US')} kg/h`);
  const inp = out.inputs, mb = out.mass, mv = out.mvr;
  set('pfd-F', `F = ${kg(inp.F)}`);
  set('pfd-xF', `x_F = ${(inp.xF * 100).toFixed(1)} wt % LiOH`);
  set('pfd-Tb', `T_b = ${inp.T_C.toFixed(1)} °C`);
  set('pfd-V', `vapor V = ${kg(mb.V)}`);
  set('pfd-C', `C = ${kg(mb.C)} LiOH·H₂O`);
  set('pfd-P', `P = ${kg(mb.P)}`);
  if (mv) {
    set('pfd-P1', `P₁ = ${mv.P1.toFixed(2)} kPa`);
    set('pfd-r', `r = ${mv.r.toFixed(3)}`);
    set('pfd-W', `W = ${mv.Welec_kW == null ? '—' : mv.Welec_kW.toFixed(0) + ' kW'}`);
    set('pfd-T2', `T₂ = ${mv.T2_C.toFixed(1)} °C`);
    set('pfd-Tc', `T_c = ${mv.Tc_C.toFixed(1)} °C`);
  }
}
