# Plan v1 (Claude): MVR Crystallizer Explorer

## Context
CHE 4061 AI project (individual, 50 pts). Presentation in **about 3 weeks (target: week of Nov 13, 2026)**. Topic: mechanical vapor recompression (MVR) evaporative crystallization of battery-grade LiOH·H2O, using Tesla's Robstown, TX refinery as the industry hook (see `docs/HANDOFF.md`). This plan follows `docs/PLAN_PROMPT.md`. A different AI model will critique it, and it will be built twice:

| Role | Model / platform |
|---|---|
| Plan v1 | Claude (Claude Code, plan mode) |
| Critique | **Meta AI Muse** |
| Build A | **Claude Code**: plain HTML/CSS/JS + Plotly + KaTeX, deployed on Netlify |
| Build B | **Meta AI Muse**: Python notebook in **molab/Marimo**, linked from the site (compares models *and* platforms) |

Priority is **physics first**: clean, readable, mobile-friendly styling, with most of the time going to correct equations, physical interpretations, and plots.

Clarifying answers from the user (Oct 23): individual project; Muse critiques and writes Build B; Build B goes on molab/Marimo; physics comes before polish; present in 3 weeks.

**Note on numbers:** every property value in this plan is *provisional* and marked (P). Phase 1 replaces each one with a cited value. The hand-calc gets recomputed with those values and frozen in `verification/handcalc.json`. No data gets invented.

---

## 1. Phases (written so any model can follow them)

### Phase 0: Documentation and critique (Days 1–2)
1. Save this plan as `docs/plan-v1-claude.md`. Append a session entry to `docs/process-log.md` with the PLAN_PROMPT, the clarifying Q&A, and the decisions.
2. User pastes the plan into Muse with the critique prompt (§12). Save Muse's reply verbatim as `docs/critique-muse.md`.
3. Build the accept/reject table in `docs/critique-response.md` (suggestion | accepted? | reasoning). Write `docs/plan-v2-final.md`. **Both builds follow v2.**

### Phase 1: Data sourcing and hand-calc (Days 2–4), blocks everything else
1. Source every value in §4 into `site/data/*.json`. Each entry includes `{value, units, source_id, is_estimate, note}`.
2. Recompute the §5 hand-calc with the sourced values. Write `verification/handcalc.md` (human-readable, with equation, units, and interpretation for each line) and `verification/handcalc.json` (inputs, expected outputs, tolerances).

### Phase 2: MVP, Build A (Days 4–9)
- Site shell with all 9 tabs (hash routing, one HTML page, mobile nav).
- `site/js/physics.js`: pure ES-module functions, no DOM, importable by both the browser and Node tests.
- Simulator features **F2 Energy comparison**, **F3 BPE panel**, **F4 Economic crossover**, **F6 Solubility panel**, and the base mass balance from F5 (no impurity yet).
- Unit tests and the hand-calc test passing (§9).
- Content for Overview, Industry Context, and Theory (§7 order), plus References with all sources.
- Deploy to Netlify (§11).

### Phase 3: Enhancements (Days 9–14)
- **F1 Clickable PFD** (inline SVG; clicking a unit opens a side panel with its equations and live values).
- **F5 Impurity purge** (Na/K build-up, purge fraction vs. purity vs. Li yield).
- **Operating scenarios / turndown** (prof, Lecture 10): preset buttons for Design, 60% turndown, Dilute feed, and High-BPE (impure) liquor.
- **CAPEX estimate** (prof, Lecture 10): compressor and evaporator cost from published correlations, plus a simple annualized cost per tonne of LiOH·H2O. Flagged as an estimate.
- **Build B (Muse, molab)**: in parallel, the user gives Muse `docs/plan-v2-final.md`, `verification/handcalc.json`, and `site/data/*.json`. The notebook goes in `molab-muse/`.
- Model Comparison tab filled from `docs/model-comparison.md`.

### Phase 4: Stretch (Days 14–17, only if on schedule)
- **F7 Operating-problem cards**: foaming carrying LiOH into the condensate, and Li2CO3 scaling. Cite the patents.
- **MSMPR crystal size panel**: dominant size L_D = 3Gτ vs. residence time. Ties to "why crystal size matters".
- Animated PFD flows, dark mode, print stylesheet.

### Phase 5: Verification, presentation, and video (Days 15–21)
- Full verification pass (§9), with screenshots.
- PowerPoint in `presentation/`, using the same section order as the site.
- Record the practice talk and upload to YouTube. Paste the verbatim auto-transcript into the Transcript tab.
- Optional (prof, Lecture 9): give an AI the practice-run transcript for feedback, and log it.
- Final process-log entry and final deploy.

### Feature → phase map
| # | Feature (HANDOFF) | Phase |
|---|---|---|
| F1 | Clickable PFD with unit equations and live values | 3 |
| F2 | Energy comparison: 1/3/5 effects vs. MVR (kWh/t, steam economy) | 2 |
| F3 | BPE panel: BPE → usable ΔT → compression ratio → power | 2 |
| F4 | Economic crossover: electricity vs. steam price | 2 (CAPEX in 3) |
| F5 | Mass balance + impurity purge | 2 (base), 3 (impurity) |
| F6 | Solubility vs. T (why evaporative, not cooling, crystallization) | 2 |
| F7 | Operating-problem cards | 4 |
| — | Turndown scenarios, CAPEX | 3 |
| — | MSMPR crystal size | 4 |

---

## 2. Simulator inputs (sliders), defaults = hand-calc case
Feed rate F (2,000–20,000 kg/h) · feed LiOH mass fraction x_F (0.02–0.10) · feed temperature T_F (25–100 °C) · crystallizer pressure P (0.2–1.5 bar) · heater ΔT (3–15 K) · compressor isentropic efficiency η (0.60–0.85) · purge flow (1–15% of feed) · Na in feed (ppm) · retained mother liquor on crystals ε (0.02–0.15 kg/kg) · electricity price ($0.03–0.20/kWh) · steam price ($5–40/t) · number of effects N (1–6) · osmotic-coefficient correction φ (0.6–1.0, flagged estimate).

Every output panel shows a **"What if?" hint**, such as "Double ΔT. Why does power more than double?" There is also a **reset to hand-calc** button.

---

## 3. Equations (3rd-year level; each with units and a physical interpretation)
Notation: x = LiOH mass fraction (anhydrous basis). MW_LiOH = 23.95 g/mol. MW_LiOH·H2O = 41.96 g/mol. r_h = 23.95/41.96 = 0.5708 (kg LiOH per kg hydrate).

**Mass balances (crystallizer + centrifuge, steady state)**
1. Total: F = V + P_g + C   [kg/h]. *Whatever comes in leaves as vapor, purge liquor, or crystals.*
2. LiOH: F·x_F = P_g·x_sat(T) + r_h·C   [kg/h]. *Lithium leaves only two ways: dissolved in the purge, or locked in crystals.*
3. Solve: C = (F·x_F − P_g·x_sat)/r_h. V = F − P_g − C. *A bigger purge means fewer crystals; that is the yield cost of purity.*
4. Li yield: Y = r_h·C/(F·x_F)   [–]. *The fraction of incoming lithium that becomes product.*

**Impurity purge (Phase 3)**
5. Na balance: F·w_Na,F = (P_g + ε·C)·w_Na,ML → w_Na,ML = F·w_Na,F/(P_g + ε·C)   [kg/kg]. *The impurity has to leave somewhere. With a smaller purge it concentrates in the mother liquor until enough leaves.*
6. Product Na: w_Na,prod ≈ ε·w_Na,ML/(1+ε)   [kg/kg] (unwashed; an optional wash factor divides this). *The crystals are pure; the impurity rides on the film of liquor left after the centrifuge.*

**Solubility and supersaturation**
7. x_sat(T): interpolated from the sourced table   [kg/kg]. *A nearly flat curve means cooling a saturated solution yields little crystal, so we boil the water off instead.*
8. Cooling-crystallization yield for comparison: ΔC_cool ≈ m_water·(s(T_hi) − s(T_lo))/r_h, with s in kg/kg water. *Shows numerically why cooling crystallization is useless here.*
9. Supersaturation S = x/x_sat, σ = S − 1   [–] (Theory tab). *The driving force for nucleation and growth. Too much σ makes a shower of fines.*

**Boiling point elevation**
10. Molality: m = x/[(1−x)·MW_LiOH]   [mol/kg water].
11. BPE = K_b·ν·φ·m. K_b = 0.512 K·kg/mol. ν = 2 (Li⁺, OH⁻). φ = osmotic coefficient, flagged estimate   [K]. *Dissolved ions lower water's escaping tendency, so the solution must be hotter than pure water to boil at the same pressure.*
12. T_boil = T_sat(P) + BPE   [°C]. The vapor leaves superheated by BPE, at pressure P. *The vapor "remembers" only the pressure, so it condenses at T_sat(P), not at T_boil. That lost ΔT has to be bought back with compression.*

**Energy balance on the evaporator body**
13. Q = V·λ(P) + F·c_p,F·(T_boil − T_F)   [kW]. Heat of crystallization is neglected in the MVP (flagged; added if a sourced value is found). *Most of the heat goes to boiling off water. Warming the feed is a small extra.*

**Single- and multi-effect steam**
14. Single effect: S_steam = Q/λ_s, steam economy E₁ = V/S_steam   [kg/kg]. *Each kg of steam can boil off at most about 1 kg of water, because both latent heats are about 2,200 kJ/kg.*
15. N effects (simplified, equal-area teaching model): E_N ≈ N·E₁·f_loss, where f_loss is a flagged estimate (~0.85–0.9 per effect, from textbook rule of thumb). Feasibility: ΔT_per effect = [T_steam − T_cond,last − N·BPE]/N ≥ ΔT_min. *Each effect reuses the previous effect's vapor, but every effect pays a BPE "tax" on the total temperature budget. Add enough effects and nothing is left to drive heat transfer.*

**MVR compressor**
16. Required condensing temperature: T_cond = T_boil + ΔT_heater. P₂ = P_sat(T_cond)   [°C, bar]. *The compressed vapor must condense hotter than the boiling liquor, or heat won't flow into it.*
17. Compression ratio: CR = P₂/P₁   [–]. *The lift is set by BPE + ΔT_heater. MVR doesn't care how much water you evaporate, only how far you lift it.*
18. Isentropic work (ideal-gas steam, k ≈ 1.33): w_s = [k/(k−1)]·(R/M)·T₁·[CR^((k−1)/k) − 1]   [kJ/kg]. R/M = 0.4615 kJ/(kg·K). *Squeezing vapor raises its pressure and temperature. The work grows with the starting temperature and with the ratio.*
19. Actual work: w = w_s/η. Power W = V·w   [kW]. Specific energy e = w/3.6   [kWh/t water evaporated]. *A real compressor wastes some work as extra superheat.*
20. MVR heat check: Q_avail = V·(λ(P₂) + superheat) ≈ V·λ(P₂) + W. Make-up steam = max(0, Q − Q_avail)/λ_s. *Compression recycles the latent heat; electricity only pays for the "lift" plus losses. Any shortfall (feed preheat) is covered by a small make-up steam or a condensate preheater.*
21. Equivalent COP = V·λ/W   [–]. *How many kJ of heat move per kJ of electricity. Typically 15–30, which is why MVR wins even when electricity costs more per kJ.*

**Economics**
22. Operating cost per t water: c_MVR = e·p_el (+ make-up steam), c_N = p_steam/E_N   [$/t]. *Compare dollars per tonne of water removed.*
23. Crossover: MVR is cheaper when p_steam/p_el > e·E_N (in kWh per t steam). *A single line on a price map. Above it MVR wins, below it steam wins.*
24. (Phase 3) CAPEX: C = C_ref·(S/S_ref)^n·(CEPCI_now/CEPCI_ref), annualized with a capital recovery factor. Cost per t LiOH·H2O = (annualized CAPEX + OPEX)/annual product. *The six-tenths rule: bigger equipment costs less per unit of capacity.*

**Crystal size (Phase 4, Seader crystallization chapter)**
25. MSMPR: n(L) = n⁰·exp(−L/(Gτ)), L_D = 3Gτ   [µm]. *Longer residence or faster growth makes bigger crystals. Fines trap mother liquor (impurity), oversize crystals dissolve slowly and handle poorly, so battery-grade specs target a narrow size band.*

**Unit-check rule:** every equation in `physics.js` has a JSDoc line stating input/output units. §9 includes dimensional spot checks.

---

## 4. Data needed: source and estimate status
| Quantity | Planned source | Estimate? |
|---|---|---|
| LiOH solubility vs. T (0–100 °C), provisional ~11 wt% at 25 °C rising to ~13 wt% at 100 °C (P) | CRC Handbook of Chemistry and Physics, "Aqueous Solubility of Inorganic Compounds at Various Temperatures"; cross-check Linke–Seidell / Monnin & Dubois (2005) J. Chem. Eng. Data | No (sourced), verify two sources |
| Hydrate stability (LiOH·H2O is the stable solid over the range) | Same as above / Monnin & Dubois | No |
| BPE of LiOH solutions | Computed from Eq. 11. φ from published osmotic-coefficient data if found (Monnin & Dubois), otherwise flagged estimate with slider | **Estimate (φ)** |
| Steam tables T_sat, P_sat, λ (40–150 °C) | NIST Chemistry WebBook (IAPWS-95); textbook steam-table appendix as cross-check | No |
| c_p of feed liquor | Estimate ~3.8–4.0 kJ/(kg·K) (dilute aqueous); look for a LiOH-specific value | **Estimate** |
| k for steam (~1.33), ideal-gas assumption | Thermo textbook (e.g., Çengel), stated assumption | Approximation |
| Compressor isentropic efficiency (~0.70–0.80) | Vendor literature (GEA, Veolia, SPX Flow MVR fan brochures) | **Estimate (range)** |
| Typical compression ratio / sat-T lift (fan ~1.2–2, lift ~5–20 K) | Same vendor literature | **Estimate (range)** |
| Heater ΔT (~5–10 K) | Vendor literature / textbook evaporator chapter | **Estimate** |
| Multi-effect economy loss factor | Textbook rule of thumb (Seader / McCabe-Smith evaporation chapter) | **Estimate** |
| Industrial electricity price (Texas and US) | U.S. EIA Electric Power Monthly, Table 5.6.A | No (dated) |
| Steam price | Derived: EIA Henry Hub gas price × fuel per t steam / boiler efficiency, cross-checked with Turton et al. utility costs | **Estimate (derived)** |
| Equipment cost correlations, CEPCI | Turton et al., *Analysis, Synthesis and Design of Chemical Processes* (CAPCOST); CEPCI from Chemical Engineering magazine | **Estimate** |
| Na/K in purified leach liquor, ε retained liquor | Literature/patents if found, otherwise flagged | **Estimate** |
| MSMPR growth rate G | Literature if found, otherwise flagged illustrative | **Estimate** |
| Industry facts (Tesla, Veolia, market share) | HANDOFF sources | Market share = estimate |

The References tab renders straight from `site/data/sources.json`. Each value shows an "estimate" badge in the UI where `is_estimate` is true.

---

## 5. Hand-calculation verification case (provisional numbers, recomputed in Phase 1)
**Inputs:** F = 10,000 kg/h · x_F = 0.06 · T_F = 80 °C · P₁ = 1.013 bar · x_sat = 0.13 (P) · purge P_g = 500 kg/h · φ = 0.80 (est.) · ΔT_heater = 6 K · η = 0.75 · k = 1.33 · c_p,F = 3.9 kJ/kg·K (est.) · heating steam for the single effect at 120 °C, λ_s = 2,202 kJ/kg.

| Step | Calculation | Result |
|---|---|---|
| Crystals | C = (600 − 0.13·500)/0.5708 | **937.3 kg/h** LiOH·H2O |
| Vapor | V = 10,000 − 500 − 937.3 | **8,562.7 kg/h** |
| Water check | 9,400 − 435 − 402.3 | 8,562.7 ✓ |
| Li yield | 535/600 | **89.2 %** |
| Molality | 0.13/(0.87·0.02395) | 6.24 mol/kg |
| BPE | 0.512·2·0.80·6.24 | **5.11 K** |
| T_boil | 100.0 + 5.11 | 105.1 °C |
| Duty | 8,562.7·2,257 + 10,000·3.9·25.1 (kJ/h) | 20.31 GJ/h = **5.64 MW** |
| Single-effect steam | 20.31e6/2,202 | 9,222 kg/h, E₁ = **0.93** |
| T_cond, P₂ | 105.1 + 6 = 111.1 °C → P_sat ≈ 1.491 bar | CR = **1.47** |
| w_s | 4.03·0.4615·378.3·(1.472^0.248 − 1) | 70.8 kJ/kg |
| w, W, e | 70.8/0.75; × 8,562.7/3,600 | **94.4 kJ/kg, 225 kW, 26.2 kWh/t** |
| COP | 8,562.7·2,257/(3,600·225) | ≈ 24 |

*Sanity:* 26 kWh/t sits inside the commonly quoted MVR range of roughly 20–40 kWh/t (to be confirmed with a vendor source). Single-effect economy just under 1 makes sense, because feed preheat eats some of the steam.

**Automated check:** `verification/handcalc.json` holds the inputs and expected outputs, each with a relative tolerance of 0.5%. `tests/handcalc.test.mjs` imports `site/js/physics.js` and asserts every output, using Node's built-in `node --test` (no dependencies). The Playwright check (§9) also loads the site with the default sliders and confirms the displayed KPIs match the JSON. Build B (Muse) has to print the same table, and its results are compared against the same JSON.

---

## 6. Plots ("No Plot = No Pay"); every calculation has one
| Calc | Plot (Plotly) | "What if?" |
|---|---|---|
| Mass balance (F5) | Sankey of LiOH and water: feed → vapor / crystals / purge | Increase purge → watch the crystal band shrink |
| Purge vs. purity (F5) | Dual-axis: Li yield and product Na ppm vs. purge % (marker at current) | Find the purge that just meets the spec line |
| Solubility (F6) | x_sat vs. T, with a cooling-path arrow vs. an evaporation-path arrow | Toggle "cool from 100→25 °C" and see the tiny yield |
| BPE (F3) | BPE vs. x; stacked bar of lift = BPE + ΔT_heater | Raise impurity / φ → watch the lift bar grow |
| Compressor (F3) | Power and kWh/t vs. ΔT_heater (curves for 2 BPEs) | Why does power grow faster than linearly? |
| Energy comparison (F2) | Grouped bars: equivalent energy per t water for 1/3/5 effects vs. MVR, plus economy vs. N | Raise BPE → effects become infeasible |
| Economics (F4) | Price map (p_el vs. p_steam) with crossover line + current-point marker; $/t vs. N | Drag the gas price → which side of the line are you on? |
| CAPEX (Ph 3) | Stacked bar CAPEX/OPEX per t product for each option | Turndown → cost per t rises |
| Turndown | kWh/t and $/t vs. feed rate | Does it still work at 60%? |
| MSMPR (Ph 4) | n(L) curves for 3 residence times | Double τ → L_D doubles |
| PFD (F1) | SVG with live stream labels | Click a unit and see its equation |

All plots share one colour per option (Single, 3-effect, 5-effect, MVR). Each has axis units, hover values, and responsive sizing.

---

## 7. Site structure (professor's order: significance → real process → theory → tool)
1. **Overview**: one-paragraph pitch, the key result ("MVR ≈ 26 kWh/t vs. ~1 t steam/t"), and a clear statement that this is an AI project comparing Claude vs. Muse, with links to the tabs.
2. **Industry Context**: why lithium hydroxide (high-nickel cathodes), US domestic refining push, Tesla Robstown (spodumene → kiln → alkaline leach → purification → crystallization), ~50 GWh/yr target, Veolia MVR crystallizers, MVR market share (flagged estimate), companies and countries.
3. **Theory**: evaporation as single-stage VLE (Module 2), BPE, why the flat solubility curve forces evaporative crystallization, supersaturation, binodal vs. spinodal (brief, at course level), seeding, why crystal size matters, multi-effect vs. MVR, compression as the most energy-intensive operation (Lecture 13), wet vapor and entrainment risk at the compressor. KaTeX equations, each with a "How does that make sense?" callout.
4. **Simulator**: sliders + KPIs + plots (§6), PFD (Ph 3), scenario presets.
5. **Model Comparison**: critique accept/reject table, Build A vs. B comparison table, link to the molab notebook.
6. **AI Process Log**: rendered from `docs/process-log.md` (fetched as markdown and rendered with a small pinned markdown library), plus the prompts.
7. **Video**: embedded YouTube.
8. **Transcript**: verbatim auto-transcript.
9. **References & Contributions**: from `sources.json`. Individual contributions: what I did vs. each AI.

---

## 8. Folder structure
```
/                      CLAUDE.md, README.md, netlify.toml
context/               course context (existing)
docs/                  plan-v1-claude.md, critique-muse.md, critique-response.md,
                       plan-v2-final.md, model-comparison.md, process-log.md, HANDOFF.md
site/                  ← Netlify publish dir (Build A, Claude)
  index.html
  css/style.css
  js/physics.js        pure calculation functions (ES module, unit-documented)
  js/data.js           loads data/*.json, interpolation helpers
  js/ui/*.js           one module per tab/panel (simulator, pfd, charts, router)
  data/                solubility.json, steam.json, prices.json, equipment.json, sources.json
  content/transcript.txt
  img/                 PFD assets, figures
molab-muse/            ← Build B (Muse, Marimo): mvr_explorer.py, README.md, molab link, Muse prompts
verification/          handcalc.md, handcalc.json, screenshots/ (claude/, muse/)
tests/                 physics.test.mjs, handcalc.test.mjs, browser-check.mjs (Playwright)
presentation/          slides .pptx
```

---

## 9. Verification phase
1. **Unit tests** (`node --test tests/`): each physics function against hand values; dimension spot checks (e.g., e[kWh/t] = w[kJ/kg]/3.6); limiting cases (BPE→0 and ΔT→0 ⇒ W→0; purge→0 ⇒ Y→1 and Na→∞ guarded; N=1 ⇒ E_N = E₁; CR = 1 ⇒ w = 0); monotonicity (W increases with ΔT_heater and BPE).
2. **Hand-calc test**: §5 JSON within 0.5% tolerance.
3. **Browser check** (`tests/browser-check.mjs`, Playwright with the preinstalled Chromium): serve `site/` locally (`python3 -m http.server`); visit all 9 tabs at desktop (1280 px) and mobile (390 px) widths; assert no console errors, no `.katex-error` elements, each Plotly div has data traces; move every slider to min/max and assert the KPIs stay finite and the charts update; check default KPIs match the hand-calc JSON. Save screenshots to `verification/screenshots/claude/`.
4. **Manual pass**: open the deployed Netlify URL on a phone; tick a checklist in `verification/handcalc.md`.
5. **Build B**: run Muse's notebook in molab, compare it to the hand-calc JSON, and screenshot into `verification/screenshots/muse/`.

## 10. Documentation workflow
- On approval: write this plan to `docs/plan-v1-claude.md`, append a process-log entry (prompt, clarifying Q&A, decisions), then commit and push to `claude/sharp-sagan-o9w20n`.
- Every later session appends an entry using the template in `docs/process-log.md`.
- `docs/model-comparison.md` tracks: correctness vs. hand-calc, first-run bugs, number of fix iterations, time, UI quality, whether it overcomplicated the material, and platform pros/cons (Netlify HTML vs. molab Python).

## 11. Deployment to Netlify
- `netlify.toml`: `[build] publish = "site"`, no build command. Headers for caching JSON.
- User connects the GitHub repo in Netlify (Add new site → Import from Git → `be-aa8/seperations`), production branch `main`, so deploy previews come from PR branches.
- CDN libraries pinned to exact versions (Plotly from cdnjs, KaTeX from jsdelivr). No build step.
- Link the molab notebook and the YouTube video from the site. Put the public URL in `README.md`.

## 12. What to ask Muse to critique
Prompt (saved verbatim in the log): *"You are reviewing a plan for an undergraduate (3rd-year ChemE level) interactive website. Check for errors and suggest improvements. Specifically:"*
1. Physics errors in the equations, especially BPE (Eq. 11–12), compressor work (Eq. 18–20), the multi-effect simplification (Eq. 15), and the mass/impurity balances.
2. Hand-calc arithmetic and whether the results are physically sensible (kWh/t, economy, CR).
3. Missing or doubtful data sources; values that should be flagged as estimates.
4. Whether anything goes beyond a 3rd-year undergrad level, or is oversimplified enough to be misleading.
5. Missing "how does that make sense?" interpretations or plots.
6. Feasibility of the 3-week schedule; what to cut.
7. Site structure vs. the professor's requested order; rubric coverage (assignment items 1–6).
8. Anything that would make the molab/Marimo version hard to build to the same spec.

## 13. Risks
- Sparse LiOH BPE data → φ slider with an estimate badge, plus a Theory note explaining the assumption.
- Equation rendering on mobile → KaTeX auto-render + Playwright `.katex-error` check.
- Second build drifts from spec → Muse gets the same JSON data and hand-calc file. The comparison is measured against the JSON, not against Build A.
- Schedule → Phase 4 is optional; Phase 2 alone satisfies the rubric's webapp item.
