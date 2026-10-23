Read these files first, in this order:
1. CLAUDE.md (project rules and requirements)
2. docs/HANDOFF.md (concept, simulator features, site tabs, two-model workflow, industry sources)
3. context/assignment.md (assignment and rubric, verbatim)
4. context/professor-guidance.md (what my professor said in lecture, timestamped)
5. context/syllabus-notes.md (course philosophy and grading)
6. docs/process-log.md (what's been done so far)

Do NOT write any code yet. I want a detailed implementation plan for the "MVR Crystallizer Explorer" website described in HANDOFF.md.

The plan should:
1. Be broken into clear numbered phases (MVP first, then enhancements, then stretch), written so a different AI model could follow it. I will have another model critique this plan, then build it with two different models.
2. Assign each simulator feature from HANDOFF.md to a phase.
3. List every equation the simulator will use, with units and a one-line physical interpretation, at a 3rd-year ChemE undergraduate level. My professor's Q&A question is always "how does that make sense?", so the interpretations matter as much as the math.
4. List every data value needed (LiOH solubility vs. temperature, boiling point elevation of LiOH solutions, steam properties, compressor efficiency, typical compression ratios and heater ΔT, electricity and steam prices), where each will be sourced, and which are estimates.
5. Define one fully worked hand-calculation verification case the simulator must reproduce, and say how it will be checked automatically.
6. Make sure every calculation has a plot and invites "what if?" exploration (the syllabus says "No Plot = No Pay").
7. Follow my professor's presentation structure on the site: significance first (industry, real process, volumes, companies), then theory and terminology, then the interactive tool.
8. Specify the folder structure for this repo, including where the site lives, where the second model's implementation goes, and where screenshots and plans are saved.
9. Include a verification phase: unit checks, the hand-calc test, and opening the site in a browser to confirm every tab, equation render, chart, and slider works (with screenshots).
10. Include the documentation workflow: save this plan as docs/plan-v1-claude.md and append to docs/process-log.md.
11. Cover deployment to Netlify from this GitHub repo.
12. Include a short section on what the second model should be asked to critique.

Stack: plain HTML/CSS/JavaScript, Plotly, KaTeX or MathJax, static, no backend, mobile-friendly.

Before finalizing, ask me clarifying questions, including:
- Individual or group project?
- Which second AI model I plan to use for the critique and the second build
- Whether the second build should be on a different platform (e.g., molab/Marimo in Python) to also compare platforms
- How polished the visual design should be vs. how much time to spend on the physics
- My presentation date or deadline, so phases can be scoped to it
