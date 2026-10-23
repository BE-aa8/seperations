# Critique of plan v1 by Meta AI Muse

- **Date:** 2026-10-23
- **Model:** Meta AI Muse (chat)
- **Input:** the full text of `docs/plan-v1-claude.md`, preceded by the prompt below
- **Output:** Muse's reply, pasted verbatim (only the markdown formatting was preserved; no words changed)

## Prompt sent to Muse

```
You are reviewing a plan for an undergraduate (3rd-year chemical engineering level) interactive website about mechanical vapor recompression (MVR) evaporative crystallization of battery-grade lithium hydroxide monohydrate. Another AI model (Claude) wrote the plan. Check it for errors and suggest improvements. Specifically:

1. Physics errors in the equations, especially boiling point elevation (Eq. 11–12), compressor work (Eq. 18–20), the multi-effect simplification (Eq. 15), and the mass and impurity balances.
2. Hand-calculation arithmetic (Section 5), and whether the results make physical sense (kWh per tonne of water, steam economy, compression ratio).
3. Data sources that are missing or doubtful, and values that should be flagged as estimates.
4. Anything that goes beyond a 3rd-year undergraduate level, or is so simplified it becomes misleading.
5. Missing "how does that make sense?" physical interpretations or missing plots.
6. Whether the 3-week schedule is realistic, and what to cut.
7. Whether the site structure follows the professor's requested order (significance, then the real process, then theory, then the tool), and whether all 6 assignment requirements are covered.
8. Anything that would make a Python molab/Marimo version hard to build to the same spec.

For each suggestion, say how important it is (critical / should fix / nice to have) and why.

--- PLAN BEGINS ---
[full text of docs/plan-v1-claude.md]
```

## Muse's reply (verbatim)

Overall verdict: The structure and most of the arithmetic are good — I recomputed every hand-calc line and it all checks out given the inputs. The problems are in the inputs and in 3 equations: the provisional solubility at boiling temperature is wrong by enough to move the headline number, Eq. 15 contradicts your own unit test, and the MVR heat balance (Eq. 20) quietly fails to close in the hand-calc case. Details by your 8 questions, each tagged.

### 1. Physics errors

[critical] Solubility input poisons Eq. 2, 11, 12 — see §3 below, but it's a physics error in effect. x_sat = 0.13 is roughly the 25 °C value expressed as wt%. At 100 °C, solubility is ~17.5 g LiOH / 100 g water, i.e. x_sat = 17.5/117.5 = 0.149, not 0.13. Knock-on: m = 7.31 mol/kg, BPE ≈ 6.0 K (not 5.11), T_boil ≈ 106 °C, C ≈ 921 kg/h, yield 87.6%, CR ≈ 1.51, e ≈ 28.2 kWh/t (not 26.2). Still in the sane band, but the frozen `handcalc.json` must use the corrected value.

[critical] Eq. 11: K_b is not a constant over your pressure slider. K_b = R·T_sat²·M_w/ΔH_vap = 0.512 K·kg/mol only at 100 °C. At 0.2 bar (T_sat ≈ 60 °C) it's ≈ 0.39, at 40 °C ≈ 0.34. Using 0.512 across P = 0.2–1.5 bar overstates BPE by ~30–50% at vacuum — exactly where students will drag the slider. Fix: compute K_b(T_sat) inside the function from the same steam table that gives λ. Also flag honestly that the linear ebullioscopic law at m ≈ 6–7 mol/kg is an extrapolation of a dilute-solution law; present it as a water-activity approximation, and note φ is really φ(m, T), not an independent slider — the slider lets users pick unphysical (m, φ) pairs.

[critical] Eq. 11–12 hide a circular dependency. BPE depends on x_sat, and x_sat is evaluated at T_boil, which depends on BPE. The plan never says how this resolves. State it explicitly: either solve the fixed point by iteration inside one function (needed for Marimo, §8), or declare x_sat evaluated at T_sat(P) and justify it by the flat curve. Silence here guarantees Build A and Build B solve different problems.

[critical] Eq. 15 contradicts your own §9 test. §9 requires N=1 ⇒ E_N = E₁, but E_N ≈ N·E₁·f_loss gives E₁·f_loss at N=1. Also "f_loss ~0.85–0.9 per effect" reads as compounding — 0.87⁵ would crush a 6-effect economy to ~2.8, which is not the textbook rule. Fix: define E_N = N·E₁·f̄_N with f̄₁ = 1 and f̄_N a single derate (~0.8–0.85 total at large N), cited as such. Two smaller issues in the same equation: the feasibility check charges every effect the saturated-liquor BPE (early effects are dilute, so ΣBPE < N·BPE_sat — your version overstates the tax), and dividing the ΔT budget equally is an equal-ΔT model, not the "equal-area" model the text claims. Rename it.

[critical] Eq. 20 doesn't close in your own hand case, and the table hides it. Q_avail ≈ V·λ(P₂) + W ≈ 5,293 + 225 ≈ 5.52 MW < Q = 5.64 MW. There's a ~120 kW shortfall ≈ ~180–200 kg/h make-up steam (~2% of evaporation) — physically normal: GEA notes MVR plants often need "a small quantity of additional steam" and usually preheat feed with condensate. But §5 never reports it, and Eq. 23's crossover ignores it. Also the step "superheat ≈ W" is a unit-sloppy shortcut: superheat per kg ≈ w − (h_g(P₂) − h_in) ≈ 89 kJ/kg, not 94.4 — close numerically, wrong as a derivation. Show the derivation properly and add make-up steam to the hand table and to Eq. 22.

[should fix] Eq. 5–6 are inconsistent with Eq. 1–2. The retained liquor ε·C is an exit stream in the Na balance but doesn't exist in the total or LiOH balances (retained liquor also carries LiOH at x_sat out with the cake). And Eq. 6's /(1+ε) is a wet-cake basis; battery-grade product is sold dried, and on drying the water leaves but the Na stays, so per dry kg it's ≈ ε·w_Na,ML. Pick one boundary, state the basis, and label the impurity calc an approximation decoupled from the main balance (defensible at ε ≤ 0.15, but say it).

[should fix] Eq. 8 (cooling yield) has the wrong water basis and undercuts your own thesis. As written, a student will plug in feed water (9,400 kg) and get ΔC_cool ≈ 823 kg/h hydrate — comparable to the evaporative yield, "proving" cooling works. The honest sequence is: evaporate first to saturation at 100 °C (water left = 600/0.175 ≈ 3,429 kg), then cool: only ~171 kg LiOH ≈ 300 kg/h hydrate precipitates, a 29% single-pass yield with the rest recycled. That's the comparison that makes the point. (Minor: the formula also ignores water consumed into the hydrate.)

[should fix] No feasibility guards on the slider space. §2 says purge is 1–15% of feed, §3/§5 use P_g in kg/h — reconcile. Combinations in range give F·x_F < P_g·x_sat → negative crystals (x_F = 0.02, purge 15%, x_sat = 0.149 nearly zeroes C), and x_F up to 0.10 vs. x_sat(T_F) can imply a feed that's already supersaturated. The simulator needs an explicit infeasible-region message, not negative KPIs — your Playwright test only asserts "finite," and negative crystals are finite.

[should fix] Compressor model needs one steam-table cross-check. Eq. 18 (ideal gas, k = 1.33) is fine at this level, but Phase 1 should validate w_s at the hand point against h₂ₛ − h₁ from real steam tables and print the % difference — near saturation Z ≈ 0.97 and k drifts. Also define η: vendor fan literature usually quotes polytropic/total efficiency, not isentropic; mixing them biases W. And state that Eq. 19 assumes compressor flow = V exactly (no desuperheating injection, no venting).

[nice to have] Eq. 9 vs. Eq. 2 tension. The mass balance assumes exit liquor is exactly saturated, then Theory introduces S = x/x_sat > 1 as the driving force. One sentence resolves it: bulk exit liquor ≈ saturated; supersaturation is a small, local, in-crystallizer quantity. Without it, a good student will spot the contradiction in your presentation Q&A.

### 2. Hand-calculation arithmetic

[verified — no fix] Every line is arithmetically correct given the inputs: C = 937.3, V = 8,562.7, yield 89.2%, m = 6.24, BPE = 5.11 K, Q = 20.31 GJ/h = 5.64 MW, steam 9,222 kg/h, E₁ = 0.93, P₂ = 1.491 bar (steam tables confirm), CR = 1.47, w_s = 70.8, w = 94.4 kJ/kg, W = 225 kW, e = 26.2 kWh/t, COP ≈ 24. Two caveats:

* [should fix] The "water check" is not a check. V was defined as F − P_g − C, so the water row must close identically. Replace with a genuinely independent check (e.g., steam-table w_s cross-check, or the Eq. 20 heat closure — which currently fails, see §1).
* [should fix] Physical-sense framing. (a) 26.2 kWh/t is compressor-only; GEA's typical MVR figure is ~30–50 kWh/t system, and a forced-circulation crystallizer's circulation pump is a real load — label the KPI "compressor only" or add an auxiliaries allowance, or the prof's "is that realistic?" answer is awkward. After the solubility correction (~28 kWh/t) this lands better anyway. (b) CR = 1.47 with an 11.1 K saturation lift is at the top end for a single-stage centrifugal fan — GEA gives 1.2–2.0 for such fans and notes multiple fans for high lifts — so it's achievable, but say "single-stage fan, high end; two stages if lift grows." (c) Add the free sanity check: Carnot COP between 378 K and 384 K is 64, so COP 24 ≈ 38% of Carnot — plausible, and it's a great "how does that make sense?" line. (d) Warn in the UI that 26 kWh/t water = ~240 kWh/t product — the per-tonne basis is the easiest misreading in the whole project. E₁ = 0.93 is sensible (feed preheat eats the λ_s/λ advantage, ratio 2,257/2,202 ≈ 1.025).

### 3. Data sources: missing or doubtful

[critical] The solubility basis trap is the #1 data risk. Published tables come in three incompatible bases: g LiOH/100 g water (12.5 at 25 °C, confirmed by a 2026 PCCP measurement of 12.53 ± 0.09), g monohydrate/100 g water (22.3 — same physical solubility × 1/0.5708), and g/100 mL. A builder who grabs the monohydrate row gets x_sat wrong by 75%. Phase 1 must record the basis of every row in the JSON and convert once, centrally. Also note the table ends at 100 °C but T_boil ≈ 106 °C — the extrapolation must be flagged, not silent.

[critical] No source for the battery-grade spec — yet F5's plot needs a spec line. Without it the purge-vs-purity plot has no target and the feature has no conclusion. Typical published battery-grade specs are LiOH ≥ 56.5 wt%, Na ≤ 0.008 wt% (80 ppm), K ≤ 0.003 wt% (30 ppm) — get this from a named supplier datasheet (Albemarle/Arcadium class) rather than a reseller PDF, and add it to §4. Note the spec immediately makes F5 solvable: e.g. at ε = 0.05, meeting 80 ppm product Na requires w_Na,ML ≤ ~1,700 ppm, which sets the purge. Also: §3 says "Na/K build-up" but only models Na — either run the same balance for K (it's free, same equation) or drop K from the text.

[critical] "NIST WebBook steam tables" is not an implementation. There's no callable table there for `physics.js` or Marimo. Specify the actual route now: precomputed IAPWS table at 1 °C spacing with log-interpolation for P_sat (linear P interpolation over 5 °C steps will by itself break your 0.5% hand-calc tolerance), or a CoolProp/`iapws` call in Python plus a fitted Antoine-type correlation in JS. Both builds must use the same table — ship `steam.json` as the single source.

[should fix] Steam price from Henry Hub spot understates delivered steam. Use EIA industrial delivered gas price, then ÷ boiler efficiency (~0.8), plus a line for water treatment/blowdown if you claim Turton cross-check. As specified, the crossover line in F4 will be biased toward steam looking cheap.

[should fix] φ provenance. Monnin & Dubois Pitzer parameters are fitted largely at ≤ ~100 °C and specific molalities; if φ(m, T_boil) can't be extracted, narrow the slider to a defensible band and show BPE as a band on the F3 plot rather than a line. Either way, §4 should list what φ actually is at the hand point from the correlation, not just "0.80 (est.)".

[should fix] Missing rows in §4: vapor specific volume/density (needed for any compressor sizing claim and for the vacuum story in §5 below); heater U (needed if you add the area tradeoff, §5); ΔT_min value+source for Eq. 15's feasibility test (currently an undefined symbol); heat of crystallization — "neglected" needs a magnitude argument (find ΔH of solution/crystallization from NBS/DIPPR data; order-of-magnitude it's ~1% of duty, so prove it's negligible rather than assert it); Li₂CO₃ solubility vs. T (retrograde — it's why it scales hot surfaces) for F7; and a primary source for actual purified-liquor LiOH concentration and Na/K levels entering a real crystallizer (Tesla's TCEQ/SEC filings or Veolia case material), because the 6 wt% / ppm defaults are currently invented ranges with plausible shapes.

[nice to have] Tesla's figure should be phrased "enough LiOH for ~50 GWh/yr of batteries", not a 50 GWh/yr plant output. Drop or heavily caveat "MVR market share" — no defensible source exists. Verify a current CEPCI value is actually obtainable in 2026 before Phase 3 depends on it; Turton CAPEX is ±30–50% (Class 5) and must be labelled that way wherever a $/t number appears.

### 4. Level: too advanced / misleadingly simple

* [should fix] Binodal vs. spinodal in Theory is a category error risk. Those are liquid–liquid demixing concepts; for solid–liquid crystallization the course-level frame is solubility curve + metastable zone width + primary/secondary nucleation. Unless the prof's Module 2 explicitly used binodal/spinodal for this, replace it — a separations prof is likely to probe exactly this.
* [should fix] MSMPR population balance (Eq. 25) and CAPCOST/CEPCI annualization (Eq. 24) are design-course material. Keep L_D = 3Gτ as an idea with a picture; drop n(L) = n⁰exp(−L/Gτ) manipulation. Keep CAPEX, if at all, as one static order-of-magnitude bar. Also note τ is undefined by your simulator inputs (no slurry volume or magma withdrawal rate) — the MSMPR panel can't be coupled to F5 and shouldn't pretend to be.
* [nice to have] Drop the name "IAPWS-95" from student-facing text ("steam tables") — it signals depth you don't use. The osmotic-coefficient formalism is borderline-fine if Theory teaches it as "ions tie up water; φ measures how much, <1 means less than ideal" — one sentence, no Pitzer.

### 5. Missing interpretations and plots

* [should fix] Heater area tradeoff — the most important missing plot. With only Eq. 18–19 visible, smaller ΔT_heater is always better (less power), so students will ask why anyone chooses 6–10 K. Add A = Q/(U·ΔT) as a curve next to the power curve: power ↓, area ↑ as ΔT ↓ — that is the design decision in MVR. Without it F3 teaches the wrong lesson.
* [should fix] Pressure tradeoff plot. Your model as coded makes vacuum look nearly free. In fact (i) for a fixed ΔT lift, CR rises as T falls (Clausius–Clapeyron slope λ/RT² grows), which is why w at 60 °C ≈ 81 kJ/kg > 71 at 100 °C despite the lower T₁ — a lovely counterintuitive "how does that make sense?"; and (ii) specific volume explodes, 1.7 → 7.7 m³/kg from 1.0 → 0.2 bar, so the fan gets enormous. Plot w and volumetric flow vs. P together.
* [should fix] Dühring plot (T_boil of solution vs. T_sat of pure water at same P, near-straight lines per concentration) — it's the classic, examinable BPE representation and explains BPE better than BPE-vs-x alone.
* [should fix] Heat-balance waterfall for the MVR loop: Q_latent, Q_preheat, Q_avail, shortfall/make-up. This is where the Eq. 20 gap becomes a teaching point instead of an inconsistency.
* [nice to have] T–s diagram sketch for the compression (inlet superheat = BPE made visible); a Carnot-COP marker on the COP KPI; infeasible-region shading on the F2 bars instead of bars for effect counts that fail the ΔT test; the "≈3.7% pressure rise per kelvin of lift at 100 °C" rule of thumb as the verbal answer to "why does power more than double when ΔT doubles?" (because CR is exponential in lift and w is convex in CR).

### 6. Schedule realism

[critical] As scoped, it's ~4.5 weeks of work in 3. Nine tabs, 11 plots, an interactive SVG PFD, impurity model, CAPEX, scenarios, exhaustive Playwright slider sweeps, two builds, PowerPoint, and a recorded practice talk — with Phase 4 (Days 14–17) overlapping Phase 5 (Days 15–21), which already concedes the collision. Cuts, in order:

1. Cut CAPEX (Phase 3) entirely — highest effort, weakest data, most beyond-level (§4), and F4 survives on OPEX alone if honestly renamed "operating-cost crossover."
2. Cut MSMPR and animated PFD/dark mode/print CSS — already nominal stretch; make it official so it stops exerting gravity.
3. Cut F7 to two static text cards or cut it — patent-citing is slow.
4. Reduce the browser check to a smoke test (tabs load, no console/KaTeX errors, default KPIs match JSON, one slider move per tab). The min/max sweep of every slider is a day of debugging edge cases that §1's feasibility guards will generate.
5. Keep turndown presets (they're just slider presets — cheap) and keep F1, but build the PFD static-first in Phase 2 with live labels, clicking in Phase 3 only if the Day-9 gate passes.

[should fix] Add two hard gates: Day 4 — data frozen or fallback values declared (Phase 1 is the true critical path; solubility/BPE sourcing can eat a week if Monnin & Dubois doesn't yield φ at temperature); Day 9 — MVP feature freeze, after which only content and fixes. Start slides at Day 15 by taking them from the site's section order, not as a parallel workstream. Budget half a day explicitly for reviewing Build B — parallel builds aren't free to the person who must verify both against the JSON.

### 7. Site structure and rubric coverage

[should fix] The professor's order is followed for tabs 1–4 (Overview = significance → Industry = real process → Theory → Simulator = tool), and putting Model Comparison / Process Log / Video / Transcript / References after the tool is the right call — they're evidence, not narrative. Two fixes: (a) Industry Context currently mixes significance (why LiOH, domestic push, market) with the real process; split it with explicit sub-headings in the prof's order, significance first, then the Robstown walk-through. (b) The real process needs a static PFD in Industry Context from Phase 2 — as phased, the only process diagram lives in the Simulator and arrives in Phase 3, so for most of the build the "real process" section is text about a flowsheet the reader can't see.

[critical — documentation gap] The plan never enumerates the 6 assignment requirements, so coverage cannot actually be audited from the plan. Everything I can infer (significance, real process, theory, interactive tool, video + verbatim transcript, AI process log / model comparison + references & contributions) appears covered by the 9 tabs, but "appears" is doing the work. Add a traceability table to §7 — requirement → tab → file/evidence — in plan v2. It's ten minutes now and it's the difference between arguing coverage at grading time and pointing at it. Related: fold "Contributions" into its own visible block, not a shared tab title, if individual-vs-AI attribution is one of the six.

[nice to have] Fix the Overview slogan: "MVR ≈ 26 kWh/t vs. ~1 t steam/t" compares unlike quantities. Use "~28 kWh of electricity replaces ~1.1 t of steam per tonne of water evaporated" (and update after the solubility fix).

### 8. Marimo / molab buildability

* [critical] Define Build B's parity scope as physics + 3 plots, not the 9-tab site. Marimo has no hash routing and re-creating 9 tabs, a clickable SVG PFD, Sankey, and a draggable price-map marker in `mo.ui.plotly` is a second full project. Fair comparison = same JSON in, same hand-calc table out, plus BPE, compressor, and economics plots. State this in plan v2 or the comparison in `model-comparison.md` will grade Muse on UI features Marimo is bad at.
* [critical] Marimo's reactive DAG forbids cyclic cells. The x_sat(T_boil) ↔ BPE loop (§1) must live inside a single function in a single cell — if Build B spreads it across cells the notebook won't run. Put this sentence in the handoff to Muse verbatim.
* [critical] Data locality. A molab notebook cannot read `site/data/*.json` by relative path. The handoff must say: embed the JSON as dict literals in one cell (preferred — notebook stays self-contained and reproducible) or fetch from the deployed Netlify URL (fragile, adds a network dependency to a "verification" artifact).
* [should fix] One hand-calc case is not a porting spec. `physics.js` won't translate itself; give Build B a language-neutral function list (name, inputs, units, outputs) plus 4–6 additional test vectors (vacuum case, ΔT = 3 and 15, N = 1 and 5, purge → 0) with expected outputs from Build A's tested code. Otherwise the two builds will diverge in interpolation and Psat method and the "comparison" measures porting noise.
* [should fix] Marimo-specific traps to warn Muse about in the brief: top-level variable names can't be redefined across cells (a long simulator written naively will error constantly — put state in functions/dicts); Plotly figures are rebuilt wholesale on every slider move (fine at this size, but drop the Sankey in Build B); KaTeX renders via `mo.md`with slightly different escaping — equations should be pasted and checked, not assumed portable; notebook "tests" should be one assert-and-print cell comparing against `handcalc.json` values embedded alongside the data.

Bottom line for plan v2: fix x_sat and K_b(T), rewrite Eq. 15 and Eq. 20, source the battery-grade spec, add the heater-area and pressure-tradeoff plots, cut CAPEX/MSMPR/animation, and add the rubric traceability table. Everything else in the plan — phasing logic, JSON-driven references, the hand-calc-as-contract between the two builds — is genuinely well designed and should survive unchanged.
