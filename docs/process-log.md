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
