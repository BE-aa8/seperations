# Plan v1 — MVR Crystallizer Explorer (Claude)

**Author model:** Claude (Opus 5.5) in Claude Code, plan session of 2026-11-09
**Prompt:** `docs/PLAN_PROMPT.md` (verbatim). Answers to the clarifying questions are in §0.
**Status:** Draft for critique. A second model (Gemini) will critique it next. Changes go into `plan-v2-final.md`, along with an accept/reject table.
**Audience:** written so a different AI model can follow it without access to the chat that produced it.

---

## 0. Decisions from the clarifying questions

| Question | Answer | Effect on this plan |
|---|---|---|
| Individual or group? | **Individual** (50 pts, recorded in-class talk + detailed technical Q&A) | One person's time budget. Q&A prep gets its own deliverable (§11). The contributions section lists Andrew plus each AI tool and what it did. |
| Second model (critique + second build) | **Gemini** (critique in the Gemini app; second build with Gemini CLI or Gemini in an IDE) | §13 is the critique prompt for Gemini. The Gemini build goes in `site/gemini/`. |
| Different platform for the second build? | **No, same stack** (HTML/CSS/JS + Plotly + KaTeX) | The comparison isolates the **model**, not the platform. Both builds implement the same `model.js` API contract (§5.3), so one automated test checks both. |
| Polish vs. physics | **Physics first** | Clean, readable, mobile-friendly design. No animation or custom illustration until Phase 3. Most effort goes to equations, interpretations, data citations, and Q&A. |
| Deadline | **Presentation Mon Dec 7, 2026** (today is Mon Nov 9: 4 weeks) | Phases are scheduled in §2. The YouTube video must be uploaded by **Fri Dec 4** so the auto-transcript exists in time. Thanksgiving (Thu Nov 26) is a buffer. |

---

## 1. Goal in one paragraph

A public, static website that teaches **why lithium refineries such as Tesla's Robstown, TX plant crystallize battery-grade LiOH·H2O in MVR-driven evaporative crystallizers**. The site opens with industrial significance, then covers theory and terminology, then gives an interactive simulator. The simulator compares a single-effect evaporator, an N-effect evaporator, and MVR on the same feed. It shows how boiling point elevation (BPE) erodes MVR's advantage, where the electricity-vs-steam price crossover lies, and how the mother-liquor purge trades lithium yield against product purity. Every number shows its equation, units, and a one-line "how does that make sense?" interpretation. Every calculation has a plot.

---

## 2. Phases and schedule (fit to Dec 7)

| Phase | Dates (2026) | What | Exit criterion |
|---|---|---|---|
| **0. Plan, critique, data** | Mon Nov 9 – Wed Nov 11 | This plan → Gemini critique → accept/reject table → `plan-v2-final.md`. Verify every data value in §6 against its source and fill `site/js/data.js`. Re-run the hand calc (§7) with the verified values. | Plan v2 committed. Every value has a source or an "ESTIMATE" flag. The hand calc in `docs/handcalc.md` is final. |
| **1. MVP (both models)** | Thu Nov 12 – Thu Nov 19 | Claude builds Phase 1 in `site/`. Gemini builds Phase 1 in `site/gemini/` from the **same plan v2 and the same prompt** (Nov 16–19, can overlap). | Both builds pass `node --test` (the hand-calc test) and the browser smoke test. Record bugs and fix iterations for each build. |
| **2. Enhancements (Claude build only)** | Fri Nov 20 – Wed Nov 25 | Clickable PFD, heater-ΔT optimization with capital cost, turndown scenarios, annual economics. | Every new calculation has an equation card and a plot, and the tests still pass. |
| **Buffer** | Thu Nov 26 – Sat Nov 28 | Thanksgiving. Catch up, or start Phase 3. | n/a |
| **3. Stretch (only if Phase 2 is done)** | Sat Nov 28 – Sun Nov 29 | Operating-problem cards, MSMPR crystal-size panel, shareable URL state. | Optional |
| **4. Verification + comparison** | Sun Nov 29 – Tue Dec 1 | Full verification (§10). Write the model comparison (§12). Screenshots. | Verification checklist all green. `docs/comparison.md` written. |
| **5. Slides, video, transcript, deploy** | Tue Dec 1 – Sun Dec 6 | PowerPoint by Dec 2. Record and upload to YouTube **by Fri Dec 4**. Paste the auto-transcript Dec 5. Final deploy and phone check Dec 6. | Live Netlify URL with video and transcript. Q&A sheet rehearsed. |
| **Present** | **Mon Dec 7** | | |

If behind schedule, cut in this order: Phase 3 entirely → turndown scenarios → capital-cost optimization (keep the operating-cost crossover) → clickable PFD (keep a static labeled SVG).

---

## 3. Simulator features → phases

Feature numbers follow `docs/HANDOFF.md`.

| # | Feature (HANDOFF) | Phase 1 MVP | Phase 2 | Phase 3 stretch |
|---|---|---|---|---|
| 2 | **Energy comparison**: 1 / 3 / 5 effects vs MVR (compressor work, kWh/t, steam economy) | Full | Add turndown: feed-rate sweep at fixed equipment | n/a |
| 3 | **BPE panel**: BPE → required lift → compression ratio → power | Full | n/a | n/a |
| 6 | **Solubility panel**: flat LiOH solubility curve → evaporative crystallization needed | Full (data points + interpolation + "cooling vs evaporating" yield comparison) | n/a | Schematic metastable-zone band (labeled schematic) |
| 5 | **Mass balance with impurity purge**: yield vs purity | Full (closed-form steady state) | Adhering mother-liquor slider tied to product spec line | n/a |
| 4 | **Economic crossover**: electricity $/kWh vs steam $/t | Operating cost per tonne + crossover map | Capital cost (compressor + heat-exchanger area) and heater-ΔT optimum; annualized cost over the operating range | n/a |
| 1 | **Clickable process flow diagram** | Static labeled SVG with stream values printed on it | Clickable units → side panel with that unit's equations and live values | Flow-animation polish |
| 7 | **Operating-problem cards** (foaming, Li2CO3 scaling) | n/a | n/a | Cards with patent citations and what each does to the model (e.g., fouling lowers U) |
| new | **Crystal size (MSMPR)**: residence time → dominant size | n/a | n/a | Simple MSMPR panel, only if it stays at Seader Ch. 17 level |

---

## 4. Site structure (follows the professor's presentation order)

The Lecture 12 order is **significance → real process → theory and terminology → tool**. The tabs follow it:

1. **Overview**: a one-screen hook (battery demand → LiOH·H2O → crystallizer energy), what the site does, a "this is an AI project" banner linking to the Process Log, the video embed, and **What I learned / what I want to learn next** (required by item 4).
2. **Industry Context** (significance + real process): what LiOH·H2O is for (high-nickel cathodes); Tesla Robstown process steps (spodumene → kiln → alkaline leach → purification → crystallization); a production-volume estimate with the arithmetic shown (§6.7); dominant countries and companies (China's refining share; Tesla, Albemarle, Ganfeng, Tianqi, etc., each cited); Veolia's MVR crystallizers; MVR market share (flagged as a market-research estimate); why the US wants domestic refining.
3. **Theory**: evaporation as a single-stage VLE separation; BPE; steam economy and multiple effects; MVR as a heat pump; solubility, supersaturation (S, σ), metastable zone; binodal vs spinodal; nucleation vs growth; seeding; why crystal size matters (too small: slow centrifuging, more retained mother liquor → impurities, dust; too large: liquid inclusions trap impurities, breakage, longer residence time); impurity purge. A terminology glossary. Equations rendered in KaTeX.
4. **Simulator**: input sliders (left on desktop, top on mobile) → result cards (equation + value + units + interpretation) → plots. Presets: "Hand-calc case", "High BPE", "Cheap electricity (Texas)", "Expensive electricity".
5. **Model Comparison**: Claude vs Gemini builds (link to `/gemini/`), the critique accept/reject table, comparison metrics (§12), side-by-side screenshots.
6. **AI Process Log**: rendered from `docs/process-log.md` (copied at build time, or pasted as HTML): models, services, prompts, decisions, iterations.
7. **Video**: YouTube embed and link.
8. **Transcript**: the verbatim YouTube auto-transcript in a scrollable `<pre>`-style block.
9. **References & Contributions**: auto-generated from `data.js` (every value → source) plus a manual bibliography; contributions table (Andrew; Claude; Gemini; other tools).

Navigation: a hash-routed tab bar (`#simulator`), collapsing to a select menu or scrollable bar under 640 px. One `index.html` so it works from `file://` and on Netlify.

---

## 5. Architecture

### 5.1 Stack (pinned versions)
- Plain HTML/CSS/JS (ES modules), no build step, no backend.
- **Plotly** `plotly.js-dist-min@2.35.2` from cdnjs or jsDelivr, pinned.
- **KaTeX** `0.16.11` (CSS + JS + auto-render) from jsDelivr, pinned. Chosen over MathJax because it renders synchronously, fast enough to re-render live equation cards on every slider move.
- Node ≥ 18 (built-in `node --test`) for unit tests. Playwright (pre-installed in the dev container) for browser checks. Neither is needed by the deployed site.

### 5.2 Code layout rule
All physics lives in **`model.js`**: pure functions, no DOM, importable by both the browser and Node. UI files only read inputs, call `model.simulate()`, and render. This keeps the hand-calc test independent of the UI and lets the same test grade both builds.

### 5.3 `model.js` API contract (both builds must export exactly this)
```js
// units: T in °C, P in kPa, mass flows in kg/h, energy in kJ/kg, power in kW
export function solubility(T_C)              // g LiOH per 100 g H2O (interpolated from data.js)
export function psat(T_C)                    // kPa, saturation pressure of pure water
export function tsat(P_kPa)                  // °C, inverse of psat
export function hfg(T_C)                     // kJ/kg, latent heat of pure water (interpolated steam table)
export function bpe({ s, T_C, i, activityFactor }) // K
export function massBalance({ F, xF, zF, T_C, purgeRatio, epsilon })
//   -> { C, V, P, xL, zML, liYield, productImpurity_ppm, closureError }
export function mvr({ V, Tb_C, BPE, dT_heater, etaIs, etaMotor, gamma })
//   -> { Tv_C, P1, Tc_C, P2, r, lift, ws, w, Wshaft_kW, Welec_kW, kWh_per_t, COP, COP_carnot }
export function multiEffect({ V, Q_kW, Ts_C, Tlast_C, N, BPE, dTmin, lambdaV })
//   -> { S, economy, dT_per_effect, feasible, maxFeasibleN }
export function economics({ kWh_per_t, economy, ce, cs, V, hours })
//   -> { cost_MVR_per_t, cost_ME_per_t, ce_crossover, annual_MVR, annual_ME }
export function simulate(inputs)             // runs everything, returns one results object
```
Every returned number is plain SI-ish as listed. The UI does the formatting.

---

## 6. Data values needed (source, and whether each is an estimate)

Rule: **no invented data.** Every value lives in `site/js/data.js` as
`{ value, units, sourceId, estimate: true|false, note }`, and the References tab is generated from that file, so an uncited value cannot appear on the site. Values marked "to verify" below are working values from standard tables. Phase 0 checks each one against the cited source and updates the hand calc if anything changes.

### 6.1 LiOH solubility vs temperature (solid phase LiOH·H2O)
| T (°C) | 0 | 20 | 40 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|
| g LiOH / 100 g H2O (to verify) | 12.7 | 12.8 | 13.0 | 13.8 | 15.3 | 17.5 |

- Sources: *CRC Handbook of Chemistry and Physics*, "Aqueous Solubility of Inorganic Compounds"; Linke & Seidell, *Solubilities of Inorganic and Metal-Organic Compounds*; *Perry's Chemical Engineers' Handbook* solubility table; and the IUPAC-NIST Solubility Data Series if accessible. Also confirm that LiOH·H2O (not anhydrous LiOH) is the stable solid over 0–100 °C.
- Not an estimate once verified. Linear interpolation between points (state this on the site).
- Simplification to flag: impurities (Na, K) are assumed not to change LiOH solubility (salting-out is neglected).

### 6.2 Boiling point elevation of LiOH(aq)
- Phase 0 searches first for measured vapor-pressure or BPE data for concentrated LiOH solutions (journal data, Perry's, or Dühring-chart data).
- **Fallback (ESTIMATE):** the ideal colligative relation (§8, Eq. B1) with van 't Hoff i = 2 and an "activity correction" slider (default 1.0, range 0.7–1.5), labeled clearly as an estimate. At saturation near 60 °C this gives about 4.5 K.
- If measured data are found, use them and keep the colligative curve on the BPE plot for comparison. That makes a good "how does that make sense?" moment: ideal vs real electrolytes.

### 6.3 Water/steam properties
- Saturation pressure, saturation temperature, and h_fg from the **NIST Chemistry WebBook (fluid properties, water)**, tabulated 30–150 °C in 5 °C steps in `data.js`, linearly interpolated. Cross-checked against the steam tables in Seader/Henley/Roper or Çengel.
- An Antoine equation for water (constants from a cited source, e.g., A = 8.07131, B = 1730.63, C = 233.426, mmHg/°C, valid 1–100 °C) is used in the hand calc and as a smooth fallback. The site must state its validity range.
- Water vapor gas constant R/M = 461.5 J/(kg·K) (8.314 / 0.018015). Heat-capacity ratio γ ≈ 1.33 for low-pressure steam (**ESTIMATE**, ideal-gas approximation; Phase 4 cross-checks compressor work against steam-table enthalpies).
- Molar masses (IUPAC atomic weights): LiOH 23.95, H2O 18.015, LiOH·H2O 41.965 g/mol.
- Feed/liquor heat capacity ≈ 4.0 kJ/(kg·K) (**ESTIMATE**, only used when feed is sub-cooled; minor).
- Heat of crystallization of LiOH·H2O: **neglected in MVP** and flagged. Phase 2 may add it from NBS/NIST thermochemical tables if a value is found.

### 6.4 Compressor and heater
| Quantity | Working value | Range on slider | Source | Estimate? |
|---|---|---|---|---|
| Isentropic efficiency η_is | 0.75 | 0.60–0.85 | MVR vendor literature (GEA, Piller, SPX Flow/APV), Perry's compressor section | **ESTIMATE** |
| Motor/drive efficiency η_m | 0.95 | 0.90–0.97 | Perry's, motor-efficiency standards (NEMA Premium) | ESTIMATE |
| Compression ratio per stage | fans 1.2–1.4; single-stage centrifugal up to ~1.8–2 | show warning above 2 | Vendor literature | **ESTIMATE** |
| Heater (condensing-side) ΔT | 6 K | 2–15 K | Vendor literature / Seader Ch. 17 | **ESTIMATE** |
| Overall U, forced-circulation evaporator (Phase 2) | 2000 W/(m²·K) | 1000–3500 | Perry's / Seader evaporator U table | **ESTIMATE** |
| ΔT_min per effect for multi-effect | 5 K | 3–10 K | Textbook rule of thumb | ESTIMATE |
| Heating steam temperature (multi-effect) | 120 °C | 100–150 | Typical low-pressure plant steam | ESTIMATE |
| Last-effect condenser temperature | 50 °C | 40–60 | Cooling-water limited | ESTIMATE |

### 6.5 Prices
| Quantity | Working value | Source | Estimate? |
|---|---|---|---|
| Industrial electricity, Texas | $0.07/kWh (slider 0.03–0.25) | **EIA Electric Power Monthly, Table 5.6.A** (latest month, Texas industrial). Record the month accessed. | Data (value updated in Phase 0) |
| Natural gas, Texas industrial | from EIA Natural Gas Monthly | EIA | Data |
| Steam cost | $15/t (slider 5–40) | **Derived (ESTIMATE):** c_s = (gas price $/GJ) × (Δh_steam / η_boiler) + O&M adder. Formula shown on the site. | **ESTIMATE** |
| Equipment cost (Phase 2) | Compressor (centrifugal) and shell-and-tube/evaporator area correlations | Turton et al., *Analysis, Synthesis, and Design of Chemical Processes*, Appendix A (CAPCOST), or Seider et al., *Product and Process Design Principles*; escalated with the latest **CEPCI** (Chemical Engineering magazine) | **ESTIMATE** (±30–50 %, stated) |

### 6.6 Feed and product specs
- Purified-liquor LiOH concentration going to the crystallizer: working value 6 wt % (**ESTIMATE**). Phase 0 checks the patent literature (US10961126B2, CN108298569A) and Veolia/Metso descriptions for a cited range.
- Na impurity in feed: 0.10 wt % as NaOH-equivalent (**ESTIMATE**; check the same patents).
- Battery-grade LiOH·H2O spec (minimum LiOH content; Na, K, Ca, Cl, SO4, CO3 limits): from **GB/T 26008** (Chinese battery-grade standard) or producer data sheets (Albemarle, Livent/Arcadium). Draw it as a horizontal "spec" line on the purity plot. No numbers until verified.
- Adhering mother liquor after centrifuge/wash, ε = kg liquor / kg crystals: 0.03 (**ESTIMATE**, slider 0–0.10).

### 6.7 Industry volumes (Industry tab)
- Tesla Robstown target ~50 GWh/yr of battery capacity (EnergyX, Spectrum News, Electrek; already in HANDOFF sources).
- Lithium intensity, kg LCE per kWh of cells (IEA *Global Critical Minerals Outlook* or BNEF; **ESTIMATE**, chemistry-dependent).
- Conversion shown on the site: 1 t LCE (Li2CO3, 73.89 g/mol, 2 Li) = 2 × 41.965 / 73.89 = **1.136 t LiOH·H2O**. Example: 50 GWh × 0.7 kg LCE/kWh (estimate) ≈ 35,000 t LCE/yr ≈ 40,000 t LiOH·H2O/yr ≈ 5 t/h at 8,000 h/yr.
- Global LiOH production, refining share by country, top companies: IEA Global Critical Minerals Outlook, USGS Mineral Commodity Summaries (Lithium), with each figure cited.
- MVR ≈ 55–60 % of the evaporator/crystallizer market: Meticulous Research (labeled a market-research estimate).

---

## 7. Hand-calculation verification case

Full worked case in `docs/handcalc.md` (written in Phase 0, with the verified property values). **The numbers below use the working values from §6 and will be recomputed if Phase 0 changes any input.**

### 7.1 Inputs
| Symbol | Value | Meaning |
|---|---|---|
| F | 10,000 kg/h | Purified liquor feed (fed at the boiling temperature, so no sensible-heat term) |
| x_F | 0.060 | LiOH mass fraction in feed |
| z_F | 0.0010 | Impurity (NaOH-equivalent) mass fraction in feed |
| T_b | 60 °C | Crystallizer liquor (boiling) temperature |
| p = P/F | 0.05 | Purge ratio |
| s(60 °C) | 13.8 g/100 g H2O | Solubility |
| i, activity factor | 2, 1.0 | BPE estimate |
| ΔT_heater | 6 K | MVR heater driving force |
| η_is, η_m, γ | 0.75, 0.95, 1.33 | Compressor |
| T_s, T_last | 120 °C, 50 °C | Multi-effect steam / last condenser |
| c_e, c_s | $0.07/kWh, $15/t | Prices |
| Hours | 8,000 h/yr | |

### 7.2 Step-by-step results (to be reproduced by the simulator)
| Step | Result | Interpretation |
|---|---|---|
| Molality at saturation m = (13.8/100)/0.02395 | 5.762 mol/kg | Concentrated: about 5.8 mol LiOH per kg water |
| K_b at 333.15 K = R T² M_w / ΔH_vap (ΔH_vap = 2358.5 kJ/kg × 0.018015) | 0.3912 K·kg/mol | Smaller than the familiar 0.512 because K_b scales with T² |
| BPE = i K_b m | **4.51 K** | Liquor boils 4.5 K above pure water at the same pressure |
| Vapor saturation temperature T_v = T_b − BPE | 55.49 °C | |
| P1 = P_sat(55.49 °C) (Antoine) | **16.08 kPa** | Crystallizer runs under vacuum |
| z_ML = z_F / p | 0.0200 | Impurity concentrates 20× in the mother liquor |
| x_L = (1 − z_ML) s/(100 + s) | 0.11884 | LiOH mass fraction in mother liquor |
| P = pF | 500 kg/h | |
| C = (F x_F − P x_L) / 0.57071 | **947.2 kg/h LiOH·H2O** | 0.57071 = LiOH mass fraction in the hydrate |
| Li yield = 0.57071 C / (F x_F) | **90.1 %** | 9.9 % of the lithium leaves in the purge |
| V = F(1−x_F−z_F) − 0.42929 C − P(1 − x_L − z_ML) | **8,552.8 kg/h** | Most of the water must be boiled off |
| Mass closure V + C + P − F | 0 (< 1e−9) | |
| h_fg(55.49 °C) (steam-table interpolation) | 2369.5 kJ/kg | |
| Q = V h_fg | **5,629 kW** | Heat that must be delivered to the boiling liquor |
| T_c = T_b + ΔT_heater | 66.0 °C | Compressed vapor must condense hotter than the liquor |
| P2 = P_sat(66 °C) | **26.08 kPa** | |
| r = P2/P1 | **1.623** | Within one centrifugal stage |
| Saturation lift T_c − T_v = BPE + ΔT_heater | 10.51 K | BPE is 43 % of the lift |
| w_s = γ/(γ−1) (R/M) T_1 [r^((γ−1)/γ) − 1], T_1 = 333.15 K | 79.08 kJ/kg | |
| w = w_s/η_is | 105.4 kJ/kg | |
| W_elec = V w / η_m | **263.7 kW** | |
| Specific energy | **30.8 kWh/t water** | |
| COP = h_fg / w | 22.5 | Each kJ of shaft work moves about 22 kJ of latent heat |
| Carnot COP = T_c/(T_c − T_v) (K) | 32.3 | The real machine reaches about 70 % of the ideal |
| Single effect: S = Q / h_fg(120 °C), h_fg = 2202.6 kJ/kg | 9,201 kg/h steam; economy **0.930** | Less than 1 because the steam's latent heat is lower than the vapor's |
| 3-effect (ideal, E = 3 × 0.930) | economy 2.79; S = 3,067 kg/h | Upper bound, no losses |
| 5-effect (ideal) | economy 4.65; ΔT per effect = (120 − 50 − 5×4.51)/5 = 9.49 K ≥ 5 K → feasible | BPE is subtracted once per effect |
| Cost per tonne water: MVR / 1-eff / 3-eff / 5-eff | **$2.16 / $16.14 / $5.38 / $3.23** | |
| Crossover electricity price vs 3-effect: c_e* = c_s / (E_3 × kWh/t) | **$0.174/kWh** | MVR wins vs 3 effects below this price at $15/t steam |
| Crossover vs 5-effect | $0.105/kWh | |
| Annual operating cost: MVR vs 3-effect | $148k vs $368k per year | |

### 7.3 How it is checked automatically
- `tests/handcalc.test.mjs` uses Node's built-in `node:test` and `assert`. It imports `site/js/model.js` (and, with an env var or loop, `site/gemini/js/model.js`), runs `simulate()` with the §7.1 inputs, and asserts each bold value in §7.2 within **±0.5 %** (mass closure within 1e−6 kg/h).
- Limiting-case tests in the same file:
  - BPE = 0 and ΔT_heater → 0 ⇒ r → 1 and W → 0.
  - r = 1 ⇒ w_s = 0.
  - N = 1 ⇒ economy = h_fg(steam)/h_fg(vapor).
  - p → minimum feasible purge ⇒ C ≥ 0 guard triggers.
  - Increasing BPE always increases W (monotonic).
  - Mass closure for 100 random valid inputs.
- `npm test` (a minimal `package.json` with no dependencies) runs it. Optionally a GitHub Action runs it on every push.
- The simulator's "Hand-calc case" preset loads these inputs, and the browser test (§10) reads the displayed values and compares them with the same table.

---

## 8. Equations (units + one-line physical interpretation)

All equations render in KaTeX on the Theory tab and in the simulator result cards. Level: Seader/Henley/Roper Ch. 17 (evaporation and crystallization) and standard thermo. **Nothing beyond 3rd-year ChemE.**

### Mass balances (steady state, crystallizer + centrifuge + purge)
| # | Equation | Units | Interpretation |
|---|---|---|---|
| M1 | F = V + C + P | kg/h | Everything fed leaves as vapor, crystals, or purge; nothing accumulates. |
| M2 | F x_F = 0.5707 C + P x_L | kg LiOH/h | Lithium leaves only in the crystals or the purge, so a bigger purge means less product. |
| M3 | F z_F = P z_ML | kg impurity/h | Impurities don't crystallize, so the purge is their only exit. Halve the purge and they double in concentration. |
| M4 | z_ML = z_F / p | – | The mother liquor concentrates impurity by a factor of 1/p. |
| M5 | x_L = (1 − z_ML) s(T)/(100 + s(T)) | – | The mother liquor is saturated: its LiOH-to-water ratio is fixed by the solubility at T. |
| M6 | Water: F(1−x_F−z_F) = V + 0.4293 C + P(1 − x_L − z_ML) | kg/h | Water leaves as vapor, as hydrate water in the crystals (each LiOH carries one H2O), or in the purge. |
| M7 | Li yield = 0.5707 C / (F x_F) | – | Fraction of incoming lithium recovered as product. |
| M8 | Product impurity ≈ ε z_ML / (1 + ε) | mass fraction (shown as ppm) | Impurity rides along in the liquor stuck to the crystals, so a bigger purge or better washing gives purer product. |
| M9 | Cooling-crystallization yield (comparison) = [s(T_hot) − s(T_cold)] / s(T_hot) per kg water | – | LiOH's solubility barely changes with T, so cooling 100 → 20 °C recovers little. That's why water has to be evaporated. |

### Phase equilibrium and BPE
| # | Equation | Units | Interpretation |
|---|---|---|---|
| B1 | BPE = i K_b m, with K_b = R T_b² M_w / ΔH_vap | K; K·kg/mol; mol/kg | Dissolved ions lower water's vapor pressure, so the liquor has to be hotter than pure water to boil at the same pressure. |
| B2 | T_b = T_sat(P) + BPE | °C | The vapor leaving is pure water, slightly superheated, at the evaporator pressure. |
| B3 | log10 P_sat = A − B/(C + T) (Antoine) or steam-table interpolation | mmHg/kPa, °C | Higher temperature → higher vapor pressure. This is what the compressor uses to "lift" the vapor. |
| B4 | Supersaturation S = c/c*, σ = (c − c*)/c* | – | The driving force for crystallization: how far above saturation the liquor is. |

### Energy (evaporator heat duty)
| # | Equation | Units | Interpretation |
|---|---|---|---|
| E1 | Q = V h_fg(T_v) + F c_p (T_b − T_F) | kW | Almost all the energy goes into boiling the water off; heating the feed is small. |
| E2 | Single effect: S = Q / h_fg(T_s); economy E = V/S | kg/h; – | One kg of steam boils about one kg of water. |
| E3 | N effects (ideal): E_N ≈ N × E_1 | – | Each effect's vapor heats the next, so the same latent heat is reused N times. |
| E4 | ΔT per effect = [T_s − T_last − N·BPE] / N ≥ ΔT_min | K | BPE is lost in every effect, so concentrated brines limit how many effects are possible. |

### MVR compressor (heat-pump view)
| # | Equation | Units | Interpretation |
|---|---|---|---|
| C1 | T_c = T_b + ΔT_heater; P2 = P_sat(T_c); P1 = P_sat(T_b − BPE) | °C, kPa | The vapor has to be compressed until it condenses hotter than the liquor it is heating. |
| C2 | r = P2/P1 | – | Compression ratio, set by the required temperature lift (BPE + ΔT_heater). |
| C3 | w_s = [γ/(γ−1)] (R/M) T_1 [r^((γ−1)/γ) − 1] | kJ/kg | Ideal-gas isentropic work. Work grows with the lift, not with the amount of latent heat recycled. |
| C4 | w = w_s/η_is; W = V w / η_m | kJ/kg; kW | Real compressors and motors waste some work as heat. |
| C5 | kWh/t = w/(3.6 η_m) | kWh per t water | The plant-comparison number (typical vendor range 20–60 kWh/t, ESTIMATE). |
| C6 | COP = h_fg/w; COP_Carnot = T_c/(T_c − T_v) | – | MVR is a heat pump: about 20–30 units of heat moved per unit of work, because only the small lift is paid for. |

### Economics
| # | Equation | Units | Interpretation |
|---|---|---|---|
| $1 | cost_MVR = c_e × kWh/t | $/t water | You pay only for the lift. |
| $2 | cost_N = c_s / E_N | $/t water | You pay for steam, divided by how many times it's reused. |
| $3 | c_e* = c_s / (E_N × kWh/t) | $/kWh | Below this electricity price, MVR is cheaper to run than N effects. |
| $4 | Annual cost = cost per t × V × hours / 1000 | $/yr | Scales the per-tonne number to the plant. |
| $5 (Ph 2) | A = Q / (U ΔT_heater) | m² | A small ΔT saves compressor power but needs a huge heater: the core design trade-off. |
| $6 (Ph 2) | Total annualized cost = CRF × (C_compressor + C_HX) + operating cost | $/yr | Finding the ΔT_heater that minimizes total cost, not just energy. |

### Crystal size (Phase 3 stretch, Seader Ch. 17 level only)
| # | Equation | Units | Interpretation |
|---|---|---|---|
| X1 | MSMPR: n(L) = n⁰ exp(−L/(Gτ)); L_D = 3Gτ | #/(m·m³); m | Longer residence time → bigger crystals, which filter and wash better but need a larger vessel. |

---

## 9. Plots ("No Plot = No Pay") and "what if?" hooks

Every equation group gets at least one plot. Each plot updates live from the sliders and marks the current operating point.

| Plot | x-axis | y-axis | "What if?" it invites |
|---|---|---|---|
| P1 Solubility curve | T (°C) | g LiOH/100 g H2O (data points + interpolation) | What if we cooled instead of evaporating? (Shaded cooling yield vs evaporative yield bar.) |
| P2 BPE vs concentration | molality or wt % | BPE (K); colligative estimate ± activity band; measured data if found | What if the liquor is more concentrated? |
| P3 Lift breakdown | stacked bar | BPE + ΔT_heater (K) | What fraction of the compressor's job is caused by BPE? |
| P4 Compressor power vs BPE | BPE (0–15 K) | kWh/t and r (twin axis) | Why does BPE hurt MVR so much? |
| P5 Energy comparison | 1 / 3 / 5 effects / MVR | Primary energy per tonne water (steam converted at boiler efficiency vs electricity at grid heat rate, both stated) and $/t | Which option uses the least energy per tonne? |
| P6 Crossover map | electricity $/kWh | steam $/t; regions colored "MVR cheaper" vs "N-effect cheaper"; current prices marked; Texas EIA point | What if electricity prices change? |
| P7 Purge trade-off | purge ratio p | Li yield (%) and product impurity (ppm), with spec line | Purity vs yield: where is the right purge? |
| P8 Sankey or bar of mass flows | – | F → V, C, P | Where does everything go? |
| P9 (Ph 2) Heater ΔT optimum | ΔT_heater | annualized compressor + HX cost and total | Why not just use a tiny ΔT? |
| P10 (Ph 2) Turndown | feed rate (50–110 %) | kWh/t, r, $/t | Does the unit still work at part load? (Flag the compressor surge region as qualitative.) |
| P11 (Ph 2) Multi-effect feasibility | N | ΔT per effect vs ΔT_min line, for current BPE | How many effects can this brine support? |
| P12 (Ph 3) MSMPR size distribution | L | n(L), with L_D marker | What if residence time doubles? |

Every result card carries a small "?" that expands the equation, the units, and the interpretation sentence. That gives the "how does that make sense?" answer on screen.

---

## 10. Folder structure

```
seperations/
├── CLAUDE.md
├── README.md                    # what the project is, live URL, how to run tests
├── netlify.toml                 # publish = "site", no build command
├── package.json                 # "test": "node --test tests/"  (no dependencies)
├── context/                     # course context (existing; no textbook or full transcripts)
├── docs/
│   ├── PLAN_PROMPT.md
│   ├── HANDOFF.md
│   ├── plan-v1-claude.md        # this file
│   ├── critique-v1-gemini.md    # Gemini's critique, verbatim
│   ├── critique-decisions.md    # suggestion | accepted? | reasoning
│   ├── plan-v2-final.md         # merged plan both models build from
│   ├── build-prompt.md          # the identical prompt given to Claude and Gemini for Phase 1
│   ├── handcalc.md              # the worked case (§7), with units
│   ├── comparison.md            # Claude vs Gemini build comparison (§12)
│   ├── qa-prep.md               # Q&A answers (§11)
│   ├── process-log.md           # appended every session
│   └── screenshots/
│       ├── claude/              # Claude build, per tab, desktop + mobile
│       ├── gemini/              # Gemini build, same set
│       └── verification/        # browser-test output, dated
├── site/                        # Netlify publish root = Claude build + documentation site
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── model.js             # pure physics (API contract §5.3)
│   │   ├── data.js              # every property/price with sourceId + estimate flag
│   │   ├── charts.js            # Plotly figures
│   │   ├── ui.js                # sliders, tabs, result cards, KaTeX rendering
│   │   └── pfd.js               # SVG process flow diagram (Phase 2: clickable)
│   ├── content/                 # tab text as HTML fragments (or inline in index.html)
│   ├── transcript.txt           # verbatim YouTube auto-transcript (Phase 5)
│   └── gemini/                  # Gemini's build, served at /gemini/ — never edited by Claude
│       ├── index.html
│       └── js/model.js ...
├── tests/
│   ├── handcalc.test.mjs        # Node test for both builds
│   └── browser-smoke.mjs        # Playwright: tabs, KaTeX, Plotly, sliders, screenshots
└── presentation/
    └── mvr-crystallizer.pptx    # slides (rubric artifact)
```

**Branches:** `main` = deployed. Claude's work on `claude/...` branches. Gemini's build on a `gemini/mvp` branch that only touches `site/gemini/`, then merged. Netlify branch deploy previews let each be checked before merge.

---

## 11. Q&A preparation (individual project = detailed technical Q&A)

`docs/qa-prep.md`, each answer tied to a simulator view:
- *Why does MVR save energy if electricity costs more per unit than steam?* You only pay for the lift (COP ≈ 22 in the hand calc), not the latent heat. → P5, C6.
- *What limits the compression ratio?* Per-stage machine limits (fans ~1.2–1.4, centrifugal ~2), the vapor's specific volume at vacuum (big machines), and wet vapor/foam damaging the impeller (Lecture 13 link). → P4.
- *Why does BPE hurt MVR more than multi-effect?* For MVR, BPE adds directly to the lift, and work scales with lift (4.5 of 10.5 K in the hand calc ≈ 43 % of the lift). For multi-effect, BPE eats into the available ΔT, which costs area or effects, but each effect's steam economy is roughly unchanged. → P3, P4, P11.
- *Why does crystal size matter for battery-grade product?* Washing and centrifuge moisture (ε), inclusions, and handling. Too small and too large are both bad. → Theory, P7, P12.
- *Where do the impurities go?* Only out the purge (M3), plus a little in adhering liquor (M8). → P7.
- *Why evaporative and not cooling crystallization?* Flat solubility (M9). → P1.
- *Why is compression the most energy-intensive operation, and why accept it here?* Lecture 13 link: here it replaces something worse (boiling with fresh steam).
- *Units check on C3:* (J/(kg·K)) × K = J/kg ✔.

---

## 12. Two-model workflow and comparison

1. **Critique:** paste this plan + HANDOFF + CLAUDE.md into Gemini with the prompt in §13. Save its reply verbatim as `docs/critique-v1-gemini.md`.
2. **Decide:** `docs/critique-decisions.md` with columns *# | Gemini suggestion | Accept / Reject / Modify | Reasoning (physics, scope, deadline, rubric)*. Andrew writes or approves the reasoning. This is shown in the presentation.
3. **Plan v2:** Claude merges the accepted items into `docs/plan-v2-final.md`.
4. **Build:** the same `docs/build-prompt.md` ("Implement Phase 1 of plan-v2-final.md; the model.js API in §5.3 is mandatory; do not go beyond a 3rd-year ChemE level; output to <folder>") goes to Claude Code (→ `site/`) and Gemini (→ `site/gemini/`). Start each in plan mode.
5. **Compare** in `docs/comparison.md` and on the Model Comparison tab:

| Metric | How measured |
|---|---|
| Correctness vs hand calc | `node --test` pass/fail count on each build, first run and final |
| First-run bugs | Count of console errors, broken tabs, unrendered equations at first browser test |
| Fix iterations | Number of follow-up prompts until the tests and browser check pass |
| Time | Wall-clock from first prompt to passing build |
| Level discipline | Did it go beyond 3rd-year (e.g., Pitzer models, rigorous population balances)? Andrew's judgment, with examples |
| Data honesty | Uncited or invented numbers found |
| UI/mobile quality | Screenshots at 375 px and 1280 px |
| Code size / clarity | Lines in model.js, separation of physics from UI |

---

## 13. What Gemini should be asked to critique

Prompt to paste (with this plan, HANDOFF.md, and CLAUDE.md attached):

> You are reviewing an implementation plan written by another AI (Claude) for a 3rd-year/4th-year ChemE separations course project. Check it for errors and suggest improvements. Specifically:
> 1. **Physics errors:** Are the mass balances (M1–M9), BPE relation (B1), multi-effect approximations (E3–E4), and compressor work equation (C3) correct and dimensionally consistent? Are the simplifications (ideal-gas steam, ideal colligative BPE, impurities not affecting solubility, ideal N-effect economy, neglecting heat of crystallization) reasonable and clearly flagged?
> 2. **Hand calc:** Recompute §7.2 independently. Report any number that differs by more than 0.5 %.
> 3. **Data:** Are any of the working values in §6 wrong or implausible (solubility table, η_is, ΔT_heater, compression-ratio limits, prices)? Better sources?
> 4. **Level:** Is anything beyond a 3rd-year ChemE undergrad? Is anything important missing that the professor would expect (supersaturation, seeding, spinodal/binodal, crystal size)?
> 5. **Interpretations:** Would each one-line interpretation survive the question "how does that make sense?"
> 6. **Scope vs deadline:** Is it realistic for one student by Dec 7 (4 weeks)? What would you cut or reorder?
> 7. **Verification:** Is the test plan sufficient to catch a wrong simulator?
> 8. **Fairness of the model comparison:** Will the comparison be fair and informative?
> 9. **Site structure:** Does it follow "significance → real process → theory → tool" and cover every assignment requirement?
> Give your suggestions as a numbered list, each with a severity (critical / important / nice-to-have).

---

## 14. Verification phase (Phase 4, and a lighter pass at the end of every phase)

1. **Unit checks:** `docs/handcalc.md` includes a dimensional-analysis line for every equation in §8 (e.g., C3: [J/(kg·K)]·[K] = J/kg).
2. **Hand-calc test:** `npm test` passes on both builds. Record results in `comparison.md`.
3. **Cross-check:** compressor work from C3 (ideal gas) vs steam-table enthalpy difference at (P1, T_b) → (P2, s = const) from the NIST WebBook for the hand-calc case. Report the % difference on the Theory tab as a stated approximation error.
4. **Browser smoke test** (`tests/browser-smoke.mjs`, Playwright, Chromium, served with `npx serve site` or `python -m http.server`):
   - Visit every tab (`#overview` … `#references`). Assert visible content and **zero console errors**.
   - Assert **zero `.katex-error` elements** and at least N `.katex` elements on Theory and Simulator.
   - Assert every Plotly container has a rendered `.main-svg`.
   - For each slider: change its value and assert that at least one chart trace or result card changed.
   - Load the "Hand-calc case" preset and read the displayed values for every bold number in §7.2. Assert ±0.5 %.
   - Screenshots of every tab at **1280×800 and 375×812** (iPhone-size) into `docs/screenshots/verification/<date>/`, and the same for `/gemini/`.
   - Assert no horizontal scroll at 375 px.
5. **Manual check by Andrew:** open the live Netlify URL on a phone and a laptop, click through every tab, and move every slider. Checklist in `process-log.md`.
6. **Data audit:** a script lists every value in `data.js` without a `sourceId`. It must print nothing.

---

## 15. Documentation workflow

- This plan is saved as **`docs/plan-v1-claude.md`** (done in this session).
- At the end of **every** session, append an entry to **`docs/process-log.md`** using its template: key prompts verbatim, what the AI produced, what was accepted/changed/rejected and why, problems, next step.
- Save Gemini's critique verbatim, the decision table, plan v2, the build prompt, and the comparison as separate files (§10), so the AI Process Log and Model Comparison tabs can be built from them.
- Screenshots of notable moments (first broken render, the fix) go in `docs/screenshots/` with dates. They make good slides.
- Never commit the textbook, full lecture transcripts, or personal information (public repo).

---

## 16. Deployment (Netlify from GitHub)

1. Add `netlify.toml` at the repo root:
   ```toml
   [build]
     publish = "site"
     command = ""
   [[headers]]
     for = "/*"
     [headers.values]
       X-Content-Type-Options = "nosniff"
   ```
2. In Netlify: **Add new site → Import from Git → GitHub → `be-aa8/seperations`**. Production branch `main`. Netlify reads the publish directory from the toml.
3. Turn on **deploy previews** for pull requests and **branch deploys** for `claude/*` and `gemini/*`, so each build can be checked at its own URL before merging.
4. Optionally set a site name like `mvr-crystallizer-explorer.netlify.app`.
5. After each production deploy, run `tests/browser-smoke.mjs` against the live URL (base URL as an argument) and save the screenshots.
6. YouTube: upload as **Unlisted or Public** (it must be viewable by the class) by Dec 4. Embed with `youtube-nocookie.com`. Paste the auto-generated transcript **verbatim** (YouTube → "…" → Show transcript → toggle timestamps as preferred) into `site/transcript.txt`.

---

## 17. Risks and mitigations

| Risk | Mitigation |
|---|---|
| No measured BPE data for LiOH | Colligative estimate with clear ESTIMATE flag + activity-factor slider. Explain ideal vs real as a learning point. |
| Equations fail to render (the professor's warning) | KaTeX pinned version, `.katex-error` assertion in the browser test, screenshots. |
| Gemini build doesn't follow the API contract | The contract is in the build prompt. If it diverges, write a thin adapter and record that as a comparison finding. |
| Scope creep before Dec 7 | Cut order in §2. Phase 3 is optional by design. |
| YouTube transcript delay | Upload by Fri Dec 4. Auto-captions can take hours. |
| Over-complication (Lecture 9) | "3rd-year ChemE" constraint in every prompt; level discipline is a comparison metric. |
