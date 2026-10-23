# Resume here (paused 2026-10-23, after Phase 1)

Branch: claude/sharp-sagan-o9w20n (not merged to main yet). Presentation target: week of Nov 13, 2026.

## Where things stand
- Done: plan v1 (Claude) → critique (Meta AI Muse) → accept/reject table → plan v2 → Phase 1 data + frozen hand-calc.
- Plan to follow: docs/plan-v2-final.md (both builds).
- Data: site/data/*.json (every value has source_id + is_estimate). Gate report: verification/data-status.md.
- Expected answers: verification/handcalc.json + vectors.json, from verification/handcalc.py (independent reference; regenerate with `pip install iapws==1.5.5 && python3 verification/handcalc.py`). Run it WITH iapws, or the steam-table check is dropped from the JSON.
- Headline case: 28.2 kWh/t water (compressor only), BPE 6.0 K, 920 kg/h crystals, 163 kg/h make-up steam, MVR $1.90/t vs. 5-effect $1.93/t at TX prices.
- Story beat for the talk: I disputed Muse's solubility fix; Phase 1 sources showed Muse was right (docs/critique-response.md, "Phase 1 update").

## Andrew's to-dos before/while Phase 2 runs
1. UC library: CRC "Aqueous Solubility of Inorganic Compounds at Various Temperatures" LiOH row, or Monnin & Dubois 2005 (J. Chem. Eng. Data 50, 1109). Fixes the 25-100 C curve shape and maybe phi.
2. Confirm the EIA Texas industrial electricity price (6.12 c/kWh, 2024) on eia.gov.
3. Check the 5 steam-table spot values in scripts/make_steam_table.py against your thermo book appendix (Claude typed them from memory; they agree with IAPWS to 0.02 %).
4. Optional: let the cloud environment fetch web pages (Network access settings) so sources marked verify_direct can be checked automatically.

## Next step: Phase 2 (MVP site, Build A), days 4-9
Start in plan mode. Prompt: "Read docs/NEXT-SESSION.md and docs/plan-v2-final.md, then plan Phase 2."
- 9-tab static site in site/ (HTML/CSS/JS, Plotly, KaTeX, pinned CDN versions); site/js/physics.js as pure ES module.
- Features F2, F3 (+ heater area and pressure trade-off), F4, F6, F5 base, heat waterfall, feasibility guards, static PFD.
- tests/: handcalc.test.mjs + sweep.test.mjs (node --test) against verification/*.json; smoke.mjs (Playwright).
- netlify.toml; Andrew connects Netlify to the repo.
- Day 9 gate: feature freeze.
- In parallel from ~Day 5: write molab-muse/BRIEF.md (plan v2 §14) and hand it to Muse for Build B.
