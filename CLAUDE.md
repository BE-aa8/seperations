# Project: MVR Crystallizer Explorer

AI project for UC ChemE Separation Processes (CHE 4061, Prof. Carlos Co, Fall 2026, Seader/Henley/Roper 4th ed.).
Interactive static website on **mechanical vapor recompression (MVR) evaporative crystallization of battery-grade lithium hydroxide monohydrate (LiOH·H2O)**, using Tesla's Robstown, TX refinery as industry context.

## Read these before planning or building
- `docs/HANDOFF.md` — concept, simulator features, site tabs, two-model workflow, industry sources
- `context/assignment.md` — the assignment and rubric, verbatim
- `context/professor-guidance.md` — what the professor said about AI projects in lecture (timestamped)
- `context/syllabus-notes.md` — grading weight, course philosophy, relevant course topics
- `docs/process-log.md` — what has been done so far; append to it after every work session

## Assignment requirements (summary; verbatim text in context/assignment.md)
1. Publicly accessible website demo/documentation (deploying on Netlify)
2. YouTube video of the presentation, linked on the site
3. Verbatim YouTube auto-generated transcript, viewable on the site
4. Overview; demo; clearly an AI project exploring AI capabilities; process (models, services, prompts); planning and iteration with my guidance and reasoning; course-related technical details; what I learned and want to learn next; attribution
5. Plan from one model → a different model critiques → justify accept/reject → implement with at least 2 different models and compare
6. Attribution/references and group member contributions

Rubric: Resourcefulness/curiosity/creativity 25% · Artifacts (plan/comparison, webapp, PowerPoint) 25% · Presentation 25% · Q&A 25%

## Rules for this repo
- Math at a 3rd-year ChemE undergrad level. Do not go beyond it.
- Every calculation shows: equation, units, and a one-line physical interpretation. The professor's standard Q&A question is "how does that make sense?"
- "No Plot = No Pay" (syllabus): every calculation should have a visualization, and the tool should invite "what if?" exploration.
- No invented data. Cite every property value and price on the References tab; clearly flag estimates.
- Stack: plain HTML/CSS/JavaScript, Plotly for charts, KaTeX or MathJax for equations. Static, no backend. Mobile-friendly.
- Always start new work in plan mode.
- Save plans in `docs/` with the model name in the filename (e.g. `docs/plan-v1-claude.md`).
- Append prompts, decisions, iterations, and problems to `docs/process-log.md` at the end of every session.
- Keep the second AI model's implementation in a separate folder so the two builds can be compared.
- Verification: unit-check equations; simulator must reproduce the hand-calc case; open the site in a browser and confirm every tab, equation, chart, and slider works.
- This repo is public. Do not commit the textbook, full lecture transcripts, or anything personal.
