# Handoff: MVR Crystallizer AI Project

Context carried over from a planning chat in claude.ai (Oct 23, 2026). Read this before planning.

## Who / what
- Student: Andrew, 4th-year ChemE at the University of Cincinnati (comfortable with Python and Netlify).
- Course: Separation Processes (CHE 4061), Prof. Carlos Co. Topics: absorption/stripping, VLE, distillation, membranes, advanced topics incl. crystallization.
- Earlier idea (packed vs. tray absorption columns) was **dropped** in favor of this MVR topic.
- Still to decide: individual (50 pts, recorded in-class talk + detailed Q&A) or group (20 pts, up to 4 people). See `context/syllabus-notes.md`.

## Related context files
- `context/assignment.md` — assignment and rubric, verbatim
- `context/professor-guidance.md` — fuller, timestamped notes from Lectures 5, 8, 9, 10, 12, 13
- `context/syllabus-notes.md` — course philosophy ("No Plot = No Pay", "WHAT IF?"), modules, grading

## What the professor said about AI projects (summary; details in context/professor-guidance.md)
- **Lecture 13:** Compression is the most energy-intensive operation in the chemical industry overall; compressors and expanders often share a shaft to recover work. Useful framing for why MVR's compressor power is worth it, and for Q&A on wet vapor in compressors.
- **Lecture 12:** Lists topics he wants students to teach the class: liquid-liquid extraction, crystallization (pharma), **mechanical vapor recompression for lithium/mineral purification** (mentioned Tesla's Texas lithium hydroxide plant and the US push to refine rare earths, lithium, cobalt, nickel domestically), membranes/RO, chromatography.
  - Presentation structure he asked for: start with **commercial significance** (industries, actual chemicals, volumes, dominant companies/countries), then go into **theory and terminology** the way he'd teach it.
  - For crystallization he specifically named: degree of supersaturation, spinodal vs. binodal decomposition, seeding, and **why crystal size matters**.
  - Preferred platform: Marimo/molab notebooks; Streamlit and HuggingFace are also fine; "if you have other ideas, go for it."
  - The YouTube video is essentially the practice run before presenting live. Include all AI prompting/documentation.
- **Lecture 10:** Suggested adding real **equipment pricing** (have AI find published prices), **operating scenarios**, and an **economic analysis** across the operating range. His Q&A question is almost always "how does that make sense?" (physical meaning, units).
- **Lecture 9:** Tell the AI not to go beyond a 3rd-year ChemE level; it overcomplicates otherwise.
- **Lecture 8:** For the model comparison, paste the repo/plan into a second model with "check for errors, suggest improvements," then justify what you accept. The comparison is part of the presentation. Resourcefulness = figure out tools yourself and explain your choices.
- **Lecture 5:** Always start in planning mode; save/export plans as documentation; put browser-based verification (open site, check equations render) into the plan.

## Industry context (verified Oct 2026)
- Tesla's lithium refinery in Robstown, TX (near Corpus Christi) is operational; described as the first spodumene-to-lithium-hydroxide refinery in North America and the first commercial-scale acid-free lithium refining route.
- Process as described by the site manager: spodumene → kiln and cooler → alkaline leach → purification → **crystallization** → battery-grade LiOH. Target ~50 GWh/yr of battery capacity at full ramp. Process reportedly developed with Metso.
- Veolia supplied MVR-driven crystallizers to a Chinese spodumene-to-LiOH plant; battery-grade LiOH·H2O made in a two-stage crystallizer; MVR cited for removing impurities to very low levels at low energy use.
- MVR estimated at ~55–60% of the industrial evaporator/crystallizer market in 2026 (market research estimate — treat as approximate).
- Known operating problems (good Q&A material): strongly alkaline LiOH liquor foams during evaporation, carrying LiOH into the condensate; lithium carbonate scales evaporator heat-transfer surfaces.

## Web app concept: "MVR Crystallizer Explorer"
Interactive evaporative crystallizer for LiOH·H2O comparing single-effect, multi-effect, and MVR on the same feed.
1. Clickable process flow diagram (preheater, forced-circulation evaporator/crystallizer, vapor separator, compressor, centrifuge, purge); clicking a unit shows its equations and live values.
2. Energy comparison: sliders for feed rate, feed concentration, heater ΔT → compressor work, kWh per tonne water evaporated, steam economy for 1/3/5 effects vs MVR.
3. Boiling point elevation panel: rising BPE shrinks usable ΔT → higher compression ratio and compressor power. The key "how does that make sense" concept.
4. Economic crossover: electricity $/kWh vs steam $/t sliders → where MVR beats multi-effect; sourced price table.
5. Crystallizer mass balance with impurity purge: Na/K build up in mother liquor; purge fraction trades purity against lithium yield.
6. Solubility panel: LiOH solubility vs temperature is relatively flat → evaporative (not cooling) crystallization is required. Pull data with a citation and verify.
7. Stretch: operating-problem cards (foaming, Li2CO3 scaling).

## Website tabs
Overview · Industry Context · Theory · Simulator · Model Comparison · AI Process Log · Video · Transcript · References & Contributions

## AI workflow for requirement #5
1. Plan in Claude Code plan mode (prompt in `docs/PLAN_PROMPT.md`); save as `docs/plan-v1-claude.md`.
2. Paste the plan into a second model (ChatGPT or Gemini) for critique.
3. Build an accept/reject table: suggestion | accepted? | reasoning.
4. Implement the final plan in Claude Code AND a second model (e.g., Codex or Gemini), in separate folders/branches.
5. Compare on: correctness vs. hand calc, first-run bugs, number of fix iterations, UI quality, time, whether it overcomplicated the material.
6. Possible creativity bonus: one build on Netlify (HTML/JS), the other in molab (Python), comparing platforms as well as models.

## Other deliverables
- PowerPoint (rubric artifact) → backbone for the video and live talk
- YouTube video + auto-transcript pasted into the site
- One worked hand-calculation case the simulator must reproduce

## Likely Q&A questions to prepare for
- Why does MVR save energy if electricity costs more per unit than steam? (Reusing latent heat; you only pay for the lift.)
- What limits the compression ratio?
- Why does BPE hurt MVR more than multi-effect?
- Why does crystal size matter for battery-grade product?
- Where do the impurities go?

## Sources
- EnergyX, "Tesla's Lithium Refinery in Texas": https://energyx.com/blog/teslas-lithium-refinery/
- Spectrum News, "Tesla lithium refinery in Texas is now fully operational" (Jan 2026): https://mynews13.com/fl/orlando/news/2026/01/21/tesla-lithium-refinery-in-texas-is-now-fully-operational
- Electrek, Tesla refinery production start: https://electrek.co/?p=451403
- Water Online, Veolia HPD crystallization for lithium plant: https://www.wateronline.com/doc/veolia-water-technologies-crystallization-processing-plant-china-0001
- Meticulous Research, Industrial Evaporator & Crystallizer Market: https://www.meticulousresearch.com/product/industrial-evaporator-and-crystallizer-market-6360
- Patent CN108298569A (MVR LiOH hydrate, foaming): https://eureka.patsnap.com/patent-CN108298569A
- Patent US10961126B2 (Li2CO3 fouling in LiOH evaporators): https://patents.google.com/patent/US10961126
