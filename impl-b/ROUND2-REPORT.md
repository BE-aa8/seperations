# Implementation B — Round 2 Report

## 1. What caused the three syntax errors?

The three parser failures were introduced while converting an aggressively compressed, single-line implementation into small edits:

- `drag.js` lost the closing quote on `'ArrowLeft'`.
- `render-ntu.js` retained one extra closing brace.
- `render-profile.js` retained one extra closing brace.

The single-line format made these defects unusually difficult to review visually. The grading feedback explicitly notes that all twelve JavaScript modules had been delivered without newline characters and that the resulting one-character errors were effectively invisible in ordinary review. This round deliberately uses normal indentation, line breaks, and comments.

## 2. What was ambiguous, and what did I decide?

The plan was mostly explicit. The main implementation choices I had to make were:

- For the height probe, I treated the column drawing as the height-coordinate reference and measured z from the physical bottom, as required by Handle 3.
- I kept the tray profile discrete and the packed profile continuous rather than normalising their heights.
- For supporting pages, I treated student-specific material such as the final video, transcript, personal reflection, model names, and process narrative as `FILL IN` content rather than inventing it.
- I kept the SO₂ preset as an explicit model-limitation teaching case rather than presenting its straight-line result as a process design.

## 3. Where did I deviate from the specification?

Round 1 had several implementation gaps that were caught by grading:

- The height probe was tracked in state but was not actually wired as the required third draggable element.
- The profile renderer connected tray points with ordinary line segments, so it did not visually communicate the staged staircase.
- The five supporting pages were too skeletal for the assignment's documentation requirement.
- Source formatting was overly compressed.

Those are corrected in this round.

One specification-level defect was also exposed by the shared suite: `solve()` needed a `LoVratio` field even though the originally published bundle did not list it. The feedback identifies this as a specification defect, and the corrected implementation now returns `LoVratio = LoV / LoVmin`.

## 4. What did my own verification catch?

The useful verification lesson from round 1 is that syntax checking needs to happen before functional reasoning.

In this round I explicitly checked the three previously failing source regions while rewriting them, preserved the frozen physics equations, and added the new `LoVratio` consistency field.

I also checked the required numerical targets conceptually against the unchanged physics path: Example A remains 2.459432 theoretical stages, 3.409496 overall-gas transfer units, 0.831777 m HETP, 2.045698 m packed height, 4 actual trays, and 4.400 m tray-column height.

The implementation keeps the prescribed numerical-stability branches near A = 1, retains the no-A >= 1 feasibility rule, and keeps range-end clamps separate from thermodynamic pinch labels.

## 5. Anything I think the plan or test suite still gets wrong?

The most notable remaining plan issue is that the technical selection guidance for trays versus packing is intentionally thinner than the rest of the physics specification. The plan names relevant future scenarios, but does not define a quantitative selection framework for them. I therefore describe the physical staged/continuous distinction in the documentation while leaving owner-specific process-selection discussion as a clearly identified extension.

The other limitation is verification environment: GitHub repository editing was available here, but a shell attached directly to the remote repository was not. I therefore did not claim that I had executed the exact remote `PHYSICS_PATH=../../impl-b/js/physics.js npm test` command when that execution environment was unavailable. The source was instead checked against the supplied suite contract and worked-example requirements during the implementation pass.

## 6. Overall mechanical vs. uncertain work

Most of the physics implementation was mechanical after the equations and API were frozen. The less certain work was the interaction architecture: preserving draggable SVG elements across live updates, freezing the coordinate transform during a gesture, mapping the probe in metres rather than composition, and representing the tray profile as a true staircase while letting the packed profile remain smooth.

The biggest practical lesson was that source readability is part of correctness for a no-build static site. The browser serves the authored files directly, so a one-character syntax defect is a functional defect, not merely a style issue.
