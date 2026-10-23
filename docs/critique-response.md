# Response to Muse's critique: accept / reject table

**Inputs:** `docs/plan-v1-claude.md` (Claude) and `docs/critique-muse.md` (Meta AI Muse, verbatim).
**Output:** `docs/plan-v2-final.md`, which both builds follow.
**Who decided:** I made the final calls. Claude recomputed Muse's numbers and checked its claims against a quick web search before I decided.

**Tally:** 37 suggestions. 34 accepted, 2 partially accepted, 1 rejected. (Item 1a changed from partial to accepted after Phase 1. The original tally was 33/3/1.)

## Spot-checks run before deciding

| Muse claim | Check | Result |
|---|---|---|
| K_b ≈ 0.39 at 60 °C, not 0.512 | K_b = R·T²·M_w/ΔH_vap = 8.314·333.15²·0.018015/42,480 | **0.391. Muse is right** |
| Eq. 20 doesn't close | V·λ(111 °C) ≈ 5,297 kW, plus W = 225 kW, gives 5,522 kW, which is less than Q ≈ 5,640 kW | **Muse is right.** On an enthalpy basis (h_out − h_f,cond ≈ 2,314 kJ/kg) the shortfall is ~135 kW, about 220 kg/h of make-up steam |
| Superheat ≈ 89 kJ/kg, not 94.4 | h_in ≈ 2,686 kJ/kg (1.013 bar, 105 °C); h_out = h_in + w ≈ 2,780; h_g(1.49 bar) ≈ 2,692 | **~88 kJ/kg. Muse is right** |
| w at 60 °C ≈ 81 kJ/kg > 71 at 100 °C (same lift) | P_sat 60 °C = 19.9 kPa, 71.1 °C ≈ 32.7 kPa, so CR ≈ 1.64 and w_s ≈ 82 kJ/kg | **Muse is right** (a counterintuitive result, good for the talk) |
| Carnot COP 64; COP 24 ≈ 38% of Carnot | 384.3/(384.3 − 378.3) | **64. Muse is right** |
| ~240 kWh/t product | 26.2 × 8,562.7/937.3 | **239. Muse is right** |
| Cooling-route yield ≈ 300 kg/h hydrate | Evaporate to saturation, then cool to 25 °C | **Arithmetic right**, but it uses Muse's disputed 100 °C solubility (next row) |
| **x_sat(100 °C) = 17.5/117.5 = 0.149** | Web search: Wikipedia lists 17.5 **g/100 mL** at 100 °C. Parchem's supplier sheet gives **15.0 g/100 g water** at 100 °C (11.3 at 20 °C, 13.3 at 80 °C), which is x_sat = 0.130 | **Disputed.** Muse's "corrected" value looks like the per-100 mL figure read as per-100 g, which is exactly the basis trap Muse warned about in §3. v1's 0.13 matches the supplier number. A primary source (CRC Handbook / IUPAC-NIST Solubility Data Series / Monnin & Dubois 2005) decides it in Phase 1 |
| Battery-grade spec Na ≤ 80 ppm, K ≤ 30 ppm, LiOH ≥ 56.5% | Not checked yet | Plausible. Will be sourced from a producer datasheet; Muse's numbers are not used as-is |
| "2026 PCCP measurement 12.53 ± 0.09 g/100 g at 25 °C" | Not found yet | Treated as an unverified claim until the citation is found |
| GEA: MVR systems typically 30–50 kWh/t; fan CR 1.2–2.0 | Not checked yet | Will be confirmed against the GEA brochure in Phase 1 |

Sources for the solubility check: [Wikipedia, Lithium hydroxide](https://en.wikipedia.org/wiki/Lithium_hydroxide) · [Parchem LiOH anhydrous sheet](https://parchem.com/api/get-pdf/lithium-hydroxide-anhydrous-015315.pdf) · [Monnin & Dubois, Thermodynamics of the LiOH+H2O system (HAL)](https://hal-onera.archives-ouvertes.fr/UNIV-TLSE3/hal-00350526v1)

## Decisions

Muse's own importance tag is shown as **C** (critical), **S** (should fix), or **N** (nice to have).

| # | Tag | Muse suggestion | Decision | Reasoning |
|---|---|---|---|---|
| 1a | C | x_sat = 0.13 is wrong; use 0.149 | **Accept (after Phase 1 check; initially disputed)** | Phase 1 found 17.5 g/100 g water at 100 °C stated per 100 g water (ChemicalBook), consistent with Battelle BMI-1329 / Seidell (17.7 at 115.6 °C, maximum near 99 °C). Parchem's 15.0, which I had relied on, is the outlier. **Muse was right and I was wrong.** See the Phase 1 update below |
| 1b | C | K_b varies with T_sat | Accept | Verified (0.39 at 60 °C). Compute K_b(T_sat) from the same steam table that gives λ. Theory tab presents the formula as a water-activity approximation |
| 1c | C | x_sat ↔ BPE circular dependency | Accept | Fixed-point iteration inside one function (converges in a few steps because the solubility curve is flat). Marimo also needs this |
| 1d | C | Eq. 15 fails N=1; f_loss reads as compounding; "equal-area" is mislabeled | Accept | E_N = N·E₁·f̄_N with f̄₁ = 1 and a single total derate. Renamed "equal-ΔT". Each effect's BPE comes from its own concentration |
| 1e | C | Eq. 20 doesn't close; the superheat shortcut is sloppy | Accept | Verified. Use an enthalpy balance. Make-up steam is reported in the hand-calc and included in the operating cost and crossover |
| 1f | S | Retained liquor inconsistent with the main balances; wet vs. dry basis | Accept | Dry-product basis. The impurity calc is labelled a decoupled approximation (valid for ε ≤ 0.15) |
| 1g | S | Cooling-yield formula uses the wrong water basis | Accept | The comparison becomes "evaporate to saturation, then cool" |
| 1h | S | No feasibility guards; purge units inconsistent | Accept | Purge is given as % of feed. Infeasible inputs show a message instead of negative KPIs. Tests assert C ≥ 0 |
| 1i | S | Cross-check w_s against steam tables; define η | Accept | Print the % difference vs. h₂ₛ − h₁. η is defined as isentropic, with the vendor basis noted |
| 1j | N | Saturated exit liquor vs. supersaturation | Accept | One sentence in Theory: bulk liquor ≈ saturated, supersaturation is small and local |
| 2a | S | The "water check" isn't independent | Accept | Replaced with the heat-closure and steam-table checks |
| 2b | S | Compressor-only label, fan CR at the high end, Carnot COP, per-product basis | Accept | All verified. These become "how does that make sense?" lines |
| 3a | C | Solubility basis trap; extrapolation above 100 °C | Accept | Every JSON row records its basis and is converted in one place. Extrapolation is flagged in the UI |
| 3b | C | A battery-grade spec is needed for the purge plot | Accept | Source a producer datasheet. Muse's numbers get verified first. K gets the same balance as Na |
| 3c | C | Steam tables need an actual implementation route | Accept | `steam.json` at 1 °C spacing, generated with the Python `iapws` package and spot-checked against NIST. log P interpolation. Both builds use the same file |
| 3d | S | Henry Hub understates delivered steam cost | Accept | EIA industrial delivered gas price ÷ boiler efficiency |
| 3e | S | φ provenance; show BPE as a band | Accept | φ(m, T) from Monnin & Dubois if it can be extracted, otherwise a narrowed band |
| 3f | S | Missing data rows | Accept | Added: specific volume, U, ΔT_min, ΔH_cryst magnitude, Li₂CO₃ solubility, real liquor composition |
| 3g | N | Tesla wording, market share, CEPCI | Accept | "Enough LiOH for ~50 GWh/yr of batteries". Market share caveated |
| 4a | S | Replace binodal/spinodal with metastable zone | **Reject** (reframe instead) | Prof Co named "spinodal vs. binodal decomposition" for crystallization in Lecture 12 (~5:41), so he will ask about it. Keep it, framed correctly: binodal ↔ solubility curve, spinodal ↔ metastable limit (spontaneous nucleation), plus metastable zone width and a note on liquid–liquid "oiling out" |
| 4b | S | Drop the MSMPR math; CAPEX is design-course material | Accept MSMPR; **partial** CAPEX | L_D = 3Gτ stays as a Theory concept with a picture. Prof Co asked for published equipment prices and economics (Lecture 10, ~1:01:49), so keep one static, sourced, order-of-magnitude CAPEX bar labelled Class 5 (±50%), with no annualization sliders |
| 4c | N | Drop the "IAPWS-95" name | Accept | The site just says "steam tables" |
| 5a | S | Heater area vs. power trade-off plot | Accept | The most important missing plot. A = Q/(U·ΔT) next to compressor power |
| 5b | S | Pressure trade-off plot | Accept | w and volumetric flow vs. P |
| 5c | S | Dühring plot | Accept | |
| 5d | S | MVR heat-balance waterfall | Accept | Turns the Eq. 20 gap into a teaching point |
| 5e | N | Carnot marker, infeasible shading, ~3.7 %/K rule, T–s sketch | Accept (T–s sketch is stretch) | |
| 6a | C | Schedule cuts | **Partial** | Accepted: cut MSMPR, animation, dark mode, and print CSS; F7 becomes 2 static cards; static PFD first. Instead of cutting CAPEX entirely, keep one static bar (see 4b). The browser test becomes a smoke test, and the full slider min/max sweep moves to fast Node tests on `physics.js` |
| 6b | S | Day 4 and Day 9 gates; slides from Day 15; half a day to review Build B | Accept | |
| 7a | S | Split Industry Context; static PFD in Phase 2 | Accept | |
| 7b | C | Requirement traceability table | Accept | Added to plan v2 §7 |
| 7c | N | Overview slogan compares unlike quantities | Accept | |
| 8a | C | Build B parity = physics + 3 plots | Accept | A fair comparison of models and platforms |
| 8b | C | Fixed point in one Marimo cell | Accept | Copied verbatim into the brief |
| 8c | C | Embed the JSON in the notebook | Accept | |
| 8d | S | Language-neutral function spec plus test vectors | Accept | Expected values come from Build A's tested code |
| 8e | S | Marimo traps brief | Accept | Goes into `molab-muse/BRIEF.md` |

## Phase 1 update (2026-10-23): solubility dispute resolved in Muse's favour
- Sources found: ChemicalBook lists 12.8 g/100 g at 20 °C and 17.5 g/100 g at 100 °C on a per-100 g-water basis. The Battelle report BMI-1329, which draws on Seidell, gives 17.7 g/100 g water at 240 °F and reports a solubility maximum near 210 °F. PCCP 2026 measured 12.53 ± 0.09 g/100 g at 25 °C (CRC: 12.5). This confirms Muse's other "unverified" citation as well.
- Parchem's 15.0 g/100 g at 100 °C was derived by the supplier from 29.6 g hydrate/100 g water. It disagrees with the others and is not used.
- Frozen value: x_sat(100 °C) = 17.5/117.5 = **0.149**. The recomputed hand-calc (verification/handcalc.md) gives BPE 6.02 K, C 920 kg/h, yield 87.5 %, CR 1.51 and 28.2 kWh/t. These match Muse's knock-on numbers almost exactly.
- **Lesson:** my "the critic made the error it warned about" claim was itself wrong. I checked Muse against a single supplier sheet. The process worked because the decision was left open for primary sources instead of being settled by whichever model sounded more confident.

## Takeaways for the presentation
- The two models mostly agreed on structure. The real value of the critique was physics consistency (K_b(T), heat closure, Eq. 15) and scope control.
- **Muse's top "critical" fix looked like a units-basis error at first, but Phase 1 sources showed Muse was right.** The lesson cuts both ways: neither model's number should be trusted until a source is checked. The professor's "practically infallible when one model critiques another" claim held up here, but only once the sources were checked.
- I rejected one suggestion because I had context Muse didn't: what the professor said in lecture.
