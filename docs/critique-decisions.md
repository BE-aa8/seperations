# Critique decisions: Gemini's review of plan v1

**Status: DRAFT, written by Claude for Andrew to review.** The rubric asks *me* to justify accept/reject, so I edit the "Decision" and "Reasoning" columns until they're mine, then tick "Approved". After that, Claude merges the accepted items into `plan-v2-final.md`.

Source: `docs/critique-v1-gemini.md` (verbatim). Gemini's severity in brackets.

## Fact-checks Claude ran before drafting

1. **Gemini's #1A numbers are wrong.** Checked against the IAPWS-IF97 saturation equation (the formulation behind NIST's steam tables):

   | | Antoine (plan) | IAPWS-IF97 | Linear interp, 5 °C grid |
   |---|---|---|---|
   | P_sat(55.49 °C), kPa | 16.075 | 16.136 | 16.172 |
   | P_sat(66 °C), kPa | 26.085 | 26.183 | 26.273 |
   | r = P2/P1 | 1.6227 | 1.6226 | 1.6245 |
   | w_s, kJ/kg | 79.08 | 79.07 | 79.28 (+0.25 %) |

   Antoine is about 0.38 % low at *both* temperatures, so the error cancels in r. Gemini's claim (r = 1.616, 0.95 % error, test fails on the first run) traces to an arithmetic slip: it got 26.071 kPa for Antoine at 66 °C (correct: 26.085). Linear interpolation actually makes r slightly *higher*, not lower. Its recommended fix is still good practice.
2. **Gemini's #4 is right.** T2 = T1[1 + (r^((γ−1)/γ) − 1)/η_is] = 333.15 × 1.1696 = 389.8 K ≈ **116.7 °C**, about 50 K above the 66 °C condensing temperature.
3. **Energy check behind #2.** Per kg of vapor, the heater receives h_g(55.49 °C) + c_p,v·BPE + w − h_f(66 °C) ≈ 2602 + 9 + 105 − 276 ≈ 2440 kJ/kg (steam-table values). Making 1 kg of vapor at 60 °C from 60 °C liquor needs ≈ 2359 kJ/kg. So compressor work shows up as a ~3 % heat **surplus**, not a deficit. Real MVR plants use it for feed preheat and losses, or vent it. The plan's Q = V·h_fg(T_v) is ~0.4 % high, which is a fine approximation.

## Decision table

| # | Gemini suggestion | Sev. | Draft decision | Draft reasoning | Approved |
|---|---|---|---|---|---|
| 1A | Use Antoine directly for `psat`/`tsat` in both builds; tables only for `hfg` | Critical | **Accept the fix, reject the rationale** | The claimed 0.95 % test failure is an arithmetic error (fact-check 1). One P_sat method for both builds still matters: absolute P1 and P2 differ by 0.38 % between methods, uncomfortably close to the 0.5 % tolerance. Antoine is undergrad-level and cited. The site will state its ~0.4 % error vs NIST. Also: commit a reference script that produces the expected values unrounded, so rounding can't break the test. | ☐ |
| 1B | State that ε (adhering liquor) is a purity-only model, decoupled from the bulk balance | Critical | **Accept** | Real inconsistency in v1: ε shows up in M8 and the API but not in M1–M6. Making it explicitly purity-only keeps the balance simple and stops either build from coupling it differently. | ☐ |
| 2 | Note the enthalpy approximations in E1; specify `bpe()` uses h_fg at T_b | Important | **Accept, modified** | Keep Q ≈ V·h_fg(T_v). Gemini's wording ("superheat offsets the lower latent heat") is directionally right but vague. Replace it with fact-check 3: the compressor work ends up as ~3 % surplus heat, which is a good Q&A answer for "where does the work go?". Specify K_b evaluated at T_b (no iteration), and note that strictly it should be the pure-water boiling point (~3 % effect on BPE). | ☐ |
| 3 | LiOH's low osmotic coefficient means ideal BPE probably overestimates; activity range 0.75–1.2; check solubility at 0/20 °C (Gemini says CRC lists 12.4 at 20 °C) | Important | **Accept as hypotheses to verify, not as data** | Gemini gave no source for φ ≈ 0.75–0.85 or for "12.4 g at 20 °C". Under the no-invented-data rule, both get checked in Phase 0 against primary sources before anything reaches the site. Adopt the 0.75–1.2 slider range. If confirmed, the ideal-vs-real BPE story goes on the Theory tab. | ☐ |
| 4 | Add compressor discharge temperature T2 to `mvr()`; explain superheat vs wet vapor and condensate-spray desuperheating | Important | **Accept** | Verified (116.7 °C). It fixes a likely Q&A mistake: compression superheats steam, and liquid only arrives as entrained mist or foam, which ties to the known LiOH foaming problem and Lecture 13. One extra equation (C7), at undergrad level. | ☐ |
| 5 | Move the metastable-zone / spinodal / seeding bands on the solubility plot to the MVP; add a "why crystal size matters" card | Important | **Accept, modified** | The professor named these topics, and "No Plot = No Pay" applies. But no measured metastable-zone width for LiOH exists in our sources, so the bands are drawn and labeled **SCHEMATIC** (no numbers). **Reject Gemini's size thresholds (<100 µm, >800 µm)** as unsourced; the card stays qualitative unless a source is found. Also keep the distinction clear: metastable-zone width is kinetic, the spinodal is thermodynamic. | ☐ |
| 6 | Rewrite the B2, E4, C3 interpretations | Important | **Accept** | All three are clearer physically and better answer "how does that make sense?" | ☐ |
| 7a | Cut Phase 3; operating-problem cards become static text in Phase 1; drop MSMPR unless spare time | Important | **Accept** | Frees the Thanksgiving buffer. Problem cards are text plus patent citations, so they're cheap. Crystal size is already covered by the item-5 card and the ε slider. | ☐ |
| 7b | Cut the turndown sweep (P10): compressor surge maps are beyond the level | Important | **Modify: keep a simple turndown, drop surge** *(Andrew's call)* | The professor explicitly asked for operating scenarios and turndown (Lecture 10). With an ideal model, kWh/t doesn't depend on feed rate, so a naive sweep is a flat line. A fixed-area version is at our level and meaningful: at part load, ΔT = Q/(UA) falls, so the lift falls and kWh/t drops. No surge maps. It's the first Phase 2 item to cut if behind. *Alternative: accept Gemini's cut.* | ☐ |
| 7c | Limit Phase 2 to the heater-ΔT capital/operating optimum plus the clickable PFD | Important | **Accept (plus 7b if kept)** | Matches the Lecture 10 pricing request and stays realistic before Thanksgiving. | ☐ |
| 8a | Feasibility guards: low purge → `feasible:false`, not negative flows or NaN; multi-effect feasibility and `maxFeasibleN = floor((Ts − Tlast)/(BPE + ΔTmin))` | Important | **Accept, modified** | Formula checked against E4. Gemini's z_ML > 0.25 threshold is arbitrary: guard on physical conditions (C < 0, V < 0, x_L < 0) and show a warning, labeled ESTIMATE, above a co-precipitation level only if a source is found. | ☐ |
| 8b | Specify every `simulate(inputs)` key name and default | Important | **Accept** | Cheap and prevents a false "fail" from naming differences, making the shared test fair. | ☐ |
| 9 | Fairness: both models get identical files in fresh sessions; compare UI, plots, mobile, and explanation quality too | Nice | **Accept** | Since Claude wrote v1 and merges v2, I approve every decision myself to limit Claude's home-field advantage. Add comparison metrics: chart readability, 375 px layout, explanation quality, uncited numbers. **Also add to the comparison: Gemini's own arithmetic slip in this critique (fact-check 1)**, a concrete example that the critic model needs checking too. | ☐ |
| 10 | Merge Video + Transcript into one tab; merge Model Comparison + Process Log into "AI Workflow" | Nice | **Accept** | Seven tabs fit on a laptop nav bar and present more smoothly. Every required section stays one click away. | ☐ |

## Resulting tab list (if item 10 is accepted)
Overview · Industry Context · Theory · Simulator · AI Workflow (Model Comparison | Process Log) · Video & Transcript · References & Contributions
