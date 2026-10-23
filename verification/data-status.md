# Day 4 gate: data status

**Gate result: PASSED with declared fallbacks.** Every value the simulator needs has either a cited source or an estimate flagged in the JSON (`is_estimate: true`). Nothing is blank. Phase 2 can start.

**Sourcing limitation:** the build container could not open web pages directly (WebFetch and curl to non-package hosts were blocked by the network policy). All values were found through web search, and their text came from search-result snippets. Sources marked `verify_direct: true` in `site/data/sources.json` should be opened once by a human.

## Frozen (sourced)
| Value | Source | Notes |
|---|---|---|
| Steam tables, 40–150 °C | IAPWS-IF97 (`iapws` 1.5.5) | 5 spot checks vs. Çengel Table A-4 agree within 0.021 % |
| LiOH solubility 25 °C = 12.53 g/100 g water | PCCP 2026 (measured); CRC 12.5 | |
| LiOH solubility 100 °C = 17.5 g/100 g water | ChemicalBook; consistent with Battelle BMI-1329 (17.7 at 115.6 °C) | **Muse's value confirmed.** Parchem's 15.0 rejected as an outlier |
| Molar masses, R, ν | Standard atomic weights | |
| k = 1.33, R_steam | Çengel Table A-2 | Ideal-gas w_s is 1.6 % high vs. steam tables |
| ΔH_solution LiOH·H₂O = 3.6 kJ/mol | Parchem sheet | Only used to show it is 0.4 % of duty |
| Li₂CO₃ solubility 0–100 °C (retrograde) | Parchem sheet | For the F7 card |
| Fan CR 1.2–2.0 (single stage) | GEA | |
| Multi-effect economy E_N = e·N, e = 0.75–0.95 | AIChE CEP 2018; Swenson | |
| Boiler efficiency 0.857 | DOE Steam Tip Sheet #15 | |
| TX industrial gas $3.72/Mcf (2025) | EIA | |
| Battery-grade spec: Na < 50 ppm, K < 30 ppm, LiOH ≥ 56.5 % | AK Scientific (reseller) | Specs vary widely between sheets; producer datasheet not found |

## Fallbacks (estimates, flagged in the UI)
| Value | Fallback | Why / how to improve |
|---|---|---|
| Solubility shape between 25 and 100 °C | Linear interpolation | Only end points sourced. Get the CRC table or Monnin & Dubois (2005) curve (UC library). Affects vacuum cases most |
| φ (osmotic coefficient) | 0.80, band 0.70–0.95 | Monnin & Dubois Pitzer model not reachable; BPE shown as a band |
| c_p of feed liquor | 3.9 kJ/(kg·K) | No LiOH-specific value found |
| U, forced circulation | 2,000 W/(m²·K), range 1,000–2,800 | Weak sources; check Perry's / McCabe-Smith |
| ΔT_min per effect | 5 K | Rule of thumb |
| Multi-effect steam 120 °C / last effect 50 °C | Design choice | |
| Compressor η | 0.75 (0.60–0.85) | No vendor number found; isentropic vs. polytropic basis unresolved |
| Heater ΔT | 6 K (3–15) | |
| ε retained liquor | 0.05 (0.02–0.15) | |
| Feed composition (6 wt % LiOH, 100 ppm Na, 30 ppm K) | Estimates | No public Tesla/Veolia crystallizer-feed data found |
| TX industrial electricity $0.0612/kWh (2024) | EIA, quoted via a secondary site | Confirm the TX row in EIA Table 5.6.A. US industrial $0.0813 is directly from EIA |
| Gas heat content 1.038 MMBtu/Mcf | Typical EIA value | Confirm |
| GEA "30–50 kWh/t system" (Muse's claim) | **Not used** | Not found in reachable GEA pages |
| CAPEX prices | Not yet | Phase 3 |

## Open items for Andrew
1. If you can reach the UC library: get the CRC Handbook table "Aqueous Solubility of Inorganic Compounds at Various Temperatures" (LiOH row), or the Monnin & Dubois (2005) paper. That fixes the solubility curve shape and possibly φ.
2. Open the EIA Texas electricity page and confirm the 2024 industrial price.
3. Check the 5 steam-table spot values against the Çengel appendix in your thermo book.
