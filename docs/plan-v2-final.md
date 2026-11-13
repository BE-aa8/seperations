# Plan v2 (final): MVR Crystallizer Explorer

**History:** `plan-v1-claude.md` (Claude) → critiqued by Gemini (`critique-v1-gemini.md`) → decisions approved by Andrew (`critique-decisions.md`, 2026-11-13) → this plan, merged by Claude.
**This file is self-contained.** Both build models get only this plan, `docs/build-prompt.md`, and `site/js/data.js`. Neither needs the earlier files.
**Changes from v1** are tagged **[v2: #n]**, where n is the row in `critique-decisions.md`.
**Phase 0 amendments (2026-11-13), after data verification**, are tagged **[P0]**. They override anything else in this file:
- **[P0-1] BPE uses a sourced osmotic coefficient.** New input `useOsmotic` (default `true`): activityFactor = φ_sat(T), interpolated from `DATA.osmoticSat` (Monnin & Dubois 2005). With `useOsmotic: false`, the `activityFactor` slider applies (default 1.0 = ideal). The UI shows a toggle "ideal vs real (osmotic coefficient)". At 60 °C, φ = 0.829, so BPE = 3.95 K instead of 4.76 K ideal.
- **[P0-2] Solubility** comes from Monnin & Dubois Eq 1, tabulated every 5 °C in `DATA.solubility`. The v1 working table was off: 14.56 g/100 g at 60 °C, not 13.8.
- **[P0-3] Antoine:** a single constant set (A = 8.07131, B = 1730.63, C = 233.426) over 30–130 °C. Checked against NIST: within 0.38 % up to 110 °C and 0.56 % at 130 °C. No switch at 100 °C.
- **[P0-4] Defaults come from `DATA`** wherever `DATA` has the value (xF, zF, epsilon, dT_heater, etaIs, etaMotor, gamma, Ts_C, Tlast_C, dTmin, ce, cs). New defaults: **ce = 0.0721 $/kWh** (EIA, Texas industrial, Aug 2026); **cs = 7.33 $/t** (fuel-only ESTIMATE from the EIA Texas gas price, formula in `data.js`).
- **[P0-5] `simulate()` also returns** `s`, `m`, `Kb`, `phi`, `lambdaV` (= h_fg(T_v)). Keys in `effects` and `econ` are the effect counts (1, 3, 5, N). Flows are `null` when `mass.feasible` is false.
- **[P0-6] Expected values** for §7 live only in `docs/handcalc.md` and `tests/handcalc-expected.json`. The table in §7.1 below is from v1 and is superseded.
- **[P0-7] No spec line yet:** `DATA.spec.naMax_ppm` is null (source needed), so the purity plot hides the spec line while it is null. `DATA.industry.lceIntensity` is also null, so the Industry tab shows the formula without a number.

---

## 0. Project facts

| Item | Value |
|---|---|
| Course | UC CHE 4061 Separation Processes, Prof. Carlos Co, Fall 2026 (Seader/Henley/Roper 4th ed.) |
| Project type | **Individual** (50 pts, recorded in-class talk + detailed technical Q&A) |
| Topic | MVR evaporative crystallization of battery-grade LiOH·H2O; Tesla Robstown, TX refinery as industry context |
| Models | Plan: Claude. Critique: Gemini. Builds: **Claude Code → `site/`**, **Gemini → `site/gemini/`** |
| Stack (both builds) | Plain HTML/CSS/JS, Plotly, KaTeX. Static, no backend, mobile-friendly. Netlify. |
| Priority | **Physics first.** Clean, readable design; no animation or custom art. |
| Level | **3rd-year ChemE undergraduate. Do not go beyond it.** |
| Deadline | **Present Mon Dec 7, 2026.** YouTube video uploaded by **Fri Dec 4.** |
| Rules | Every calculation shows the equation, units, and a one-line physical interpretation ("how does that make sense?"). Every calculation has a plot ("No Plot = No Pay"). No invented data: every value is cited or flagged ESTIMATE. |

---

## 1. Goal

A public, static website that teaches **why lithium refineries crystallize battery-grade LiOH·H2O in MVR-driven evaporative crystallizers**. Order: industrial significance → real process → theory and terminology → interactive simulator. The simulator compares single-effect, N-effect, and MVR evaporation on the same feed. It shows how BPE erodes MVR's advantage, where the electricity-vs-steam price crossover is, and how the purge trades lithium yield against purity.

---

## 2. Phases and schedule (re-baselined Nov 13; Phase 0 ran 2 days late)

| Phase | Dates (2026) | What | Exit criterion |
|---|---|---|---|
| **0. Data + test harness** | Fri Nov 13 – Sun Nov 15 | Verify every value in §6 against its source → write `site/js/data.js`. Write `tests/reference/handcalc_reference.py` and generate `tests/handcalc-expected.json` (§7.3). Write `tests/handcalc.test.mjs`. Finalize `docs/handcalc.md`. | Every value cited or flagged. Reference script runs. Test file exists (it fails until a build exists). |
| **1. MVP (both models)** | Mon Nov 16 – Sat Nov 21 | Claude builds Phase 1 in `site/`. Gemini builds Phase 1 in `site/gemini/` from the identical prompt and files, in a fresh session. | Both pass `npm test` and the browser smoke test. Bugs and fix iterations recorded for each. |
| **2. Enhancements (Claude build only)** | Sun Nov 22 – Wed Nov 25 | (a) Heater-ΔT capital vs operating optimum (P9); (b) clickable PFD; (c) fixed-area turndown (P10). **[v2: 7b, 7c]** | Each has an equation card and a plot; tests still pass. |
| **Buffer** | Thu Nov 26 – Sat Nov 28 | Thanksgiving. Catch-up only. **No Phase 3** **[v2: 7a]** | n/a |
| **4. Verification + comparison** | Sun Nov 29 – Tue Dec 1 | Full verification (§14). `docs/comparison.md`. Screenshots. | Checklist all green. |
| **5. Slides, video, transcript, deploy** | Tue Dec 1 – Sun Dec 6 | PowerPoint by Dec 2. Record and upload **by Fri Dec 4**. Paste transcript Dec 5. Final deploy and phone check Dec 6. | Live URL with video and transcript. Q&A rehearsed. |
| **Present** | **Mon Dec 7** | | |

**Cut order if behind:** turndown (P10) → clickable PFD (keep the static labeled SVG) → capital-cost optimum (keep the operating-cost crossover). MVP items are never cut.

---

## 3. Features → phases

| Feature | Phase 1 MVP | Phase 2 |
|---|---|---|
| **Energy comparison**: 1/3/5 effects vs MVR | Full | n/a |
| **BPE panel**: BPE → lift → r → power | Full | n/a |
| **Solubility panel** | Full, **plus schematic metastable-zone / spinodal / seeding bands** **[v2: 5]** | n/a |
| **Mass balance with purge**: yield vs purity | Full, with feasibility guards **[v2: 8a]** | n/a |
| **Economic crossover** | Operating cost per t + crossover map | Capital cost + heater-ΔT optimum (P9) |
| **Compressor discharge temperature / desuperheating** | T2 shown in the MVR card and Q&A **[v2: 4]** | n/a |
| **Process flow diagram** | Static labeled SVG with live stream values | Clickable units → equations and live values |
| **Turndown** | n/a | Fixed heater area, part load 50–110 % (P10) **[v2: 7b]** |
| **Operating-problem cards** (foaming, Li2CO3 scaling) | **Static text callouts** on Industry/Theory with patent citations **[v2: 7a]** | n/a |
| **"Why crystal size matters" card** | Qualitative card on Theory, no unsourced numbers **[v2: 5]** | n/a |
| ~~MSMPR crystal-size panel~~ | **Dropped [v2: 7a]** | |

---

## 4. Site structure: 7 tabs [v2: 10]

The professor's order is **significance → real process → theory → tool**.

1. **Overview**: a one-screen hook (battery demand → LiOH·H2O → crystallizer energy); what the site does; an "AI project" banner linking to AI Workflow; **What I learned / what I want to learn next**.
2. **Industry Context**: what LiOH·H2O is for (high-nickel cathodes); Tesla Robstown steps (spodumene → kiln → alkaline leach → purification → crystallization); production-volume estimate with the arithmetic shown (§6.7); dominant countries and companies (cited); Veolia MVR crystallizers; MVR market share (flagged as a market-research estimate); why the US wants domestic refining; **operating-problem callouts** (foaming → LiOH carry-over into condensate and wet compressor suction; Li2CO3 scaling → lower U).
3. **Theory**: evaporation as single-stage VLE; BPE (ideal vs real electrolytes); steam economy and multiple effects; MVR as a heat pump; compressor superheat vs wet vapor; solubility, supersaturation (S, σ), metastable zone; **binodal vs spinodal**; nucleation vs growth; **seeding**; **why crystal size matters**; impurity purge; glossary. KaTeX equations.
4. **Simulator**: sliders (left on desktop, top on mobile) → result cards (equation + value + units + interpretation, with a "?" to expand) → plots. Presets: "Hand-calc case", "High BPE", "Cheap electricity (Texas)", "Expensive electricity".
5. **AI Workflow**, two sub-tabs: **Model Comparison** (Claude vs Gemini builds with a link to `/gemini/`, the critique decision table, metrics, screenshots) | **Process Log** (models, services, prompts, decisions, iterations, from `docs/process-log.md`).
6. **Video & Transcript**: YouTube embed (`youtube-nocookie.com`), with the verbatim auto-transcript in a scrollable block below.
7. **References & Contributions**: generated from `data.js` (every value → source) plus a manual bibliography; contributions table (Andrew; Claude; Gemini; other tools).

Navigation: hash-routed tabs (`#simulator`). The tab bar scrolls horizontally under 640 px. A single `index.html` works from `file://` and on Netlify.

---

## 5. Architecture

### 5.1 Stack (pinned)
- Plain HTML/CSS/JS (ES modules), no build step, no backend.
- **Plotly** `plotly.js-dist-min@2.35.2` (jsDelivr or cdnjs), pinned.
- **KaTeX** `0.16.11` (CSS + JS + auto-render, jsDelivr), pinned. It renders synchronously, so live equation cards can re-render on every slider move.
- Dev only: Node ≥ 18 (`node --test`), Python 3 (reference script, standard library only), Playwright (browser test).

### 5.2 Code layout rule
All physics lives in **`js/model.js`**: pure functions, no DOM, importable by both the browser and Node. Property data lives in **`js/data.js`** (shared, provided). UI files only read inputs, call `simulate()`, and render.

### 5.3 `model.js` API contract (mandatory for both builds) [v2: 1A, 1B, 2, 4, 8a, 8b]
Units: T in °C, ΔT in K, P in kPa, mass flows in kg/h, specific energy in kJ/kg, power in kW, money in $.

```js
import { DATA } from './data.js';

// --- properties ---
export function psat(T_C)        // kPa. ANTOINE ONLY (constants in DATA.antoine), mmHg→kPa ×0.133322. No table interpolation. [v2: 1A]
export function tsat(P_kPa)      // °C. Exact algebraic inverse of the same Antoine equation.
export function hfg(T_C)         // kJ/kg. Linear interpolation in DATA.steamTable (NIST). Throw outside the table range.
export function solubility(T_C)  // g LiOH / 100 g H2O. Linear interpolation in DATA.solubility.
export function bpe({ s, T_C, i, activityFactor })
//   K. BPE = activityFactor * i * Kb * m, with m = (s/100)/0.02395 mol/kg and
//   Kb = R*(T_C+273.15)^2*Mw / (hfg(T_C)*Mw*1000), R = 8.314, Mw = 0.018015.
//   Kb is evaluated at the LIQUOR temperature T_b (no iteration). [v2: 2]

// --- unit models ---
export function massBalance({ F, xF, zF, T_C, purgeRatio, epsilon })
//   -> { C, V, P, xL, zML, liYield, productImpurity_ppm, closureError, feasible, warnings[] }
//   epsilon (adhering liquor, kg/kg crystals) affects ONLY productImpurity_ppm (M8).
//   It is NOT in the bulk balance M1–M6. [v2: 1B]
//   feasible=false (and no negative or NaN flows returned; set flows to null) if C<0, V<0, or xL<=0. [v2: 8a]
export function mvr({ V, Tb_C, BPE, dT_heater, etaIs, etaMotor, gamma })
//   -> { Tv_C, P1, Tc_C, P2, r, lift, ws, w, T2_C, Wshaft_kW, Welec_kW, kWh_per_t, COP, COP_carnot }
//   T2_C = discharge temperature (C7). [v2: 4]
export function multiEffect({ V, Q_kW, Ts_C, Tlast_C, N, BPE, dTmin, lambdaV })
//   -> { S, economy, dT_per_effect, feasible, maxFeasibleN }
//   maxFeasibleN = floor((Ts_C - Tlast_C) / (BPE + dTmin)); feasible = dT_per_effect >= dTmin. [v2: 8a]
export function economics({ kWh_per_t, economy, ce, cs, V, hours })
//   -> { cost_MVR_per_t, cost_ME_per_t, ce_crossover, annual_MVR, annual_ME }
export function simulate(inputs)   // merges DEFAULT_INPUTS with inputs, runs everything, returns one object (§5.4)
export const DEFAULT_INPUTS        // exactly the table in §5.4
```

### 5.4 `simulate(inputs)` keys and defaults (exact names) [v2: 8b]
Defaults are the hand-calc case (§7).

| Key | Default | Units | Slider range |
|---|---|---|---|
| `F` | 10000 | kg/h | 2000–50000 |
| `xF` | 0.060 | mass frac LiOH | 0.02–0.11 |
| `zF` | 0.0010 | mass frac impurity (NaOH-eq.) | 0–0.005 |
| `T_C` | 60 | °C (liquor/boiling) | 40–100 |
| `purgeRatio` | 0.05 | P/F | 0.005–0.20 |
| `epsilon` | 0.03 | kg liquor/kg crystals | 0–0.10 |
| `i` | 2 | – | fixed |
| `useOsmotic` | true | – | toggle **[P0-1]** |
| `activityFactor` | 1.0 | – (used only if `useOsmotic` is false) | 0.75–1.20 **[v2: 3]** |
| `dT_heater` | 6 | K | 1–15 |
| `etaIs` | 0.75 | – | 0.60–0.85 |
| `etaMotor` | 0.95 | – | 0.90–0.97 |
| `gamma` | 1.33 | – | fixed |
| `Ts_C` | 120 | °C (heating steam) | 100–150 |
| `Tlast_C` | 50 | °C (last-effect condenser) | 40–60 |
| `dTmin` | 5 | K | 3–10 |
| `N` | 3 | effects | 1–7 (results for 1, 3, 5 always computed too) |
| `ce` | 0.0721 (DATA) | $/kWh | 0.03–0.25 |
| `cs` | 7.33 (DATA) | $/t steam | 5–40 |
| `hours` | 8000 | h/yr | 4000–8760 |
| `U` (Phase 2) | 2000 | W/(m²·K) | 1000–3500 |
| `loadFraction` (Phase 2) | 1.0 | – | 0.5–1.1 |

`simulate()` returns `{ inputs, s, BPE, mass: massBalance(...), Q_kW, mvr: mvr(...), effects: {1:…, 3:…, 5:…, N:…}, econ: {1:…, 3:…, 5:…, N:…}, warnings: [] }`.
Q_kW = V · hfg(Tv_C) / 3600, with Tv_C = T_C − BPE.

---

## 6. Data values (source, and whether each is an estimate)

**No invented data.** Every value lives in `site/js/data.js` as `{ value, units, sourceId, estimate, note }`. Tables are arrays of points with one `sourceId`. **Format:** the file is `export const DATA = ` followed by strict JSON (double quotes, no comments or trailing commas), so the Python reference script can parse it. The References tab is generated from `DATA.sources`. Phase 0 verifies everything below. **Values marked "to verify" are working values; if verification changes one, rerun the reference script (§7.3) and the expected test values update automatically.**

### 6.1 LiOH solubility (stable solid LiOH·H2O over 0–100 °C; confirm)
| T (°C) | 0 | 20 | 40 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|
| g LiOH/100 g H2O (to verify) | 12.7 | 12.8 | 13.0 | 13.8 | 15.3 | 17.5 |

Sources: CRC Handbook, "Aqueous Solubility of Inorganic Compounds"; Linke & Seidell; Perry's; IUPAC-NIST Solubility Data Series. **Check specifically:** Gemini states CRC gives 12.4 at 20 °C (no source given) **[v2: 3]**. Linear interpolation. Simplification (stated on site): impurities don't change LiOH solubility.

### 6.2 BPE of LiOH(aq)
- Search Phase 0 for measured vapor-pressure, osmotic-coefficient, or BPE data for concentrated LiOH(aq).
- **Default (ESTIMATE):** ideal colligative (B1), i = 2, activityFactor slider 0.75–1.20 (default 1.0). ≈ 4.5 K at saturation, 60 °C.
- **Hypothesis to verify [v2: 3]:** Gemini claims LiOH has an unusually low osmotic coefficient (~0.75–0.85 at 4–5 mol/kg, from ion pairing), so the ideal estimate is too high (real ≈ 3.5–4 K). Only if a primary source confirms it: set the default activityFactor to the sourced value and tell the ideal-vs-real story on the Theory tab. Otherwise, mention it only as an open question.

### 6.3 Water/steam properties [v2: 1A]
- **P_sat and T_sat: Antoine only.** Water, mmHg/°C: A = 8.07131, B = 1730.63, C = 233.426, valid 1–100 °C. A second set for 100–374 °C: A = 8.14019, B = 1810.94, C = 244.485 (verify both from a cited source, e.g., Felder & Rousseau). Switch sets at 100 °C. The site states Antoine's error vs NIST: ≈ −0.38 % in P at 55–70 °C, which cancels in r.
- **h_fg: NIST Chemistry WebBook** saturation table, 30–150 °C in 5 °C steps, linear interpolation. Values to verify, kJ/kg: 55 °C 2370.7, 60 °C 2358.5, 120 °C 2202.6 (cross-check with Çengel/Seader steam tables and record the edition).
- R/M for water vapor = 461.5 J/(kg·K). γ = 1.33 (**ESTIMATE**, ideal gas). Molar masses: LiOH 23.95, H2O 18.015, LiOH·H2O 41.965 g/mol.
- Feed c_p ≈ 4.0 kJ/(kg·K) (**ESTIMATE**; the feed enters at T_b in the default case).
- Heat of crystallization: **neglected**, flagged on site.

### 6.4 Compressor, heater, multi-effect (all ESTIMATE; vendor literature GEA/Piller/SPX Flow, Perry's, Seader Ch. 17)
η_is 0.75; η_m 0.95; per-stage compression ratio (fans 1.2–1.4, single-stage centrifugal ~1.8–2; warn above 2); ΔT_heater 6 K; U (forced circulation) 2000 W/(m²·K); ΔT_min 5 K; T_s 120 °C; T_last 50 °C.

### 6.5 Prices
- Electricity: **EIA Electric Power Monthly Table 5.6.A**, Texas industrial, latest month (record it). Working value $0.07/kWh.
- Natural gas: EIA Natural Gas Monthly, Texas industrial.
- Steam: **ESTIMATE**, derived as c_s = gas $/GJ × (Δh_steam/η_boiler) + O&M adder, formula shown on the site. Working value $15/t.
- Equipment (Phase 2): Turton et al. (CAPCOST, App. A) or Seider et al. correlations, escalated by the latest CEPCI. **ESTIMATE ±30–50 %.**

### 6.6 Feed and product
Feed LiOH 6 wt % and Na 0.10 wt % NaOH-eq. (**ESTIMATES**; check patents US10961126B2 and CN108298569A, plus Veolia/Metso descriptions). Battery-grade spec from **GB/T 26008** or producer data sheets (no numbers until verified). ε = 0.03 (**ESTIMATE**).

### 6.7 Industry volumes
Tesla ~50 GWh/yr (EnergyX, Spectrum News, Electrek). kg LCE/kWh (IEA Global Critical Minerals Outlook / BNEF; **ESTIMATE**). 1 t LCE = 2 × 41.965/73.89 = **1.136 t LiOH·H2O**. Example: 50 GWh × 0.7 kg/kWh ≈ 35,000 t LCE ≈ 40,000 t LiOH·H2O/yr ≈ 5 t/h. Country and company shares: IEA, USGS Mineral Commodity Summaries. MVR market share 55–60 % (Meticulous Research, market estimate).

---

## 7. Hand-calculation verification case

Inputs are the `DEFAULT_INPUTS` in §5.4. All P_sat values use Antoine. Numbers below use the working data in §6. **After Phase 0, the authoritative expected values are whatever `tests/handcalc-expected.json` contains.**

### 7.1 Expected results (v1 numbers, SUPERSEDED by `docs/handcalc.md` [P0-6])
| Step | Result | Interpretation |
|---|---|---|
| m = (13.8/100)/0.02395 | 5.762 mol/kg | Concentrated: ~5.8 mol LiOH per kg water |
| K_b at 333.15 K, h_fg(60 °C) = 2358.5 | 0.3912 K·kg/mol | Smaller than 0.512 (the 100 °C value) because K_b ∝ T² |
| BPE | **4.51 K** | Liquor boils 4.5 K above pure water at the same pressure |
| T_v = T_b − BPE | 55.49 °C | |
| P1 | **16.08 kPa** | Vacuum operation |
| z_ML = z_F/p | 0.0200 | Impurity concentrates 20× in the mother liquor |
| x_L | 0.11884 | |
| P | 500 kg/h | |
| C | **947.2 kg/h LiOH·H2O** | |
| Li yield | **90.1 %** | 9.9 % of the Li leaves in the purge |
| V | **8,552.8 kg/h** | |
| Mass closure | < 1e−6 kg/h | |
| Product impurity (ε = 0.03) | ε z_ML/(1+ε) = 0.03 × 0.02/1.03 = **583 ppm** | Shows why washing matters: this would fail a battery spec, so ε (washing) is the lever |
| h_fg(55.49 °C) | 2369.5 kJ/kg | |
| Q | **5,629 kW** | |
| T_c, P2 | 66.0 °C, **26.08 kPa** | |
| r | **1.623** | One centrifugal stage |
| Lift = BPE + ΔT_heater | 10.51 K | BPE is 43 % of the lift |
| w_s | **79.08 kJ/kg** | |
| w | 105.4 kJ/kg | |
| **T2 (discharge)** | **116.7 °C** | ~50 K superheated above T_c: compression makes steam superheated, not wet **[v2: 4]** |
| W_elec | **263.7 kW** | |
| Specific energy | **30.83 kWh/t** | |
| COP, COP_Carnot | 22.5, 32.3 | |
| Single effect | S = 9,201 kg/h, economy **0.930** | |
| 3-effect (ideal) | economy 2.79, S = 3,067 kg/h, ΔT/effect = 18.8 K | |
| 5-effect (ideal) | economy 4.65, ΔT/effect = 9.49 K ≥ 5 → feasible | |
| maxFeasibleN | **7** = floor(70/(4.51 + 5)) | |
| $/t water: MVR / 1 / 3 / 5 effects | **2.16 / 16.14 / 5.38 / 3.23** | |
| Crossover c_e* vs 3-effect / 5-effect | **$0.174 / $0.105 per kWh** | |
| Annual: MVR vs 3-effect | $148k vs $368k | |
| *Phase 2:* heater area A = Q/(U ΔT) | 469 m² | |
| *Phase 2:* turndown at 75 % / 50 % load (fixed A) | ΔT 4.5 / 3.0 K → r 1.518 / 1.418 → **26.34 / 21.88 kWh/t** | Part load needs less driving force, so less lift and less energy per tonne |

### 7.2 Feasibility tests [v2: 8a]
- `purgeRatio` small enough that C would be negative (e.g., xF = 0.02, purgeRatio = 0.2) → `feasible:false`, flows `null`, no NaN.
- `T_C` = 60 °C, `N` = 8 → `effects.N.feasible === false`, `maxFeasibleN === 7`.
- BPE = 0 and dT_heater → 0 ⇒ r → 1, W → 0. N = 1 ⇒ economy = h_fg(T_s)/h_fg(T_v). BPE ↑ ⇒ W ↑ (monotonic). Mass closure < 1e−6 for 100 random feasible inputs.

### 7.3 How it is checked automatically [v2: 1A]
1. `tests/reference/handcalc_reference.py`: an **independent** Python implementation (standard library only) that parses `site/js/data.js` and writes **unrounded** expected values to `tests/handcalc-expected.json`. Written by Claude in Phase 0, *before* either build exists.
2. `tests/handcalc.test.mjs` (`node:test`): for each build directory (`site/`, `site/gemini/`), imports `js/model.js`, runs `simulate(DEFAULT_INPUTS)`, and asserts every expected key within **±0.5 %** plus the §7.2 cases. `npm test` runs it (`package.json` has no dependencies).
3. The browser test (§14) loads the "Hand-calc case" preset and compares the displayed values with the same JSON.

---

## 8. Equations (units + interpretation)

Level: Seader/Henley/Roper Ch. 17 plus standard thermodynamics. KaTeX on the Theory tab and in result cards.

### Mass balances
| # | Equation | Units | Interpretation |
|---|---|---|---|
| M1 | F = V + C + P | kg/h | Everything fed leaves as vapor, crystals, or purge. |
| M2 | F x_F = 0.5707 C + P x_L | kg LiOH/h | Lithium leaves only in crystals or purge, so a bigger purge means less product. |
| M3 | F z_F = P z_ML | kg/h | Impurities don't crystallize, so the purge is their only exit. |
| M4 | z_ML = z_F/p | – | The mother liquor concentrates impurity by 1/p. |
| M5 | x_L = (1 − z_ML) s/(100 + s) | – | Saturated liquor: the LiOH:water ratio is fixed by solubility at T. |
| M6 | F(1−x_F−z_F) = V + 0.4293 C + P(1 − x_L − z_ML) | kg/h | Water leaves as vapor, as hydrate water, or in the purge. |
| M7 | Yield = 0.5707 C/(F x_F) | – | Fraction of the incoming Li recovered. |
| M8 | Impurity ≈ ε z_ML/(1 + ε) | ppm | **Purity-only model:** the liquor film left on the crystals after the centrifuge carries impurity. Its mass is neglected in M1–M6. **[v2: 1B]** |
| M9 | Cooling yield = [s(T_hot) − s(T_cold)]/s(T_hot) | – | Flat solubility: cooling recovers little, so water must be evaporated. |

### Phase equilibrium, BPE, crystallization
| # | Equation | Units | Interpretation |
|---|---|---|---|
| B1 | BPE = a · i K_b m; K_b = R T_b² M_w/ΔH_vap | K | Dissolved ions lower water's vapor pressure, so the liquor must be hotter to boil at the same pressure. *K_b is taken at T_b for simplicity; strictly it's the pure-water boiling point (~3 % effect).* **[v2: 2]** |
| B2 | T_b = T_sat(P) + BPE | °C | **Non-volatile LiOH stays in the liquid, so the boiling liquor is at T_b. It makes pure water vapor at pressure P, superheated by BPE above that vapor's condensation point T_sat(P).** **[v2: 6]** |
| B3 | log10 P_sat[mmHg] = A − B/(C + T[°C]) | – | Higher T → higher vapor pressure. The compressor raises P so the vapor condenses hotter. |
| B4 | S = c/c*, σ = (c − c*)/c* | – | Driving force for crystallization: how far above saturation the liquor is. |
| B5 | Schematic: binodal (solubility, c*) < metastable limit < spinodal | – | **Below c*:** crystals dissolve. **Metastable zone:** existing (seed) crystals grow, but new nuclei rarely form, so seeding controls size. **Above the metastable limit:** a nucleation shower → fines. **Spinodal:** the thermodynamic limit where phase separation needs no nucleation barrier. *The metastable width is kinetic; the spinodal is thermodynamic. Drawn SCHEMATIC, no LiOH data.* **[v2: 5]** |

### Energy
| # | Equation | Units | Interpretation |
|---|---|---|---|
| E1 | Q ≈ V h_fg(T_v) + F c_p (T_b − T_F) | kW | Almost all the energy goes into boiling water off. *Approximation: vapor superheat (BPE) and the heat of crystallization are neglected (~0.4 %).* **[v2: 2]** |
| E2 | S = Q/h_fg(T_s); E = V/S | kg/h; – | One kg of steam boils about one kg of water. |
| E3 | E_N ≈ N E_1 (ideal) | – | Each effect's vapor heats the next, so the latent heat is reused N times (an upper bound). |
| E4 | ΔT per effect = (T_s − T_last − N·BPE)/N ≥ ΔT_min | K | **In each effect, vapor leaves the liquor at T_b,k but condenses in the next heater only at T_b,k − BPE, so BPE is subtracted from the usable driving force in every stage.** **[v2: 6]** |

### MVR compressor
| # | Equation | Units | Interpretation |
|---|---|---|---|
| C1 | T_c = T_b + ΔT_heater; P2 = P_sat(T_c); P1 = P_sat(T_b − BPE) | °C, kPa | The vapor must be compressed until it condenses hotter than the liquor it heats. |
| C2 | r = P2/P1 | – | Set by the required lift (BPE + ΔT_heater). |
| C3 | w_s = [γ/(γ−1)] (R/M) T_1 [r^((γ−1)/γ) − 1] | kJ/kg | Work grows with the lift, not with the latent heat recycled. **It scales with T_1 and R/M because hotter, lighter vapor has a larger specific volume (v = RT/(PM)), so more ∫v dP work is needed per kg for the same pressure ratio.** **[v2: 6]** Units: J/(kg·K) × K = J/kg. |
| C4 | w = w_s/η_is; W = V w/η_m | kJ/kg; kW | Real machines and motors lose some work as heat. |
| C5 | kWh/t = w/(3.6 η_m) | kWh/t | The plant-comparison number (vendor range 20–60, ESTIMATE). |
| C6 | COP = h_fg/w; COP_Carnot = T_c/(T_c − T_v) | – | A heat pump: ~22 units of heat moved per unit of work, because only the lift is paid for. |
| C7 | T_2 = T_1 [1 + (r^((γ−1)/γ) − 1)/η_is] | K | **Compression superheats steam (≈117 °C out vs 66 °C condensing); it doesn't make it wet. Liquid reaches the compressor only as entrained mist or foam (erosion, LiOH carry-over), or deliberately as condensate spray to desuperheat.** **[v2: 4]** |
| C8 | Heat to heater ≈ h_g(T_v) + c_p,v BPE + w − h_f(T_c) ≈ 2440 kJ/kg vs ≈ 2359 needed | kJ/kg | **The compressor work doesn't disappear: it shows up as ~3 % surplus heat, used for feed preheat and losses, or vented.** Q&A only, not a slider. **[v2: 2]** |

### Economics
| # | Equation | Units | Interpretation |
|---|---|---|---|
| $1 | cost_MVR = c_e · kWh/t | $/t | You pay only for the lift. |
| $2 | cost_N = c_s/E_N | $/t | You pay for steam, divided by the number of reuses. |
| $3 | c_e* = c_s/(E_N · kWh/t) | $/kWh | Below this electricity price, MVR is cheaper to run. |
| $4 | Annual = cost/t × V × hours/1000 | $/yr | Scales to the plant. |
| $5 (Ph 2) | A = Q/(U ΔT_heater) | m² | A small ΔT saves power but needs a huge heater. |
| $6 (Ph 2) | TAC = CRF(C_comp + C_HX) + operating cost | $/yr | The best ΔT minimizes total cost, not just energy. |
| $7 (Ph 2) | Turndown at fixed A: Q = f Q_design, ΔT = f ΔT_design (U assumed constant, ESTIMATE) | K | **At part load the same heater needs less driving force, so less lift, so fewer kWh/t.** **[v2: 7b]** No compressor surge maps (beyond level). |

---

## 9. Plots and "what if?"

| Plot | x | y | "What if?" |
|---|---|---|---|
| P1 Solubility | T | g/100 g (data + interpolation) **+ schematic metastable / spinodal bands, seeding annotation [v2: 5]** | Cool instead of evaporate? Where should the liquor operate? |
| P2 BPE vs concentration | molality | BPE (ideal ± activity band; measured data if found) | More concentrated liquor? |
| P3 Lift breakdown | stacked bar | BPE + ΔT_heater | How much of the compressor's job is BPE? |
| P4 Power vs BPE | BPE 0–15 K | kWh/t, r, T2 | Why does BPE hurt MVR? |
| P5 Energy comparison | 1/3/5/MVR | primary energy/t and $/t (conversion factors stated) | Which uses least? |
| P6 Crossover map | $/kWh | $/t steam, regions shaded, Texas EIA point | Electricity price changes? |
| P7 Purge trade-off | p | yield %, impurity ppm (per ε), spec line | Purity vs yield? |
| P8 Mass-flow bar/Sankey | – | F → V, C, P | Where does it go? |
| P9 (Ph 2) ΔT optimum | ΔT_heater | annualized compressor + HX + total cost | Why not a tiny ΔT? |
| P10 (Ph 2) Turndown | load 50–110 % | kWh/t, r, $/t (fixed A) | Part load? |
| P11 Multi-effect feasibility | N | ΔT/effect vs ΔT_min line | How many effects can this brine support? |

Infeasible states show a visible warning on the card and grey out the plot point. No NaN is ever displayed.

---

## 10. Folder structure

```
seperations/
├── CLAUDE.md  README.md  netlify.toml  package.json
├── context/                       # course context (no textbook, no full transcripts)
├── docs/
│   ├── PLAN_PROMPT.md  HANDOFF.md
│   ├── plan-v1-claude.md  critique-v1-gemini.md  critique-decisions.md
│   ├── plan-v2-final.md           # this file
│   ├── build-prompt.md            # identical Phase 1 prompt for both models
│   ├── handcalc.md  comparison.md  qa-prep.md  process-log.md
│   └── screenshots/{claude,gemini,verification}/
├── site/                          # Netlify publish root = Claude build + documentation site
│   ├── index.html  css/style.css
│   ├── js/{model.js, data.js, charts.js, ui.js, pfd.js}
│   └── gemini/                    # Gemini build, served at /gemini/ — never edited by Claude
│       ├── index.html  css/  js/{model.js, data.js (copy), ...}
├── tests/
│   ├── reference/handcalc_reference.py
│   ├── handcalc-expected.json
│   ├── handcalc.test.mjs
│   └── browser-smoke.mjs
└── presentation/mvr-crystallizer.pptx
```
Branches: `main` is deployed. Claude's work goes on `claude/...`; Gemini's goes on `gemini/mvp` and touches only `site/gemini/`. Netlify branch deploys preview each.

---

## 11. Q&A preparation (`docs/qa-prep.md`)
- **Why does MVR save energy if electricity costs more than steam?** Only the lift is paid for (COP ≈ 22). → P5, C6
- **What limits r?** Per-stage limits (fans 1.2–1.4, centrifugal ~2), huge vapor volumes at vacuum, and droplets/foam eroding the impeller. → P4
- **Why does BPE hurt MVR more than multi-effect?** MVR: BPE adds directly to the lift (43 % here), and work scales with lift. Multi-effect: BPE eats ΔT, which costs area or effects, but economy per effect is roughly unchanged. → P3, P4, P11
- **Is the vapor wet in the compressor?** No. Compression superheats it to ~117 °C. Liquid comes only from entrained mist or foam, or desuperheating spray. → C7
- **Where does the compressor work go?** Into the heater as ~3 % surplus heat. → C8
- **Why does crystal size matter?** Too small: slow centrifuging, more retained liquor (ε) → more impurity, dust. Too large: liquid inclusions, breakage, longer residence. → Theory card, P7
- **What are binodal and spinodal?** → B5, P1
- **Where do impurities go?** Out the purge (M3), plus a little in the adhering liquor (M8). → P7
- **Why not cooling crystallization?** Flat solubility (M9). → P1
- **Compression is the most energy-intensive operation in industry (Lecture 13). Why use it?** It replaces boiling with fresh steam: 5,629 kW of steam heat vs 264 kW of electricity in the hand calc (~21× in delivered energy, roughly 8× on a primary-energy basis if grid electricity takes ~2.5 units of fuel per unit, an ESTIMATE).

---

## 12. Two-model build and comparison [v2: 9]

1. **Identical inputs:** each model gets `docs/build-prompt.md` + this file + `site/js/data.js`, in a **fresh session**, starting in plan mode. Andrew records each model's plan-mode questions and answers them the same way.
2. Claude Code → `site/`. Gemini (Gemini CLI) → `site/gemini/`.
3. **Comparison metrics** (`docs/comparison.md` and the AI Workflow tab):

| Metric | How measured |
|---|---|
| Correctness | `npm test` pass count, first run and final |
| First-run bugs | Console errors, broken tabs, `.katex-error` count at the first browser test |
| Fix iterations | Follow-up prompts until green |
| Time | Wall-clock, first prompt to green |
| Level discipline | Anything beyond 3rd-year? (examples) |
| Data honesty | Uncited or invented numbers found |
| Explanation quality | Do the interpretations answer "how does that make sense?" (Andrew's rating with examples) |
| Chart readability | Axis labels/units, dual-axis clarity, legends, at 375 px and 1280 px |
| Mobile layout | Horizontal scroll at 375 px? |
| Code clarity | model.js lines, physics/UI separation |
| **Critique accuracy** | Gemini's critique was right on T2 and the ε inconsistency, but wrong on its "critical" Antoine claim (arithmetic slip, see `critique-decisions.md`) |

Andrew approved every critique decision himself, which limits Claude's home-field advantage as both author and merger.

---

## 13. Critique status
Done. See `critique-v1-gemini.md` (verbatim) and `critique-decisions.md` (approved 2026-11-13).

---

## 14. Verification

1. **Units:** `docs/handcalc.md` has a dimensional-analysis line for every equation in §8.
2. **Hand-calc test:** `npm test` green on both builds; results recorded.
3. **Cross-check:** compressor work, C3 (ideal gas) vs a NIST steam-table isentropic enthalpy difference for the hand-calc case. Report the % difference on the Theory tab.
4. **Browser smoke test** (`tests/browser-smoke.mjs`, Playwright/Chromium, served with `python3 -m http.server -d site`; takes a base URL argument so it can also run against Netlify):
   - Every tab and sub-tab: visible content, **zero console errors**.
   - **Zero `.katex-error`** and at least N `.katex` elements on Theory and Simulator.
   - Every Plotly container has `.main-svg`.
   - Each slider: changing it changes at least one chart trace or card value.
   - "Hand-calc case" preset: displayed values match `handcalc-expected.json` within ±0.5 %.
   - Infeasible preset (§7.2): a warning is shown and no "NaN" text appears anywhere on the page.
   - Screenshots at **1280×800 and 375×812** for every tab → `docs/screenshots/verification/<date>/`. Same for `/gemini/`.
   - No horizontal scroll at 375 px.
5. **Manual:** Andrew checks the live URL on a phone and a laptop; checklist in the process log.
6. **Data audit:** a script lists any value in `data.js` without a `sourceId`. It must print nothing.

---

## 15. Documentation workflow
- Append to `docs/process-log.md` at the end of every session (template inside it).
- Save prompts, the build prompt, the comparison, and dated screenshots of notable moments (first broken render, the fix).
- Never commit the textbook, full lecture transcripts, or personal information.

---

## 16. Deployment (Netlify from GitHub)
1. `netlify.toml`: `[build] publish = "site"`, `command = ""`.
2. Netlify → Add new site → Import from Git → GitHub → `be-aa8/seperations`, production branch `main`.
3. Turn on deploy previews and branch deploys (`claude/*`, `gemini/*`).
4. Site name, e.g., `mvr-crystallizer-explorer.netlify.app`.
5. After each production deploy, run the browser smoke test against the live URL.
6. YouTube: Unlisted or Public **by Dec 4**. Paste the auto-transcript verbatim into the Video & Transcript tab (`site/transcript.txt`).

---

## 17. Risks
| Risk | Mitigation |
|---|---|
| No measured LiOH BPE data | ESTIMATE flag + activity slider; ideal-vs-real as a learning point |
| Equations fail to render | Pinned KaTeX, `.katex-error` assertion, screenshots |
| A build diverges from the API | Contract + exact input keys in the build prompt; if it still diverges, a thin adapter, recorded as a finding |
| Phase 0 slipped 2 days | Re-baselined schedule; Phase 3 removed; cut order in §2 |
| Transcript delay | Upload by Fri Dec 4 |
| Over-complication | 3rd-year constraint in every prompt; level discipline is a comparison metric |
