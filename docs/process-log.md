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
