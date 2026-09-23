---
version: 1
slug: "impl-a-index-html"
primary_target: "impl-a/index.html"
related_targets: ["impl-a/docs.html","impl-a/model-comparison.html","impl-a/references.html","impl-a/video.html","impl-a/transcript.html","overview.html"]
---

## Scope

`impl-a/` — all six pages plus root `overview.html` / `compare.html` chrome. Demo page is **Operate** (projector demo, then grader's laptop); Documentation, Model comparison, References, Video, Transcript are **Read**.

Audience and job: an instructor and a class watching a live demo, then grading; the demo must read at projector distance and the docs must read as a graded report. Constraints: static, no build, no CDN; `physics.js` frozen; two validated series hues (tray blue, packed orange) unchanged; no sliders in the primary path.

## Direction contract

THESIS: A high-performance operator display (ISA-101 grammar) set for a lecture hall: grey instrument field, colour spent only on meaning (tray, packed, limit). Refuses the SaaS card grid and the cream editorial journal.

OWN-WORLD: Cool neutral panel ground; plots sit on white display wells separated by 1px rules, square corners, no shadows. One face, Barlow, with tabular figures for every readout; value large, unit small and grey, tag in small caps. Analog range bars with limit ticks show where L/V and A sit against their limits; the column drawing, both columns on one metre scale, is the analog indicator for the heights. Red only for pinch/infeasible, amber only for model limits. Authored SVG icons, 1.5px stroke.

STORY: The visitor sees one duty drive two columns, drags the operating line, and watches tray count jump while the packed bed glides; then reads the calculation Inputs → Method → Result.

FIRST VIEWPORT: At 1440×900: thin header; toolbar (system, packing, A = 1 presets, parameters); y–x diagram left half, the two columns with headline heights right half, both above the fold.

FORM: Candidate 6 of 7 (ISA-101 HMI), raised by candidate 1 (engineering computation pad: Given → Method → Result sheet). Seed key 9b9e40ca (degraded roll, no challengers).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
