# Hand-calculation verification case (frozen in Phase 1)

This is the case both builds must reproduce within **0.5 %**. The expected numbers come from `verification/handcalc.py`, a standalone Python script that reads the same `site/data/*.json` files the builds use. Neither build imports it, so it checks them independently. Machine-readable answers are in `verification/handcalc.json`, and six extra "what if" cases are in `verification/vectors.json`.

Re-run with `python3 verification/handcalc.py`. Install `iapws` first if you also want the steam-table cross-check.

## Inputs
| Input | Value | Source |
|---|---|---|
| Feed F | 10,000 kg/h | design choice |
| Feed LiOH mass fraction x_F | 0.06 | estimate (no public plant value found) |
| Feed temperature T_F | 80 °C | design choice |
| Crystallizer pressure P₁ | 101.325 kPa | design choice |
| Purge | 5 % of feed = 500 kg/h | design choice |
| Osmotic coefficient φ | 0.80 | estimate (band 0.70–0.95) |
| Heater ΔT | 6 K | estimate |
| Compressor isentropic efficiency η | 0.75 | estimate |
| k for steam | 1.33 | Çengel Table A-2 |
| c_p of feed | 3.9 kJ/(kg·K) | estimate |
| Heating steam (single/multi-effect) | 120 °C, λ_s = 2,202.2 kJ/kg | steam table |
| Retained liquor ε | 0.05 kg/kg | estimate |
| Na / K in feed | 100 / 30 ppm | estimate |
| Electricity | $0.0612/kWh (TX industrial, 2024) | EIA (confirm) |
| Gas | $3.72/Mcf (TX industrial, 2025) | EIA |
| Solubility | 12.53 g/100 g water at 25 °C, 17.5 at 100 °C, 17.7 at 115.6 °C | PCCP 2026, ChemicalBook, Battelle BMI-1329 |

## Worked solution
Each line gives the equation, the numbers with units, and "how does that make sense?"

**1. Boiling point (fixed-point loop, converged in 3 iterations)**
- T_sat(101.325 kPa) = 99.97 °C (steam table).
- K_b = R·T²/λ = 8.314 × 373.12² / 2,256,500 J/kg = **0.513 K·kg/mol**.
- x_sat(T_boil) = 17.58/117.58 = **0.1495**. Molality m = 0.1495 / (0.8505 × 0.02395 kg/mol) = **7.34 mol/kg**.
- BPE = K_b·ν·φ·m = 0.513 × 2 × 0.80 × 7.34 = **6.02 K**. So T_boil = **106.0 °C**.
- *Sense:* a saturated LiOH solution is about 7 molal in ions × 2. The ions hold water back, so the solution must be about 6 K hotter than pure water to boil at 1 atm. The loop converges quickly because solubility barely changes over those 6 K.

**2. Mass balance**
- C = (F·x_F − P_g·x_sat)/r_h = (600 − 500 × 0.1495)/0.5708 = **920.2 kg/h LiOH·H₂O**.
- V = F − P_g − C = **8,579.8 kg/h**.
- Li yield = 525.3/600 = **87.5 %**.
- *Sense:* to get about 0.9 t of crystals we have to boil off about 8.6 t of water. The purge carries away the remaining 12.5 % of the lithium.

**3. Evaporator duty (enthalpy basis)**
- Vapor leaves at 1 atm superheated by the BPE: h_v1 = h_g(99.97 °C) + c_p,v × 6.02 = **2,688.0 kJ/kg**. IAPWS gives 2,687.97, so the c_p shortcut is off by only 0.08 kJ/kg.
- Q = F·c_p·(T_boil − T_F) + V·(h_v1 − h_f(T_boil)) = 281.6 + 5,347.1 = **5,628.8 kW**.
- Heat of solution of the hydrate: 3.6 kJ/mol ≈ 86 kJ/kg × 920 kg/h ≈ 22 kW, which is **0.39 % of Q**. This is why we neglect it.
- *Sense:* 95 % of the heat goes into turning water to vapor. Warming the feed from 80 to 106 °C is the small remainder.

**4. Single- and multi-effect steam**
- Single effect: S = Q/λ_s = 5,628.8 × 3,600 / 2,202.2 = **9,202 kg/h**. Economy E₁ = V/S = **0.932**.
- N effects (equal-ΔT teaching model): E_N = N·E₁. The temperature budget runs from 120 °C steam to a 50 °C last effect.
  - 5 effects: E₅ = **4.66**. ΣBPE = 20.1 K, which leaves **10.0 K per effect** (≥ 5 K, so feasible). All of N = 1–6 are feasible; N = 6 leaves 7.7 K per effect.
- *Sense:* one kg of steam boils about one kg of water, because both latent heats are about 2,200 kJ/kg. Each extra effect reuses the vapor once more, but the BPE "tax" eats about 4 K of the 70 K budget per effect.

**5. MVR compressor**
- T_cond = 106.0 + 6 = **112.0 °C**. P₂ = P_sat(112 °C) = **153.3 kPa**. CR = **1.513**.
- Saturation-temperature lift = 112.0 − 99.97 = **12.0 K**. Single-stage fans handle CR of about 1.2–2.0 (GEA).
- w_s = [k/(k−1)]·R·T₁·[CR^((k−1)/k) − 1] = 4.03 × 0.4615 × 379.15 × (1.513^0.248 − 1) = **76.26 kJ/kg**.
- **Steam-table cross-check:** h₂ₛ − h₁ = 2,763.02 − 2,687.97 = 75.05 kJ/kg. The ideal-gas result is **1.6 % high**, which is acceptable for a course-level model.
- w = w_s/η = **101.7 kJ/kg**. W = 8,579.8/3,600 × 101.7 = **242.3 kW**.
- e = w/3.6 = **28.2 kWh per t water evaporated (compressor only)**, which is ≈ **263 kWh per t product**.
- *Sense:* we never pay for the 2,250 kJ/kg latent heat again. We only pay to "lift" the vapor 12 K so it can condense on the hot side. That costs about 100 kJ/kg, roughly 4 % of the latent heat.

**6. Heat closure and make-up steam (independent check, replaces v1's tautological "water check")**
- h_out = h_v1 + w = **2,789.7 kJ/kg**. That is 95.6 kJ/kg of superheat above h_g(P₂).
- Q_avail = V·(h_out − h_f(112 °C)) = **5,528.9 kW**, which is less than Q = 5,628.8 kW.
- Make-up steam = (Q − Q_avail)/λ_s = **163 kg/h**, about **1.9 % of V**.
- *Sense:* the recycled vapor can't also pay for warming the feed. A little live steam, or a condensate–feed preheater, covers that gap. Real MVR plants do exactly this.

**7. Efficiency sanity check**
- COP = Q_avail/W = **22.8**. Carnot COP between 106.0 °C and 112.0 °C = 385.15/6.0 = **64.2**. So MVR runs at about **36 % of the Carnot limit**.
- *Sense:* every kJ of electricity moves about 23 kJ of heat. That's why MVR wins even though a kJ of electricity costs more than a kJ of steam.

**8. Heater area trade-off**
- A = Q/(U·ΔT) = 5,628,800 / (2,000 × 6) = **469 m²** (U is an estimate).
- *Sense:* halving ΔT_heater to 3 K cuts compressor energy to 21.1 kWh/t (see vectors) but doubles the heater area. That is the core design trade-off.

**9. Why not cooling crystallization?**
- Even after first evaporating to saturation at 106 °C (water left = 600/0.1758 = 3,414 kg/h), cooling to 25 °C recovers only 3,414 × (0.1758 − 0.1253) = 172 kg LiOH, which is **302 kg/h hydrate**. That is a **29 % single-pass yield**.
- *Sense:* the solubility curve is too flat for cooling to drive crystallization, so the water has to be boiled off.

**10. Impurities (decoupled approximation, dry product basis)**
- Na in mother liquor = F·w_F/(P_g + ε·C) = 10,000 × 100 ppm / (500 + 46) = **1,831 ppm**. Product Na ≈ ε × 1,831 = **91.6 ppm**. That **fails** the 50 ppm spec.
- K in product = **27.5 ppm**, which meets the 30 ppm spec.
- Purge needed to meet the Na spec: **9.6 % of feed**, which drops the Li yield to **76 %**.
- *Sense:* the impurity can only leave with the purge or the liquor film on the crystals. Purity is bought with lithium yield.

**11. Operating cost per tonne of water evaporated (Texas prices)**
- Steam (fuel only) = $3.72/Mcf ÷ 1.038 MMBtu/Mcf × 2.148 MMBtu/t ÷ 0.857 = **$8.98/t**.
- MVR: 28.2 kWh/t × $0.0612/kWh + 0.019 × $8.98/t = **$1.90/t**.
- Steam evaporators: 1 effect $9.63/t, 3 effects $3.21/t, 5 effects $1.93/t, 6 effects $1.61/t.
- *Sense:* with cheap Texas gas, MVR only just beats a 5-effect evaporator on energy cost. The case for MVR there rests on capital cost (one body vs. 5), footprint, and no boiler. With higher gas prices MVR wins clearly. The crossover plot is where this "what if?" gets explored.

## Extra test vectors (vectors.json)
| Case | T_boil (°C) | CR | kWh/t water | C (kg/h) | Make-up (kg/h) |
|---|---|---|---|---|---|
| Base (above) | 106.00 | 1.513 | 28.24 | 920.2 | 163 |
| Vacuum 20 kPa | 64.01 | 1.561 | 27.13 | 936.2 | 0 |
| ΔT_heater 3 K | 106.00 | 1.368 | 21.12 | 920.2 | 214 |
| ΔT_heater 15 K | 106.00 | 2.023 | 49.91 | 920.2 | 8 |
| Purge 1 % | 106.00 | 1.513 | 28.24 | 1,025.0 | 153 |
| Feed 3 wt % | 106.00 | 1.513 | 28.24 | 394.6 | 145 |
| η = 0.65 | 106.00 | 1.513 | 32.59 | 920.2 | 102 |

Physical checks on these vectors:
- **Vacuum:** BPE falls to 3.95 K, because K_b(60 °C) ≈ 0.39 and solubility is lower. Even so, CR *rises*, from 1.51 to 1.56. Near 60 °C each kelvin of lift needs a bigger pressure ratio. The vapor is also about 4.6× less dense, so the fan must be much larger.
- **ΔT 15 K:** CR exceeds 2.0, which is beyond a single fan, so a second stage is needed. The simulator must flag this.

## How it is checked automatically
- `handcalc.py` asserts these conditions on every run:
  - the mass balance closes;
  - K_b(100 °C) = 0.512 and K_b(60 °C) ≈ 0.39;
  - zero lift gives zero work;
  - N = 1 gives E₁;
  - the kJ/kg → kWh/t conversion is right;
  - every `source_id` resolves in `sources.json`.
- In Phase 2, `tests/handcalc.test.mjs` will load `handcalc.json` and `vectors.json` and assert Build A's `physics.js` against them within 0.5 %. The browser smoke test also checks the default KPIs on the page.
- Build B (Muse) embeds the same JSON and asserts against it in one notebook cell.

## Manual checklist (Phase 5)
- [ ] Deployed site shows these default KPIs
- [ ] Every tab and chart renders on a phone
- [ ] Equations render, with no KaTeX errors
