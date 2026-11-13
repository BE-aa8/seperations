# Build prompt: Phase 1 MVP (identical for Claude Code and Gemini)

Give the model these three files, in a **fresh session**, and start it in **plan mode**:
1. `docs/plan-v2-final.md`
2. `site/js/data.js`
3. this prompt (everything below the line)

Change only `<OUTPUT_DIR>`: `site/` for Claude Code, `site/gemini/` for Gemini. Record any clarifying questions the model asks, and answer both models the same way.

---

You are building Phase 1 (MVP) of the "MVR Crystallizer Explorer", a static educational website for a 3rd-year chemical engineering separations course. The attached `plan-v2-final.md` is the full specification. `data.js` holds every property value and price, each with a citation; use it as-is.

Requirements:
1. Build **only Phase 1** (plan §2–§3). Do not build Phase 2 items.
2. Put all output in `<OUTPUT_DIR>`. Do not create or edit files outside it, except that you may read `tests/`.
3. `js/model.js` must follow the API contract in plan §5.3 and the exact `simulate()` input keys and defaults in §5.4. Pure functions, no DOM. It must import in Node 18+ (`import { simulate, DEFAULT_INPUTS } from './js/model.js'`).
4. P_sat/T_sat use the Antoine equation only. h_fg and solubility use linear interpolation of the tables in `data.js`.
5. Stack: plain HTML/CSS/JS (ES modules), Plotly 2.35.2 and KaTeX 0.16.11 from a CDN with pinned versions. No frameworks, no build step, no backend. It must work when served from a static folder, and on phones (no horizontal scroll at 375 px).
6. Seven tabs, as in plan §4. Tabs with content not yet available (video, transcript, model comparison) get clearly labeled placeholders.
7. Every calculation shown must have: the equation (KaTeX), its units, and a one-line physical interpretation. Use the interpretations in plan §8.
8. Every calculation must feed at least one Plotly chart (plan §9, Phase 1 plots P1–P8 and P11), and charts must update live when sliders move. Mark the current operating point.
9. **Do not go beyond a 3rd-year ChemE undergraduate level.** No activity-coefficient models, no rigorous population balances, no compressor maps.
10. **Do not invent data.** Use only values in `data.js` or the plan. If you need a number that isn't there, stop and ask. Label estimates as "ESTIMATE" on screen.
11. Infeasible inputs must show a warning and never display NaN or negative flows (plan §5.3, §7.2).
12. Include a "Hand-calc case" preset that loads `DEFAULT_INPUTS`.
13. When finished, run `npm test` (it tests `<OUTPUT_DIR>js/model.js` against `tests/handcalc-expected.json`) and fix failures. Then serve the site, open it in a browser, check every tab, equation, chart, and slider, and report what you checked.
14. Report: the files created, test results, anything you could not do, and any assumptions you made.
