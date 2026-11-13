# Process Log

Running record of AI tools, prompts, decisions, and iterations for the AI project. Requirement #4 asks for the planning and iteration steps where I provided guidance and my reasoning, so append an entry after every session.

Entry template:
```
## YYYY-MM-DD — <tool / model> — <what this session was for>
**Prompts (key ones, verbatim):**
**What the AI produced:**
**What I accepted / changed / rejected, and why:**
**Problems hit:**
**Next step:**
```

---

## 2026-10-23 — Claude (Opus 5.5) in a claude.ai Project chat — topic selection and handoff

**Setup:** A claude.ai Project for the course holding the lecture transcripts, syllabus, assignment, and textbook, so Claude could search them.

**Prompts (key ones, verbatim):**
1. "can you go back into the transcripts and see what are some of the ideas that prof had for the project"
2. "I want to push forward the idea of 'Mechanical vapor recompression for lithium and mineral purification...' Can we put together some ideas for making everything needed for the project HTML and other needed parts." (followed by the full assignment text)
3. "Yes I like this idea, I want to move this conversation to Claude Code using the plan feature and then eventually build the website."
4. "is there a way to move the context, or pull this project into claude code?"
5. "Add the context from the project into the GitHub repo (separations) so Claude Code can look into it later. After that update the prompt and let me know how to move on step-by-step."

**What the AI produced:**
- Searched the lecture transcripts and found the professor's project ideas: extending the packed column tool with pricing, turndown, and economics (Lecture 10), and a list of presentation topics including MVR for lithium purification (Lecture 12).
- Ran web searches to verify the industry context: Tesla's Robstown refinery is operational and ends in a crystallization step; Veolia MVR crystallizers are used for battery-grade LiOH; MVR's market share; patents on foaming and Li2CO3 fouling in LiOH evaporators.
- Proposed the "MVR Crystallizer Explorer" concept: energy comparison of MVR vs. multi-effect, boiling point elevation panel, economic crossover, purge/purity trade-off, solubility panel.
- Proposed the site's tab structure and the two-model workflow.
- Wrote the handoff pack (CLAUDE.md, HANDOFF.md, PLAN_PROMPT.md) and committed it to this repo with the course context.

**Decisions and reasoning:**
- **Switched topic** from packed vs. tray absorption columns to MVR crystallization. Reason: the professor named MVR for lithium purification as a topic he wants students to teach, it's tied to current US industry (Tesla's 2026 refinery), and it connects to the crystallization advanced-topics module rather than repeating his own packed column demo.
- **Netlify + plain HTML/JS** for the main build, since I already know Netlify. A possible second build in molab would also compare platforms (he prefers Marimo/molab).
- **Kept the full lecture transcripts and textbook out of this public repo.** Committed timestamped paraphrased notes (context/professor-guidance.md) instead.

**Next step:** Open this repo in Claude Code, switch to plan mode, paste docs/PLAN_PROMPT.md, answer its clarifying questions, and save the plan as docs/plan-v1-claude.md.

## 2026-11-09 — Claude Code (Opus 5.5, cloud session) — implementation plan v1

**Prompts (key ones, verbatim):**
1. "Read docs/PLAN_PROMPT.md and follow it exactly. My presentation date is Dec 7, so scope the phases to fit."

**Clarifying questions asked by Claude, and my answers:**
- Individual or group? → **Individual**
- Second AI model for critique and second build? → **Gemini**
- Second build on a different platform (molab/Marimo)? → **No, same HTML/JS stack** (cleaner model-to-model comparison)
- Visual polish vs physics? → **Physics first**
- Deadline → **Presentation Mon Dec 7, 2026**

**What the AI produced:**
- `docs/plan-v1-claude.md`: phased plan (0 plan/critique/data → 1 MVP built by both models → 2 enhancements → 3 stretch → 4 verification → 5 slides/video/deploy), scheduled Nov 9–Dec 7 with Thanksgiving as a buffer and a cut order if behind.
- Feature-to-phase table, all equations (mass balance with purge, BPE, multi-effect, MVR compressor, economics, MSMPR stretch) with units and one-line interpretations, data table with sources and ESTIMATE flags, and a fully worked hand-calc case (10,000 kg/h feed, 6 wt% LiOH, 60 °C, 5 % purge → 947 kg/h LiOH·H2O, 90.1 % Li yield, BPE 4.5 K, r = 1.62, 30.8 kWh/t, crossover vs 3-effect at $0.174/kWh).
- A shared `model.js` API contract so one Node test (`node --test`) grades both the Claude and Gemini builds; Playwright browser smoke test with screenshots; folder structure (`site/` = Netlify root, `site/gemini/` = Gemini build); Netlify deployment steps; Gemini critique prompt.

**Decisions and reasoning:**
- Same stack for both builds so differences come from the model, not the platform.
- KaTeX over MathJax: renders synchronously, fast enough for live equation cards on every slider move.
- Hand-calc numbers were computed in a Python script during the session. Property values (solubility, h_fg, Antoine) are working values to be verified in Phase 0; the hand calc gets recomputed if any change.
- BPE has no confirmed measured data yet → ideal colligative estimate, flagged, with an activity-factor slider.

**Problems hit:** None. Solubility and BPE data still need verification against primary sources (Phase 0).

**Next step:** Paste plan + HANDOFF + CLAUDE.md into Gemini with the §13 critique prompt, save the reply as `docs/critique-v1-gemini.md`, and fill `docs/critique-decisions.md`.

## 2026-11-13 — Gemini (critique) + Claude Code (fact-check, decision draft) — plan v1 critique

**Prompts (key ones, verbatim):**
1. To Gemini: the §13 critique prompt from `plan-v1-claude.md`, followed by plan-v1-claude.md, HANDOFF.md, CLAUDE.md pasted as one message (`gemini-critique-all-in-one.txt`, built by Claude on request: "You have the capability to make them all one, do it").
2. To Claude: pasted Gemini's full reply.

**What the AI produced:**
- Gemini: an independent recomputation of the §7.2 hand calc (all values within 0.5 %) and 10 prioritized suggestions. Saved verbatim in `docs/critique-v1-gemini.md`.
- Claude: fact-checked Gemini's numeric claims with the IAPWS-IF97 saturation equation and steam-table enthalpies, then drafted `docs/critique-decisions.md` (accept/reject table with reasoning, awaiting my approval).

**Key findings:**
- Gemini's "critical" claim that Antoine vs NIST interpolation makes the test fail (r = 1.616, 0.95 % error) is **wrong**. Antoine is ~0.38 % low at both temperatures, so r is unchanged (1.6227 vs 1.6226). Gemini mis-evaluated Antoine at 66 °C (26.071 vs 26.085 kPa). Its fix (one P_sat method for both builds) is still accepted. Good example for the presentation that the critic model also needs checking.
- Gemini's compressor discharge temperature point is correct: T2 ≈ 116.7 °C, so compression superheats steam, and wet vapor comes only from entrained mist or foam.
- Gemini's unsourced numbers (LiOH osmotic coefficient 0.75–0.85, CRC solubility 12.4 g/100 g at 20 °C, crystal-size thresholds <100 µm / >800 µm) are treated as hypotheses to verify, not data.

**What I accepted / changed / rejected, and why:** see `docs/critique-decisions.md` (draft, pending my review; open question 7b on turndown).

**Next step:** Review and approve the decision table, then Claude writes `docs/plan-v2-final.md` and `docs/build-prompt.md`.

## 2026-11-13 (cont.) — Claude Code — decisions approved, plan v2 and build prompt

**Prompts (verbatim):** "approve all, keep 7b"

**What the AI produced:**
- `docs/critique-decisions.md` marked approved (all 14 rows; 7b kept as a simple fixed-area turndown).
- `docs/plan-v2-final.md`: self-contained merged plan. Changes tagged [v2: #n]: Antoine-only P_sat; ε as a purity-only model; K_b at T_b specified; discharge temperature T2 (C7) and the compressor-work surplus note (C8); schematic metastable/spinodal bands moved to the MVP; rewritten B2/E4/C3 interpretations; Phase 3 removed (problem cards become static text, MSMPR dropped); Phase 2 = ΔT optimum + clickable PFD + fixed-area turndown; feasibility guards; exact `simulate()` input keys and defaults; 7 tabs; an independent Python reference script generating unrounded expected values; added comparison metrics including critique accuracy. Schedule re-baselined (Phase 0 ran 2 days late): data Nov 13–15, MVP Nov 16–21, Phase 2 Nov 22–25.
- New hand-calc values: T2 = 116.7 °C, maxFeasibleN = 7, product impurity 583 ppm at ε = 0.03, heater area 469 m², turndown 26.34 / 21.88 kWh/t at 75 % / 50 % load.
- `docs/build-prompt.md`: the identical Phase 1 prompt for Claude Code and Gemini.

**Next step:** Phase 0: verify data against sources and write `site/js/data.js`, the reference script, the expected JSON, and the Node test. Then start both builds.

## 2026-11-13 (cont.) — Claude Code — Phase 0: data verification and test harness

**Prompts (verbatim):** "Yes start Phase 0 now, let me know what all you need."

**Problems hit:** The Default cloud environment blocked NIST, EIA and journal hosts (search worked, fetching did not). Claude proposed a personal "seperations" environment allowing only the needed data hosts; I approved it.

**What the AI produced:**
- `tools/build_data.py` → `site/js/data.js`: every value with a sourceId and an estimate flag. NIST steam table (verbatim), Antoine constants checked against NIST, LiOH·H2O solubility and the osmotic coefficient at saturation computed from Monnin & Dubois (2005, J. Chem. Eng. Data 50:1109), EIA Texas industrial electricity (7.21 ¢/kWh, Aug 2026), Texas industrial gas ($2.98/Mcf), gas heat content (1,037 Btu/cf), gas-plant heat rate (7,781 Btu/kWh), and a fuel-only steam cost derived from them ($7.33/t, ESTIMATE).
- `tests/reference/handcalc_reference.py` → `tests/handcalc-expected.json` (independent Python reference, unrounded values); `tests/handcalc.test.mjs` (Node test for both builds: API, defaults, hand calc ±0.5 %, infeasible cases, limiting cases, random mass closure, data-source audit); `package.json`, `netlify.toml`.
- Self-test of the harness: a throwaway correct JS model passed 9/9; the same model with a planted 1 % error in compressor work failed exactly the 11 dependent values.
- `docs/handcalc.md`: the hand calc redone with verified data, with unit checks and interpretations. Plan v2 amended ([P0] notes).

**Key findings:**
- **The v1 working data were wrong in places.** The "12.7/12.8 g" solubility values were per 100 mL (Wikipedia), not per 100 g. The verified solubility at 60 °C is 14.56 g/100 g (v1 had 13.8). Gemini's "CRC gives 12.4 at 20 °C" was also wrong (13.37).
- **Gemini's osmotic-coefficient hypothesis was partly right:** φ ≈ 0.83 at saturation and 60 °C, so the real BPE (3.95 K) is 21 % below ideal (4.76 K). But φ ≈ 0.90–0.93 at 25 °C, not 0.75–0.85 as Gemini claimed.
- **The economics changed:** with Aug 2026 Texas prices and fuel-only steam, MVR ($2.09/t) beats 3 effects ($2.63/t) but not 5 effects ($1.58/t). The fuel-only steam cost leaves out boiler capital and O&M, so this needs the Phase 2 capital comparison and a decision on the steam-cost default.
- New hand-calc results: C = 942.2 kg/h, Li yield 89.6 %, BPE 3.95 K, r = 1.580, 29.0 kWh/t, T2 = 113.4 °C, max 7 effects.

**Still needed from me:** see the open items in `docs/handcalc.md` and the Phase 0 summary in chat (book checks, steam-cost decision, battery spec, lithium intensity).

**Next step:** Close the open data items, then start the Phase 1 builds with `docs/build-prompt.md`.

## 2026-11-13 (cont.) — decision: steam price; Phase 1 kickoff

**Prompt (verbatim):** "keep $7.33 fuel-only steam, start Phase 1"

**Decision and reasoning:** Keep the sourced fuel-only steam cost ($7.33/t, from EIA Texas gas Aug 2026) as the default instead of an unsourced "all-in" number. On energy cost alone, 5 effects beat MVR at current cheap Texas gas. This is presented as a finding, and Phase 2's capital-cost comparison tells the rest of the story.

**Phase 1 setup:** `docs/build-prompt.md` clarified before either build started (copy `data.js` unchanged into the output folder; commit and push). The Claude build runs in a **fresh** Claude Code cloud session (no access to this planning conversation) on branch `claude/phase1-build`, output `site/`. The Gemini build is run by me with Gemini CLI on branch `gemini/mvp`, output `site/gemini/`, with the identical prompt.
