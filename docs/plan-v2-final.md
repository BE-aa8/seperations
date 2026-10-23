# Plan v2 (final): MVR Crystallizer Explorer

**What this is:** Claude's plan v1 (`docs/plan-v1-claude.md`), revised after the critique by Meta AI Muse (`docs/critique-muse.md`). The accept/reject decisions are in `docs/critique-response.md`. Tags like **[M1e]** point to the row in that table that caused a change. **Both builds follow this file.**

## Context
- **Course:** CHE 4061 AI project, individual (50 pts).
- **Presentation:** about 3 weeks out (target: week of Nov 13, 2026).
- **Topic:** mechanical vapor recompression (MVR) evaporative crystallization of battery-grade LiOH·H2O, with Tesla's Robstown, TX refinery as the industry hook.

| Role | Model / platform |
|---|---|
| Plan v1 | Claude (Claude Code, plan mode) |
| Critique | Meta AI Muse |
| Plan v2 | Claude, with my accept/reject decisions |
| Build A | Claude Code: HTML/CSS/JS + Plotly + KaTeX on Netlify (full site) |
| Build B | Meta AI Muse: molab/Marimo Python notebook (parity scope in §14) |

**Priority:** physics before polish.

**Note on numbers:** Phase 1 is done. Values are in `site/data/*.json` with sources, and estimates are flagged. See `verification/data-status.md`.

---

## 1. Phases and gates

### Phase 0: Critique (done)
v1 → Muse critique → accept/reject table → v2.

### Phase 1: Data and hand-calc (Days 1–4) — critical path
1. Source every row in §4 into `site/data/*.json`. Each row has `{value, units, basis, source_id, is_estimate, note}`. **[M3a]**
2. Solubility first. Settle the disputed 100 °C value (0.130 vs. 0.149) using two primary sources, and record the basis of every row. **[M1a]**
3. Generate `steam.json` (1 °C spacing, 40–150 °C: T, P_sat, h_f, h_g, λ, v_g) with the Python `iapws` package. Spot-check 5 points against the NIST WebBook. **[M3c]**
4. Recompute the hand-calc (§5). Write `verification/handcalc.md` and `handcalc.json`, plus 6 extra test vectors (§14).
5. **Gate, Day 4:** data are frozen, or a fallback value is declared and flagged for each missing item. **[M6b]**

### Phase 2: MVP, Build A (Days 4–9)
- Site shell with all 9 tabs (hash routing, mobile nav).
- `site/js/physics.js`: pure ES-module functions, no DOM.
- Features:
  - **F2** energy comparison
  - **F3** BPE / compressor panel, including the heater-area trade-off and the pressure trade-off **[M5a, M5b]**
  - **F4** operating-cost crossover
  - **F6** solubility panel
  - **F5** base mass balance
  - MVR heat-balance waterfall **[M5d]**
  - feasibility guards **[M1h]**
- **Static PFD** with live stream labels, shown in both Industry Context and Simulator. **[M7a]**
- Content for Overview, Industry Context (split into significance → real process), Theory, and References.
- Unit tests, a Node slider sweep, and the hand-calc test all passing (§9).
- Deploy to Netlify (§11).
- **Gate, Day 9:** MVP feature freeze. After this, only content and fixes go in. **[M6b]**
- In parallel from Day 5: the user hands Muse `molab-muse/BRIEF.md` (§14) to start Build B.

### Phase 3: Enhancements (Days 9–14)
- **F5 impurity purge** for Na and K, with the battery-grade spec line. **[M3b]**
- **F1** clickable PFD: clicking a unit opens its equations and live values. Only if the Day 9 gate passed. **[M6a]**
- **Turndown presets:** Design, 60% turndown, Dilute feed, High-BPE liquor.
- **Static CAPEX bar:** published compressor and evaporator prices, one order-of-magnitude bar labelled Class 5 (±50%). No annualization sliders. **[M4b]**
- Dühring plot. **[M5c]**
- Review Build B (half a day, budgeted). Fill in `docs/model-comparison.md` and the Model Comparison tab.

### Phase 4: Stretch (only if on schedule)
- **F7:** two static operating-problem cards (foaming carryover; Li₂CO₃ scaling with its retrograde solubility). **[M6a]**
- Compression T–s sketch.
- **Cut:** MSMPR panel, animated PFD, dark mode, print CSS. **[M4b, M6a]**

### Phase 5: Verification, slides, and video (Days 15–21)
- Final verification pass (§9).
- Slides from Day 15, built from the site's section order. **[M6b]**
- Record the practice talk on YouTube. Paste the verbatim auto-transcript into the Transcript tab.
- Optional (prof, Lecture 9): give an AI the practice transcript for feedback.
- Final process-log entry and deploy.

### Feature → phase map
| # | Feature | Phase |
|---|---|---|
| F1 | PFD: static with live labels (P2); clickable (P3) | 2 / 3 |
| F2 | Energy comparison: 1–6 effects vs. MVR | 2 |
| F3 | BPE → lift → CR → power; heater area; pressure trade-off | 2 |
| F4 | Operating-cost crossover (+ static CAPEX bar in P3) | 2 / 3 |
| F5 | Mass balance (P2); Na/K purge vs. spec (P3) | 2 / 3 |
| F6 | Solubility: evaporative vs. cooling crystallization | 2 |
| F7 | Two static problem cards | 4 |
| — | Turndown presets, Dühring plot | 3 |

---

## 2. Simulator inputs (defaults = hand-calc)
| Input | Range |
|---|---|
| Feed rate F | 2,000–20,000 kg/h |
| Feed LiOH fraction x_F | 0.02–0.10 |
| Feed temperature T_F | 25–100 °C |
| Crystallizer pressure P₁ | 0.2–1.5 bar |
| Heater ΔT | 3–15 K |
| Compressor isentropic efficiency η | 0.60–0.85 |
| **Purge, as % of feed mass** | 1–15 % **[M1h]** |
| Na and K in feed | ppm |
| Retained liquor on crystals ε | 0.02–0.15 kg/kg dry crystal |
| Electricity price | $0.03–0.20/kWh |
| Gas price | $/MMBtu (steam price is derived from it, §4) |
| Number of effects N | 1–6 |
| φ | slider band limited to the sourced range **[M3e]** |

**Feasibility rules [M1h].** If any of these fail, the KPIs are replaced by an explanation of which constraint failed and why:
- C > 0
- the feed is not supersaturated at T_F: x_F < x_sat(T_F)
- each effect's ΔT ≥ ΔT_min
- CR within the fan range: one stage up to ~2.0, with a two-stage note shown above 1.6

Every panel has a "What if?" hint and a reset-to-hand-calc button.

---

## 3. Equations (3rd-year level; units + physical interpretation)
Notation: x = LiOH mass fraction (anhydrous basis). r_h = 23.95/41.96 = 0.5708 kg LiOH per kg hydrate. Purge P_g = p·F.

**Mass balance (crystallizer + centrifuge; product on a dry basis)**
1. F = V + P_g + C   [kg/h]. *Everything that enters leaves as vapor, purge liquor, or crystals.*
2. F·x_F = P_g·x_sat(T_boil) + r_h·C   [kg/h]. *Lithium leaves either dissolved in the purge or locked in crystals.*
3. C = (F·x_F − P_g·x_sat)/r_h; V = F − P_g − C; feasible only if C > 0. *A bigger purge means fewer crystals: the yield cost of purity.*
4. Y = r_h·C/(F·x_F)   [–]. *The fraction of incoming lithium that ends up as product.*

**Impurities (Na and K, same equation) [M1f, M3b]**. This is a decoupled approximation: the retained liquor ε·C is small (ε ≤ 0.15), so it is left out of Eq. 1–2.
5. w_i,ML = F·w_i,F/(P_g + ε·C)   [kg/kg]. *The impurity has to leave somewhere. A smaller purge lets it concentrate until enough leaves.*
6. w_i,prod ≈ ε·w_i,ML (dry basis: on drying the water leaves, the salt stays). The spec line comes from the sourced battery-grade datasheet. *The crystals themselves are pure; impurity rides on the liquor film left after the centrifuge.*

**Solubility and supersaturation**
7. x_sat(T) from the sourced table (log or linear interpolation; flagged as extrapolation above the table's last T) **[M3a]**. *A flat curve means cooling yields little, so we boil the water off instead.*
8. Cooling comparison **[M1g]**:
   - evaporate to saturation at T_hi, leaving water W = F·x_F/s(T_hi), with s in kg LiOH per kg water;
   - then cool: ΔLiOH = W·(s(T_hi) − s(T_lo)), and hydrate = ΔLiOH/r_h.
   - Single-pass cooling yield = ΔLiOH/(F·x_F).
   - *Even after boiling most of the water off, cooling recovers only a small fraction, so evaporation has to do the work.*
9. S = x/x_sat, σ = S − 1. *The bulk exit liquor is about saturated. Supersaturation is a small, local driving force in the crystallizer, kept inside the metastable zone so crystals grow instead of nucleating fines.* **[M1j]**

**Boiling point elevation [M1b, M1c, M3e]**
10. m = x/[(1−x)·MW_LiOH]   [mol/kg water].
11. K_b(T) = R·T_sat²·M_w/ΔH_vap(T_sat)   [K·kg/mol]. It is 0.512 at 100 °C and ≈ 0.39 at 60 °C. *Water at lower pressure has a lower boiling point, and dissolved ions shift that boiling point by less.*
12. BPE = K_b(T_sat)·ν·φ·m, with ν = 2   [K]. *Ions tie up water and lower its escaping tendency, so the solution must be hotter to boil. φ < 1 means the effect is less than ideal.* This dilute-solution law is extrapolated as a water-activity approximation. The F3 plot shows BPE as a band.
13. T_boil = T_sat(P₁) + BPE, with x_sat evaluated at T_boil. **Solved by fixed-point iteration inside one function**: start from T_sat, iterate to |ΔT| < 0.01 K, maximum 20 iterations. *The vapor leaves at pressure P₁ and only "remembers" T_sat(P₁), so the BPE is lost driving force that compression must buy back.*

**Evaporator energy balance**
14. Q = V·λ(P₁) + F·c_p,F·(T_boil − T_F)   [kW]. This is the course-level form: the small vapor superheat (≈ 2 kJ/kg·K × BPE) is neglected and noted.
    - Heat of crystallization: Phase 1 sources its magnitude and shows it is about 1% of Q, or adds it if it is larger. **[M3f]**
    - *Most of the heat boils water; warming the feed is a small extra.*

**Steam evaporators [M1d]**
15. Single effect: S_steam = Q/λ_s, E₁ = V/S_steam   [kg/kg]. *One kg of steam boils off about one kg of water, because the two latent heats are similar.*
16. N effects, using a simplified **equal-ΔT** teaching model:
    - Economy: E_N = N·E₁·f̄_N, with f̄₁ = 1 and f̄_N a single total derate (sourced rule of thumb, flagged).
    - Feasibility: ΔT_eff = [T_steam − T_sat,last − Σ_j BPE_j]/N ≥ ΔT_min. BPE_j uses each effect's own concentration, rising linearly from x_F to x_sat.
    - *Each effect reuses the previous effect's vapor, but every effect pays a BPE "tax" on a fixed temperature budget. Too many effects leaves no driving force.*

**MVR compressor [M1e, M1i]**
17. T_cond = T_boil + ΔT_heater; P₂ = P_sat(T_cond); CR = P₂/P₁. *The vapor must condense hotter than the liquor it heats. The lift equals BPE + ΔT_heater, and CR grows roughly exponentially with lift (~3.7%/K near 100 °C).*
18. w_s = [k/(k−1)]·(R/M)·T₁·[CR^((k−1)/k) − 1], with k ≈ 1.33 and T₁ = T_boil   [kJ/kg]. Cross-checked against steam tables: w_s vs. h₂ₛ − h₁, with the % difference printed. *Squeezing vapor raises its pressure; the work grows with the starting temperature and the ratio.*
19. w = w_s/η (isentropic η; the vendor basis is stated). W = V·w. e = w/3.6 [kWh/t water], **compressor only**. Also shown per tonne of product: e·V/C. Assumes compressor flow = V (no desuperheating injection, no venting). *A real compressor loses some work as extra superheat.*
20. Heat closure on an enthalpy basis:
    - h_out = h_v(P₁, T_boil) + w
    - Q_avail = V·(h_out − h_f(T_cond))
    - Make-up steam = max(0, Q − Q_avail)/λ_s
    - Superheat delivered = h_out − h_g(P₂).
    - *Compression recycles the latent heat; electricity only pays for the lift. The small shortfall (feed preheat) is covered by make-up steam or a condensate preheater, which real plants do.*
21. COP = Q_avail/W; COP_Carnot = T_cond/(T_cond − T_sat(P₁)) (in K). *COP 24 vs. a Carnot limit of 64 means ~38% of ideal, which is plausible for a real machine.* **[M2b]**
22. Heater area: A = Q/(U·ΔT_heater)   [m²]. *A smaller ΔT saves power but needs a bigger, costlier heater. That is the core MVR design trade-off.* **[M5a]**
23. Volumetric suction flow: V̇ = V·v_g(P₁)   [m³/s]. *Under vacuum the vapor is so thin that the fan gets huge, so vacuum isn't free.* **[M5b]**

**Economics**
24. c_MVR = e·p_el + (make-up steam/V)·p_steam; c_N = p_steam/E_N   [$/t water]. p_steam = p_gas·(Δh_steam/η_boiler), from the EIA industrial delivered gas price. **[M3d]** *Compare dollars per tonne of water removed.*
25. Crossover line on the (p_el, p_steam) map: c_MVR = c_N. *Above the line MVR wins; below it steam wins.*
26. (Phase 3, static) CAPEX bar: sourced published prices, scaled with the six-tenths rule and labelled Class 5 (±50%). *Bigger equipment costs less per unit of capacity.*

**Theory only (no simulator coupling) [M4b]:** L_D = 3Gτ. *Longer residence time gives bigger crystals. Fines trap impure liquor and filter badly; oversize crystals handle and dissolve poorly. Battery specs want a narrow size band.*

**Unit-check rule:** every function in `physics.js` has a JSDoc line with its input and output units.

---

## 4. Data needed
| Quantity | Planned source | Estimate? |
|---|---|---|
| LiOH solubility 0–100 °C. **Basis recorded per row.** Disputed: 100 °C = 15.0 g/100 g water (Parchem) vs. 17.5 (Wikipedia, per 100 mL) | CRC Handbook; IUPAC-NIST Solubility Data Series; Monnin & Dubois (2005) J. Chem. Eng. Data "Thermodynamics of the LiOH+H2O system" | No. Above 100 °C it is flagged as extrapolation |
| Stable solid phase (LiOH·H2O) | Monnin & Dubois | No |
| φ(m, T) at the hand point | Monnin & Dubois, if it can be extracted; else a narrowed band | **Estimate** |
| Steam tables (T, P_sat, h_f, h_g, λ, v_g) | `iapws` Python package → `steam.json`; 5 points checked vs. NIST WebBook | No |
| c_p of feed liquor | LiOH solution data if found; else 3.9 kJ/kg·K | **Estimate** |
| k for steam, ideal-gas assumption | Thermo textbook; checked vs. steam tables (Eq. 18) | Approximation |
| Compressor η (and whether vendors quote it as isentropic or polytropic), fan CR range | GEA / Veolia / SPX MVR literature | **Estimate** |
| Typical MVR system kWh/t (sanity range) | GEA brochure (Muse cited 30–50, to verify) | Reference |
| Heater ΔT range; overall U for a forced-circulation heater | Vendor literature / evaporator chapter in McCabe-Smith or Seader | **Estimate** |
| ΔT_min per effect; multi-effect derate f̄_N | Evaporator chapter rule of thumb | **Estimate** |
| ΔH of crystallization/solution, LiOH·H2O | NBS tables / DIPPR | No (magnitude argument) |
| Battery-grade LiOH·H2O spec (LiOH %, Na, K ppm) | Producer datasheet (Albemarle / Arcadium / Ganfeng) | No |
| Real purified-liquor LiOH wt% and Na/K into the crystallizer | Tesla TCEQ/SEC filings, Veolia case material, patents; else flagged | **Estimate if not found** |
| ε (retained liquor after the centrifuge) | Centrifuge literature / textbook | **Estimate** |
| Li₂CO₃ solubility vs. T (retrograde) | CRC Handbook | No |
| Industrial electricity price (TX, US) | EIA Electric Power Monthly, Table 5.6.A | No (dated) |
| Industrial delivered gas price; boiler efficiency | EIA natural gas prices (industrial); textbook boiler η ~0.8 | Steam price **derived estimate** |
| Equipment prices (compressor/fan, FC crystallizer) | Published prices / Turton correlations + CEPCI (check availability) | **Estimate, Class 5** |
| Industry facts | HANDOFF sources. "Enough LiOH for ~50 GWh/yr of batteries". MVR market share caveated as a market-research estimate | — |

The References tab renders from `sources.json`, and an estimate badge appears wherever `is_estimate` is true.

---

## 5. Hand-calculation case (FROZEN in Phase 1)
The full worked solution is in `verification/handcalc.md`. The expected values are in `verification/handcalc.json` and `vectors.json`, generated by the independent reference script `verification/handcalc.py`.

**Change from v2 draft:** the 6 extra test vectors come from the reference script, not from Build A's code, so neither build is checked against itself. The vector set is: vacuum 20 kPa, ΔT 3 K, ΔT 15 K, purge 1 %, feed 3 wt %, η = 0.65. N = 1–6 are covered in `handcalc.json` under `effects`.

Inputs: F = 10,000 kg/h · x_F = 0.06 · T_F = 80 °C · P₁ = 101.325 kPa · purge 5 % · φ = 0.80 (est.) · ΔT_heater = 6 K · η = 0.75 · k = 1.33 · c_p,F = 3.9 · steam at 120 °C.

| Result | Value |
|---|---|
| x_sat, m, K_b, BPE, T_boil | 0.1495 · 7.34 mol/kg · 0.513 · 6.02 K · 106.0 °C |
| C, V, Li yield | 920.2 kg/h · 8,579.8 kg/h · 87.5 % |
| Q (heat of solution = 0.39 % of Q, neglected) | 5,628.8 kW |
| Single effect: S, E₁ | 9,202 kg/h · 0.932 |
| 5 effects: E₅, ΔT per effect | 4.66 · 10.0 K (feasible) |
| T_cond, P₂, CR, lift | 112.0 °C · 153.3 kPa · 1.513 · 12.0 K |
| w_s (ideal gas) vs. steam tables | 76.26 vs. 75.05 kJ/kg (+1.6 %) |
| w, W, e | 101.7 kJ/kg · 242.3 kW · **28.2 kWh/t water (compressor only)**, 263 kWh/t product |
| Heat closure: Q_avail, make-up | 5,528.9 kW · **163 kg/h** (1.9 % of V) |
| COP vs. Carnot | 22.8 vs. 64.2 (36 %) |
| Heater area (U = 2,000) | 469 m² |
| Cooling route (evaporate, then cool to 25 °C) | 302 kg/h hydrate, 29 % single pass |
| Product Na / K (ε = 0.05) | 91.6 ppm (fails 50 ppm) / 27.5 ppm. Purge for the Na spec = 9.6 %, yield 76 % |
| Cost per t water (TX prices) | MVR $1.90 · 1 effect $9.63 · 3 effects $3.21 · 5 effects $1.93 |

## 6. Plots (every calculation has one)
| Calc | Plot | What if? |
|---|---|---|
| Mass balance | Sankey (LiOH and water) | Raise purge → the crystal band shrinks |
| Purge vs. purity (P3) | Yield and Na/K ppm vs. purge %, with spec lines | Find the smallest purge that meets spec |
| Solubility | x_sat vs. T; evaporate-then-cool comparison bar | Cool 100 → 25 °C: how little comes out? |
| BPE | BPE band vs. x; lift stack (BPE + ΔT_heater) | Raise φ or concentration |
| Dühring (P3) | T_boil vs. T_sat for 3 concentrations | Why are the lines nearly parallel? |
| Compressor | W and kWh/t vs. ΔT_heater, **with heater area on a 2nd axis** | Where would you choose ΔT? |
| Pressure trade-off | w and suction m³/s vs. P₁ | Why doesn't vacuum help? |
| Heat waterfall | Q_latent, Q_preheat, Q_avail, W, make-up | Lower T_F → more make-up |
| Energy comparison | Bars for 1–6 effects vs. MVR; infeasible effects shaded | Raise BPE → effects drop out |
| Economics | Price map with crossover line and current point; $/t vs. N | Move the gas price |
| CAPEX (P3) | One static bar per option, Class 5 | — |
| Turndown | kWh/t and $/t vs. F | Does it still work at 60%? |
| PFD | SVG with live labels | Click a unit (P3) |

Consistent colours per option. Units on every axis, hover values, responsive sizing.

---

## 7. Site structure and requirement traceability
**Tab order (prof's order):**
1. **Overview** — slogan **[M7c]**: "~28 kWh of electricity replaces ~1.07 t of steam per tonne of water evaporated".
2. **Industry Context** **[M7a]**, in two parts:
   - (a) Significance: why LiOH, US domestic refining, companies and countries.
   - (b) The real process: the Robstown walk-through with the static PFD.
3. **Theory** — evaporation as single-stage VLE; BPE and the Dühring plot; solubility; supersaturation and metastable zone; **binodal ≈ solubility curve vs. spinodal ≈ metastable limit** (with a note on liquid–liquid "oiling out") **[M4a, kept because the professor asked]**; seeding; why crystal size matters (L_D = 3Gτ); multi-effect vs. MVR; compression energy; wet vapor at the compressor.
4. **Simulator**
5. **Model Comparison**
6. **AI Process Log**
7. **Video**
8. **Transcript**
9. **References & Contributions** (separate visible blocks)

| Assignment requirement | Where it is met | Evidence file |
|---|---|---|
| 1. Public website | Netlify URL | `netlify.toml`, `site/` |
| 2. YouTube video linked | Video tab | `site/index.html` |
| 3. Verbatim transcript | Transcript tab | `site/content/transcript.txt` |
| 4. Overview, demo, AI project, process, iterations, technical details, learnings | Overview, Simulator, AI Process Log, Theory, Overview "What I learned" block | `docs/process-log.md`, plans |
| 5. Plan → critique → justify → 2-model build + compare | Model Comparison tab | `plan-v1-claude.md`, `critique-muse.md`, `critique-response.md`, `plan-v2-final.md`, `model-comparison.md`, `molab-muse/` |
| 6. Attribution and contributions | References & Contributions tab | `site/data/sources.json` |
| Rubric: PowerPoint | — | `presentation/` |

---

## 8. Folder structure
```
/              CLAUDE.md, README.md, netlify.toml
context/       course context
docs/          plan-v1-claude.md, critique-muse.md, critique-response.md, plan-v2-final.md,
               model-comparison.md, process-log.md, HANDOFF.md
site/          Build A (Netlify publish dir): index.html, css/, js/physics.js, js/data.js, js/ui/*.js,
               data/*.json, content/transcript.txt, img/
molab-muse/    Build B: BRIEF.md (handoff to Muse), mvr_explorer.py, README.md (molab link), prompts
verification/  handcalc.md, handcalc.json, vectors.json, screenshots/{claude,muse}/
tests/         physics.test.mjs, handcalc.test.mjs, sweep.test.mjs, smoke.mjs (Playwright)
presentation/  slides
scripts/       make_steam_table.py (iapws → site/data/steam.json)
```

## 9. Verification
1. **Unit tests** (`node --test tests/`):
   - each function against hand values;
   - dimensional spot checks;
   - limiting cases: lift → 0 ⇒ W → 0; CR = 1 ⇒ w = 0; N = 1 ⇒ E_N = E₁; purge → 0 ⇒ Y → 1 with Na guarded;
   - K_b(100 °C) = 0.512 and K_b(60 °C) ≈ 0.39;
   - the fixed point converges;
   - monotonicity: W rises with ΔT and with BPE.
2. **Node sweep** (`sweep.test.mjs`): a grid over every slider's min/mid/max. Every output is either finite and physical (C ≥ 0, Y in [0, 1], CR ≥ 1) or flagged infeasible. Never negative or NaN. **[M6a]**
3. **Hand-calc + vectors:** within 0.5%.
4. **Browser smoke test** (`smoke.mjs`, Playwright + preinstalled Chromium, desktop 1280 px and mobile 390 px):
   - all 9 tabs load;
   - no console errors and no `.katex-error`;
   - each Plotly div has traces;
   - default KPIs match the JSON;
   - one slider move per panel updates its chart.
   - Screenshots go to `verification/screenshots/claude/`.
5. **Manual:** deployed URL on a phone, with a checklist in `handcalc.md`.
6. **Build B:** run in molab, check the assert cell passes, screenshot to `screenshots/muse/`.

## 10. Documentation workflow
- Append to `docs/process-log.md` after every session.
- `docs/model-comparison.md` covers:
  - correctness vs. the JSON;
  - first-run bugs and the number of fix iterations;
  - time spent;
  - UI quality, judged within each platform's scope;
  - whether the model overcomplicated the material;
  - platform pros and cons.

## 11. Netlify
- `netlify.toml` with `publish = "site"` and no build step.
- Import the GitHub repo `be-aa8/seperations` in Netlify, with `main` as the production branch.
- Pin the CDN library versions.
- Link the molab notebook and YouTube video. Put the URL in the README.

## 12. Critique round
Done (Muse). If time allows, a short second round: give Muse the v2 diff and ask "did these fixes introduce new errors?", then log it.

## 13. Risks
| Risk | Mitigation |
|---|---|
| Solubility dispute or sparse φ | Day 4 gate with declared fallbacks; BPE shown as a band |
| Equation rendering | KaTeX + smoke test |
| Build B drifts from spec | Shared JSON, function spec, and vectors; the comparison is against the JSON |
| Schedule | Day 9 freeze; Phase 4 is optional |

---

## 14. Build B brief (contents of `molab-muse/BRIEF.md`) [M8a–e]
**Parity scope:**
- physics functions;
- the hand-calc table, asserted against the embedded JSON;
- 3 interactive plots: (1) BPE / lift stack, (2) compressor power + heater area vs. ΔT_heater, (3) operating-cost crossover map;
- sliders for F, x_F, P₁, ΔT_heater, η, purge %, p_el, p_gas.

**Not required in Build B:** tabs, PFD, Sankey, references UI.

**Rules to give Muse verbatim:**
- "Marimo's reactive DAG forbids cyclic cells. The x_sat(T_boil) ↔ BPE loop must live inside a single function in a single cell."
- Embed `steam.json`, `solubility.json`, `prices.json`, `handcalc.json`, and `vectors.json` as dict literals in one data cell. Do not read files by path.
- Top-level variable names can't be redefined across cells. Keep state in functions or dicts.
- Rebuild Plotly figures on each slider change (fine at this size).
- Check equations in `mo.md` render; don't assume the KaTeX escaping is identical.
- The tests are one assert-and-print cell comparing against `handcalc.json` and `vectors.json`.

**Function spec:** each function has a name, inputs with units, and outputs with units, taken from `physics.js` JSDoc after Phase 2 (`solubility(T)`, `steamProps(T)`, `Kb(T)`, `boilingPoint(P, x)`, `massBalance(...)`, `impurity(...)`, `duty(...)`, `singleEffect(...)`, `multiEffect(...)`, `compressor(...)`, `heatClosure(...)`, `heaterArea(...)`, `costs(...)`).

**Test vectors:** the hand case plus vacuum (P₁ = 0.2 bar), ΔT = 3 and 15 K, N = 1 and 5, and purge → 1%. Expected outputs come from Build A's tested code.
