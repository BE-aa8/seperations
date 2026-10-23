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

---

## 2026-10-23 — Claude Code (Opus 5.5, plan mode) — implementation plan v1

**Prompts (key ones, verbatim):**
1. "Read docs/PLAN_PROMPT.md and follow it exactly." (PLAN_PROMPT.md is the full planning prompt, kept in the repo.)

**Clarifying questions Claude asked, and my answers:**
- Individual or group? → **Individual (50 pts).**
- Second model for the critique and second build? → **Meta AI Muse.**
- Second build on a different platform? → **Yes, molab/Marimo (Python).**
- Polish vs. physics? → **Physics first.**
- Deadline? → **Present in about 3 weeks.**
- At first I said Claude would build the molab version too. Claude pointed out that requirement #5 needs at least 2 different models to *implement* the plan. → **Muse also writes the molab build** (Build B). Claude builds the Netlify HTML/JS site (Build A).

**What the AI produced:** `docs/plan-v1-claude.md`. It has 5 phases (critique → data and hand-calc → MVP → enhancements → stretch → verification/video), a feature-to-phase map, 25 equations each with units and a "how does that make sense" line, a data-source table that flags estimates, a fully worked hand-calc case (10 t/h feed, 6 wt% LiOH, 1 atm: about 26 kWh/t water for MVR vs. single-effect steam economy of about 0.93), a plot for every calculation, the folder structure, the verification steps (node tests + Playwright screenshots), the Netlify setup, and a critique prompt for Muse.

**What I accepted / changed / rejected, and why:** I accepted the plan. Changed: Muse does the second build so the project meets requirement #5. Property values in the plan are marked provisional until Phase 1 sources them, so nothing is invented.

**Problems hit:** The LiOH boiling point elevation data look sparse. The plan handles this by using an osmotic-coefficient correction with an "estimate" badge.

**Next step:** Paste `docs/plan-v1-claude.md` into Meta AI Muse with the critique prompt in §12. Save the reply as `docs/critique-muse.md`, then build the accept/reject table.

---

## 2026-10-23 — Meta AI Muse (critique) + Claude Code — critique round and plan v2

**Prompts (key ones, verbatim):**
1. The critique prompt sent to Muse with plan v1 is in `docs/critique-muse.md`, along with Muse's full reply.
2. To Claude: I pasted Muse's reply and asked Claude to process it.

**What the AI produced:**
- Muse: 37 suggestions tagged critical, should fix, or nice to have. It found real physics problems: K_b depends on T, the x_sat↔BPE loop is circular, Eq. 15 fails at N=1, and the MVR heat balance doesn't close. It also suggested scope cuts, a requirement traceability table, and Marimo-specific advice.
- Claude: recomputed Muse's numbers and did a quick source check, then wrote `docs/critique-response.md` (accept/reject table) and `docs/plan-v2-final.md`.

**What I accepted / changed / rejected, and why:** 33 accepted, 3 partial, 1 rejected. Full reasoning is in `docs/critique-response.md`.
- **Partial, solubility:** Muse's headline "critical" fix (x_sat = 0.149 at 100 °C) appears to come from a per-100 mL value. A supplier sheet gives 15.0 g/100 g water, which is x_sat = 0.130, the value v1 used. I accepted Muse's point about recording the basis but not its number. Phase 1 settles this with a primary source.
- **Partial, CAPEX:** Muse said cut it. I kept one static order-of-magnitude bar because Prof Co asked for equipment pricing (Lecture 10).
- **Partial, testing:** the browser test becomes a smoke test, but the full slider sweep moves into fast Node tests instead of being dropped.
- **Rejected:** replacing binodal/spinodal. Prof Co named it for crystallization in Lecture 12, so I kept it and framed it correctly.

**Problems hit:** I can't yet verify several of Muse's cited facts: the battery-grade spec numbers, a "2026 PCCP" solubility measurement, and the GEA kWh/t range. They are marked to-verify, not used.

**Next step:** Phase 1. Source the data (solubility first), generate `steam.json`, recompute and freeze the hand-calc, and meet the Day 4 gate.
