# Critique of plan v1, by Gemini (verbatim)

**Model:** Gemini (Gemini app), 2026-11-13
**Input:** `gemini-critique-all-in-one.txt` = the §13 critique prompt from `plan-v1-claude.md`, then `docs/plan-v1-claude.md`, `docs/HANDOFF.md`, `CLAUDE.md`, pasted as one message.
**Note:** Pasted from the Gemini web app exactly as copied. Math appears twice (rendered text plus source text), and the "gemini-critique-all-in-one.txt" lines are Gemini's citation markers. Both are copy-paste artifacts, left in place to keep this verbatim.

My accept/reject decisions are in `docs/critique-decisions.md`.

---

Claude’s `plan-v1-claude.md` is well-structured, tightly aligned with the course rubric, and appropriately scoped to a 3rd-year ChemE level. Before listing the prioritized suggestions, here is the independent step-by-step verification of the §7.2 hand calculation and the systematic audit across your nine criteria.
gemini-critique-all-in-one.txt

Independent Hand-Calculation Audit (§7.2 Verification)
Using the exact inputs from §7.1 (F=10,000 kg/hF=10,000 kg/h, xF=0.060xF=0.060, zF=0.0010zF=0.0010, Tb=60 ∘C=333.15 KTb=60 ∘C=333.15 K, p=0.05p=0.05, s=13.8 g LiOH/100 g H2Os=13.8 g LiOH/100 g H2O, i=2i=2, ΔTheater=6 KΔTheater=6 K, ηis=0.75ηis=0.75, ηm=0.95ηm=0.95, γ=1.33γ=1.33, MLiOH=23.95 g/molMLiOH=23.95 g/mol, Mw=18.015 g/molMw=18.015 g/mol, Mhyd=41.965 g/molMhyd=41.965 g/mol):
gemini-critique-all-in-one.txt

1. Molality at saturation (mm):
m=13.8 g/23.95 g/mol0.100 kg H2O=5.7620 mol/kgm=0.100 kg H2O13.8 g/23.95 g/mol=5.7620 mol/kg
Plan: 5.762 mol/kg5.762 mol/kg (Diff: 0.00%0.00%)
gemini-critique-all-in-one.txt

2. Ebullioscopic constant (KbKb) & BPE: Note: For boiling point elevation of a solution boiling at TbTb under pressure P1P1, the thermodynamic reference is the pure-solvent saturation temperature Tv=Tsat(P1)Tv=Tsat(P1), not TbTb, or at least hfghfg should be evaluated consistently. Following the plan's evaluation at Tb=333.15 KTb=333.15 K with hfg(60 ∘C)=2358.5 kJ/kghfg(60 ∘C)=2358.5 kJ/kg:
gemini-critique-all-in-one.txt

ΔHvap=2358.5×0.018015=42.4884 kJ/mol=42,488.4 J/molΔHvap=2358.5×0.018015=42.4884 kJ/mol=42,488.4 J/mol
Kb=8.31446×(333.15)2×0.01801542,488.4=0.39120 K⋅kg/molKb=42,488.48.31446×(333.15)2×0.018015=0.39120 K⋅kg/mol
BPE=2×1.0×0.39120×5.7620=4.5082 K≈4.51 KBPE=2×1.0×0.39120×5.7620=4.5082 K≈4.51 K
Plan: 0.3912 K⋅kg/mol0.3912 K⋅kg/mol and 4.51 K4.51 K (Diff: 0.00%0.00%)
gemini-critique-all-in-one.txt

3. Vapor Saturation Temperature (TvTv) and Suction Pressure (P1P1):
Tv=60−4.5082=55.4918 ∘CTv=60−4.5082=55.4918 ∘C
Using the plan's Antoine constants (A=8.07131,B=1730.63,C=233.426A=8.07131,B=1730.63,C=233.426, mmHg/∘CmmHg/∘C):
gemini-critique-all-in-one.txt

log⁡10(PmmHg)=8.07131−1730.63233.426+55.4918=2.08127⟹P1=120.579 mmHg×101.325760=16.0758 kPalog10(PmmHg)=8.07131−233.426+55.49181730.63=2.08127⟹P1=120.579 mmHg×760101.325=16.0758 kPa
Plan: 55.49 ∘C55.49 ∘C and 16.08 kPa16.08 kPa (Diff: 0.03%0.03%)
gemini-critique-all-in-one.txt

4. Mass Balance (P,zML,xL,C,VP,zML,xL,C,V, Yield):
   * P=0.05×10,000=500 kg/hP=0.05×10,000=500 kg/h
gemini-critique-all-in-one.txt

   * zML=0.0010/0.05=0.0200zML=0.0010/0.05=0.0200
gemini-critique-all-in-one.txt

   * xL=(1−0.0200)×13.8113.8=0.98×0.121265=0.118840xL=(1−0.0200)×113.813.8=0.98×0.121265=0.118840
gemini-critique-all-in-one.txt

   * Mass fraction of LiOHLiOH in LiOH⋅H2OLiOH⋅H2O: wLiOH=23.95/41.965=0.570714wLiOH=23.95/41.965=0.570714
gemini-critique-all-in-one.txt

   * C=10,000(0.060)−500(0.118840)0.570714=600−59.4200.570714=947.20 kg/hC=0.57071410,000(0.060)−500(0.118840)=0.570714600−59.420=947.20 kg/h
gemini-critique-all-in-one.txt

   * Li Yield=540.580600=0.90097⟹90.1%Li Yield=600540.580=0.90097⟹90.1%
gemini-critique-all-in-one.txt

   * V=10,000−500−947.20=8,552.80 kg/hV=10,000−500−947.20=8,552.80 kg/h Plan: All match within 0.01%0.01%. (However, see Critique #1 regarding the missing adhering mother liquor εε in the mass balance versus M8).
gemini-critique-all-in-one.txt+ 1

5. Evaporator Heat Duty (QQ): Using hfg(55.49 ∘C)=2369.5 kJ/kghfg(55.49 ∘C)=2369.5 kJ/kg:
gemini-critique-all-in-one.txt

Q=8,552.80 kg/h×2369.5 kJ/kg3600 s/h=5,629.46 kWQ=3600 s/h8,552.80 kg/h×2369.5 kJ/kg=5,629.46 kW
Plan: 5,629 kW5,629 kW (Diff: 0.01%0.01%) (See Critique #2 regarding enthalpy closure between superheated vapor at TbTb and latent heat at TvTv).
gemini-critique-all-in-one.txt

6. Condensing Pressure (P2P2) and Compression Ratio (rr):
Tc=60+6=66.0 ∘CTc=60+6=66.0 ∘C
Using the plan's Antoine constants at 66.0 ∘C66.0 ∘C:
gemini-critique-all-in-one.txt

log⁡10(PmmHg)=8.07131−1730.63233.426+66.0=2.291255⟹P2=195.549 mmHg=26.0710 kPalog10(PmmHg)=8.07131−233.426+66.01730.63=2.291255⟹P2=195.549 mmHg=26.0710 kPa
(Note: Pure water NIST WebBook steam table gives Psat(66 ∘C)=26.15 kPaPsat(66 ∘C)=26.15 kPa and Psat(55.49 ∘C)=16.12 kPaPsat(55.49 ∘C)=16.12 kPa. Depending on whether `model.js` uses Antoine or NIST table interpolation for `psat()`, P2P2 differs by 0.30%0.30%.)
r=26.07516.076=1.6220(or 26.0816.08=1.6219)r=16.07626.075=1.6220(or 16.0826.08=1.6219)
Plan: P2=26.08 kPaP2=26.08 kPa, r=1.623r=1.623 (Diff: 0.06%0.06%)
gemini-critique-all-in-one.txt

7. Compressor Work (ws,w,Welecws,w,Welec), Specific Energy, and COP: With γ=1.33⟹γ−1γ=0.331.33=0.2481203γ=1.33⟹γγ−1=1.330.33=0.2481203 and γγ−1=4.030303γ−1γ=4.030303:
gemini-critique-all-in-one.txt

   * Using rounded r=1.623r=1.623: r0.2481203−1=(1.623)0.2481203−1=0.127646r0.2481203−1=(1.623)0.2481203−1=0.127646
ws=4.030303×0.461526 kJ/(kg⋅K)×333.15 K×0.127646=79.099 kJ/kgws=4.030303×0.461526 kJ/(kg⋅K)×333.15 K×0.127646=79.099 kJ/kg
   * Using unrounded r=26.0710/16.0758=1.62175r=26.0710/16.0758=1.62175:
ws=78.952 kJ/kg(Diff vs 79.08 kJ/kg: 0.16%)ws=78.952 kJ/kg(Diff vs 79.08 kJ/kg: 0.16%)
   * Following ws=79.08 kJ/kgws=79.08 kJ/kg:
gemini-critique-all-in-one.txt

w=79.080.75=105.44 kJ/kgw=0.7579.08=105.44 kJ/kg
Welec=8,552.80×105.443600×0.95=263.69 kWWelec=3600×0.958,552.80×105.44=263.69 kW
Specific energy=105.443.6×0.95=30.830 kWh/tSpecific energy=3.6×0.95105.44=30.830 kWh/t
COP=2369.5105.44=22.47≈22.5COP=105.442369.5=22.47≈22.5
COPCarnot=273.15+66.066.0−55.4918=339.1510.5082=32.275≈32.3COPCarnot=66.0−55.4918273.15+66.0=10.5082339.15=32.275≈32.3
Plan: All within 0.2%0.2% (no discrepancies >0.5%>0.5%, provided intermediate rounding rules are specified).
8. Multi-Effect and Economics:
   * S1=5629.46×36002202.6=9,200.9 kg/hS1=2202.65629.46×3600=9,200.9 kg/h, E1=8552.89200.9=0.92956≈0.930E1=9200.98552.8=0.92956≈0.930
gemini-critique-all-in-one.txt

   * E3=3×0.92956=2.7887≈2.79E3=3×0.92956=2.7887≈2.79; S3=3,067.0 kg/hS3=3,067.0 kg/h
gemini-critique-all-in-one.txt

   * E5=5×0.92956=4.6478≈4.65E5=5×0.92956=4.6478≈4.65; ΔTeff=120−50−5(4.508)5=9.49 KΔTeff=5120−50−5(4.508)=9.49 K
gemini-critique-all-in-one.txt

   * Costs per tonne water (Discrepancy alert — see Critique #4):
      * Unrounded: costMVR=0.07×30.830=$2.158/tcostMVR=0.07×30.830=$2.158/t (Plan: $2.16$2.16)
gemini-critique-all-in-one.txt

      * Unrounded: cost1=15/0.92956=$16.137/tcost1=15/0.92956=$16.137/t (Plan: $16.14$16.14)
gemini-critique-all-in-one.txt

      * Unrounded: cost3=15/2.7887=$5.379/tcost3=15/2.7887=$5.379/t (Plan: $5.38$5.38)
gemini-critique-all-in-one.txt

      * Unrounded: cost5=15/4.6478=$3.227/tcost5=15/4.6478=$3.227/t (Plan: $3.23$3.23)
gemini-critique-all-in-one.txt

   * Annual Operating Cost (MVR):
      * Using unrounded $2.1581/t×8.5528 t/h×8,000 h/yr=$147,663/yr≈$148k/yr$2.1581/t×8.5528 t/h×8,000 h/yr=$147,663/yr≈$148k/yr.
gemini-critique-all-in-one.txt

      * Using rounded 30.8 kWh/t⟹$2.156/t⟹$147,519/yr30.8 kWh/t⟹$2.156/t⟹$147,519/yr.
      * All §7.2 values agree within 0.5%0.5% when computed from unrounded floats, except that your unit test tolerance (±0.5%±0.5%) will be tight if one model uses NIST steam-table interpolation for `psat()` while the hand calc used Antoine (0.3%0.3% difference at 66 ∘C66 ∘C, which amplifies in rr and wsws to ∼0.8%∼0.8%).

Prioritized Critique & Suggestions

1. [CRITICAL] Physics / Mass Balance & Unit Test Mismatch on Adhering Mother Liquor (εε) and Antoine vs. Steam Table
   * Issue A (Antoine vs. Steam Table in §5.3 & §7.2): In §6.3, you state `psat(T_C)` is linearly interpolated from NIST WebBook tables in 5 °C steps, while §7.2 computes P1=16.08 kPaP1=16.08 kPa and P2=26.08 kPaP2=26.08 kPa using the Antoine equation. At 55.49 ∘C55.49 ∘C and 66.0 ∘C66.0 ∘C, NIST linear interpolation on a 5 °C grid gives P1≈16.21 kPaP1≈16.21 kPa and P2≈26.20 kPaP2≈26.20 kPa(because Psat(T)Psat(T) is concave up, linear interpolation overestimates pressure between 5 °C nodes by ∼0.6%∼0.6%), giving r=1.616r=1.616 and ws=78.3 kJ/kgws=78.3 kJ/kg—a 0.95%0.95% error that will fail your ±0.5%±0.5% unit test (`handcalc.test.mjs`) on the first run!
gemini-critique-all-in-one.txt+ 1

   * Issue B (Mass Balance M1–M8): Equation M8 calculates product impurity from adhering mother liquor (ε=0.03 kg liquor/kg crystalsε=0.03 kg liquor/kg crystals), and §5.3 passes `epsilon` into `massBalance()`, yet M1–M6 and §7.2 completely ignore εε in the mass conservation equations (treating CC as 100%100% pure LiOH⋅H2OLiOH⋅H2O and all impurity as leaving in PP).
gemini-critique-all-in-one.txt

   * Fix: (1) Explicitly specify in §5.3 and §6.3 that `psat(T_C)` and `tsat(P_kPa)` use the Antoine equation (or Magnus/Buck equation) directly for smooth, exact derivatives, and use tabular interpolation only for `hfg(T_C)`. (2) State explicitly in M8 and §5.3 that εε is a post-centrifuge surface-moisture purity model (where the small mass of entrained wash liquor is neglected in the bulk evaporator mass balance M1–M6), or set ε=0ε=0 in the bulk balance and note the decoupling so neither AI model tries to couple εε into PP and break the §7.2 test.
gemini-critique-all-in-one.txt

2. [IMPORTANT] Physics: Enthalpy Reference State in Evaporator Duty (E1) and KbKb (B1)
   * Issue: In §7.2, KbKb is evaluated using ΔHvap(60 ∘C)=2358.5 kJ/kgΔHvap(60 ∘C)=2358.5 kJ/kg and Tb=333.15 KTb=333.15 K, whereas evaporator duty QQ is evaluated using hfg(Tv=55.49 ∘C)=2369.5 kJ/kghfg(Tv=55.49 ∘C)=2369.5 kJ/kg. Physically, vapor leaving a boiling solution at Tb=60 ∘CTb=60 ∘C and P1=16.08 kPaP1=16.08 kPa is superheated by BPE=4.51 KBPE=4.51 K above Tv=55.49 ∘CTv=55.49 ∘C. Furthermore, on the condensing side (Tc=66 ∘CTc=66 ∘C), the latent heat released by the compressed vapor is hfg(66 ∘C)=2343.7 kJ/kghfg(66 ∘C)=2343.7 kJ/kg (plus desuperheating from the compressor discharge temperature T2T2), which is ∼1.1%∼1.1% lower than hfg(55.49 ∘C)hfg(55.49 ∘C).
gemini-critique-all-in-one.txt+ 1

   * Fix: Keep the math simple for 3rd-year level, but add one explicit note in §8 (under E1/C1) and `docs/qa-prep.md`: "We approximate the evaporator heat duty as Q≈Vhfg(Tv)Q≈Vhfg(Tv) and assume the superheat added by the compressor (∼105 kJ/kg∼105 kJ/kg) offsets the slightly lower latent heat at TcTc and small heat losses, eliminating the need for a trim heater or desuperheater mass balance." Also specify in §5.3 that `bpe()` uses `hfg(T_C)` at TbTb so both Claude and Gemini compute Kb=0.3912Kb=0.3912 identically.
gemini-critique-all-in-one.txt

3. [IMPORTANT] Physics: BPE of LiOHLiOH (Colligative vs. Real Activity & Solubility Data Source)
   * Issue: At m=5.76 mol/kgm=5.76 mol/kg, an electrolyte is far outside the dilute Debye-Hückel regime.Fortunately, LiOHLiOH is famous among alkali hydroxides (unlike NaOHNaOH or KOHKOH, whose mean ionic activity coefficients γ±γ± surge to 33–10+10+ at high molality) for having a remarkably low osmotic coefficient (ϕ≈0.75–0.85ϕ≈0.75–0.85 at 4–5 mol/kg4–5 mol/kg due to ion pairing), meaning the ideal colligative BPE≈4.5 KBPE≈4.5 K with i=2i=2 is actually slightly higher than reality (∼3.5–4.0 K∼3.5–4.0 K), whereas for NaOHNaOH at the same molality BPE is >10 K>10 K.
   * Data Check (§6.1 Solubility): Your working table (12.7,12.8,13.0,13.8,15.3,17.5 g LiOH/100 g H2O12.7,12.8,13.0,13.8,15.3,17.5 g LiOH/100 g H2O at 0,20,40,60,80,100 ∘C0,20,40,60,80,100 ∘C) matches standard CRC/Linke-Seidell data closely (CRC gives 12.4 g12.4 g at 20 ∘C20 ∘C and 17.5 g17.5 g at 100 ∘C100 ∘C, with LiOH⋅H2OLiOH⋅H2O as the stable solid phase across the entire 0–100 ∘C0–100 ∘Crange).
gemini-critique-all-in-one.txt

   * Fix: Keep the working table (verify the 0 ∘C0 ∘C and 20 ∘C20 ∘C points against your edition of CRC/Perry's in Phase 0), and add the physical insight about LiOHLiOH's ion-pairing / activity factor (default 1.0default 1.0, realistic range 0.75–1.20.75–1.2) to the Theory tab. Prof. Co will love that explanation in Q&A.
gemini-critique-all-in-one.txt+ 1

4. [IMPORTANT] Physics: Compressor Superheat, Wet-Steam Protection, and Desuperheating (Lecture 13 Connection)
   * Issue: In `HANDOFF.md`, you note Prof. Co's Lecture 13 point about wet vapor in compressors. However, §8 (C1–C6) doesn't show the compressor discharge temperature T2=T1[1+(r(γ−1)/γ−1)/ηis]T2=T1[1+(r(γ−1)/γ−1)/ηis]. For your hand-calc case (T1=333.15 KT1=333.15 K, r=1.623r=1.623, ηis=0.75ηis=0.75), the vapor leaves the compressor at T2≈389 KT2≈389 K (116 ∘C116 ∘C), which is 50 ∘C50 ∘C superheated above its condensing temperature (Tc=66 ∘CTc=66 ∘C)!
gemini-critique-all-in-one.txt+ 2

   * Why this matters for Q&A: Steam has a steep positive slope on a T–sT–s diagram, so compressing saturated water vapor makes it strongly superheated (not wet!). Liquid droplets only enter the compressor via mist entrainment / foaming in the suction vapor (causing erosion and LiOHLiOH stress-corrosion cracking), OR when operators spray condensate into the compressor suction/discharge to desuperheat the vapor so the heat exchanger tubes aren't wasted on low-UU gas-phase desuperheating.
   * Fix: Add T2T2 (discharge temperature) to `mvr()` or the Q&A sheet (`docs/qa-prep.md`) so you don't accidentally tell Prof. Co during Q&A that steam condenses inside the compressor during compression. Explain accurately: entrained foam/mist at suction causes wet compression/erosion, while compression itself superheats steam to 116 ∘C116 ∘C, often requiring condensate spray desuperheating.
gemini-critique-all-in-one.txt

5. [IMPORTANT] Level & Missing Professor Topics: Visual Phase Diagram for Binodal / Spinodal / Metastable Zone
   * Issue: In Lecture 12, Prof. Co specifically asked for degree of supersaturation, spinodal vs. binodal decomposition, seeding, and why crystal size matters. Currently, §3 puts the "metastable-zone band" in Phase 3 Stretch, and §4 mentions binodal/spinodal only as text on the Theory tab. Given the course rule "No Plot = No Pay", having binodal/spinodal and seeding only as text (or buried in optional Phase 3) risks losing points on a topic he explicitly named.
gemini-critique-all-in-one.txt+ 3

   * Fix: Promote the Supersaturation / Metastable Zone / Seeding bands on Plot P1 (Solubility curve) from Phase 3 Stretch to Phase 1 MVP. It takes only 2 extra lines in Plotly on P1:
gemini-critique-all-in-one.txt

      1. Binodal (Solubility) curve c∗(T)c∗(T): Phase boundary; below is undersaturated.
      2. Metastable Zone (Labile / Supersolubility boundary) curve: Between binodal and this curve,primary nucleation is negligible, so seeding controls crystal growth without fines.
      3. Spinodal boundary (schematic upper curve): Above this limit, there is zero thermodynamic barrier to phase separation—spontaneous, catastrophic homogeneous nucleation ("crash crystallization" / fines) occurs everywhere. Also add a simple visual or table card on the Theory tab showing Why Crystal Size Matters (too small <100 μm<100 μm: high capillary retention ε↑⟹Na ppm ↑ε↑⟹Na ppm ↑, blinds centrifuge screen, dust hazard; too large >800 μm>800 μm: mother-liquor occlusions trapped inside crystal lattice, attrition/breakage in forced-circulation pump).
gemini-critique-all-in-one.txt

6. [IMPORTANT] Interpretations Audit ("How does that make sense?") Most of your §8 one-line interpretations are crisp and physical, but three of them will draw immediate pushback from Prof. Co:
gemini-critique-all-in-one.txt

   * B2 (`T_b = T_sat(P) + BPE`): Your interpretation says "The vapor leaving is pure water, slightly superheated, at the evaporator pressure." While true, that doesn't explain B2 itself, and students often get confused about whether the vapor is at TbTb or Tsat(P)Tsat(P). Change to: "Non-volatile LiOHLiOH stays in the liquid, so the boiling liquor is at TbTb, creating pure water vapor at system pressure PP that is superheated by BPEBPE above its condensation point Tsat(P)Tsat(P)."
gemini-critique-all-in-one.txt

   * E4 (`ΔT per effect = [T_s − T_last − N·BPE] / N ≥ ΔT_min`): Your interpretation says "BPE is lost in every effect, so concentrated brines limit how many effects are possible." If Prof. Co asks "Why is BPE 'lost' in every effect?", the physical mechanism must be clear: "In each effect kk, vapor leaves the liquor at Tb,kTb,k but only condenses in the next effect's heater at Tv,k=Tb,k−BPETv,k=Tb,k−BPE, so BPEBPE is subtracted from the usable temperature driving force across every single stage."
gemini-critique-all-in-one.txt

   * C3 (`w_s = ...`): Your interpretation says "Work grows with the lift, not with the amount of latent heat recycled."Add why T1T1 and R/MR/M are in front: "Specific work scales with inlet absolute temperature T1T1 and gas constant R/MR/M because hotter, lower-molecular-weight vapor has a larger specific volume (v=RT/PMv=RT/PM), requiring more PdvPdv work per kg to compress across pressure ratio rr."
gemini-critique-all-in-one.txt

7. [IMPORTANT] Scope vs. Deadline (4 Weeks to Dec 7, Thanksgiving in the Middle)
   * Issue: You are doing an individual 50-pt project with two model builds, automated Node + Playwright testing, 9 tabs, 8–12 interactive Plotly charts, a clickable SVG PFD, CAPCOST equipment correlations, slides, a recorded YouTube practice talk, transcript integration, and Q&A prep before Dec 7. Phase 2 (Fri Nov 20 – Wed Nov 25) is overloaded right before Thanksgiving.
gemini-critique-all-in-one.txt+ 1

   * Fix (Cut & Reorder):
      * Cut Phase 3 entirely right now (move operating-problem cards for foaming/Li2CO3Li2CO3 scaling into brief static callout boxes on the Industry/Theory tab during Phase 1—they take 10 minutes as text and are great Q&A prep, no code needed; drop MSMPR population balance X1/P12 unless you have spare time, since your crystal-size explanation + εε slider in P7 already covers crystal size).
gemini-critique-all-in-one.txt

      * Cut P10 (Turndown sweep) from Phase 2. Centrifugal compressor surge/stonewall curves require head-flow maps that go beyond 3rd-year separation processes and distract from the core thermodynamic story.
gemini-critique-all-in-one.txt

      * Keep Phase 2 strictly to two items: (1) P9 Heater ΔTΔT Capital vs. Operating Cost Optimum(directly answers Prof. Co's Lecture 10 request for real equipment pricing and economic analysis across the operating range) and (2) Clickable SVG PFD.
gemini-critique-all-in-one.txt

8. [IMPORTANT] Verification Plan: Catching Subtle Simulator Bugs
   * Issue: Your `tests/handcalc.test.mjs` and limiting-case tests (§7.3) are strong, but they miss two classic evaporator/crystallizer edge cases where sliders allow physically impossible states:
gemini-critique-all-in-one.txt

      1. Impurity Saturation / Purge Floor: When the user drags the purge slider pp down toward 0.0010.001, zML=zF/p→1.0zML=zF/p→1.0, making xL→0xL→0 or causing NaOHNaOH to co-precipitate (or making V<0V<0 when xFxF is high).
      2. Pinch / Infeasible Multi-Effect (N⋅BPE≥Ts−TlastN⋅BPE≥Ts−Tlast): When the user increases BPE or NN, ΔTper_effectΔTper_effect goes negative.
   * Fix: Add explicit guard assertions to `handcalc.test.mjs`:
      * Assert that when pp is below the minimum feasible purge (or zML>0.25zML>0.25), `massBalance()`returns a `feasible: false` or `warning` flag rather than negative flows or `NaN`.
      * Assert that `multiEffect()` returns `feasible: false` when `dT_per_effect < dTmin` and caps `maxFeasibleN = Math.floor((Ts_C - Tlast_C) / (BPE + dTmin))`.
gemini-critique-all-in-one.txt

      * In `model.js` API contract (§5.3), explicitly define every property key of the `inputs` object passed to `simulate(inputs)` (with exact variable names and default values) so Claude and Gemini don't name keys `dT_heater` vs `deltaT_heater` inside `simulate(inputs)`.
gemini-critique-all-in-one.txt

9. [NICE-TO-HAVE] Fairness and Richness of the Two-Model Comparison (§12)
   * Issue: Because Claude wrote `plan-v1-claude.md` and will merge `plan-v2-final.md`, Claude has a mild structural "home-field advantage" if the prompt isn't self-contained. Conversely, if `plan-v2-final.md` spells out every equation and function signature down to the exact arithmetic, both models might pass the unit tests on try #1, making the `model.js` comparison look like a tie.
gemini-critique-all-in-one.txt+ 1

   * Fix:
      * Give both Claude Code and Gemini CLI the exact same zero-context files: `docs/build-prompt.md`, `docs/plan-v2-final.md`, and `site/js/data.js` in a fresh session.
gemini-critique-all-in-one.txt

      * Since `model.js` is tightly constrained by the §5.3 contract, the biggest differentiation will appear in UI architecture, Plotly chart readability (axis labels, dual-axis overlap, mobile responsiveness at 375 px), KaTeX live re-rendering performance, and how well each model writes physical explanations without hallucinating uncited numbers. Make sure your §12 comparison table highlights UI/UX defects and explanation quality alongside unit-test pass rates.
gemini-critique-all-in-one.txt+ 1

10. [NICE-TO-HAVE] Site Structure & Rubric Completeness (§4)
   * Audit against Rubric: Your 9-tab layout covers every requirement in `CLAUDE.md` (Overview + "What I learned / want to learn next", Industry Context, Theory, Simulator, Model Comparison, AI Process Log, Video, Verbatim Transcript, References & Contributions) and follows Prof. Co's Lecture 12 flow (Significance → Real Process → Theory → Tool).
gemini-critique-all-in-one.txt

   * Improvement: Nine top-level tabs can wrap awkwardly on a 1280 px laptop screen and feel fragmented during a live presentation. Consider grouping Video & Transcript into a single tab (`Video & Transcript`, with the YouTube player on top and the collapsible/scrollable verbatim auto-transcript directly below it) and AI Workflow (combining or sub-tabbing Model Comparison + Process Log), bringing the top navigation bar to a cleaner 7–8 tabs while keeping every required section one click away.
