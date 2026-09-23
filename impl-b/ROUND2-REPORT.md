# Round 2 Report — Implementation B

## 1. What likely caused the three syntax errors

All three failures were single-character edits in source that had been written as one physical line.

- drag.js lost the closing quote in the ArrowLeft comparison.
- render-ntu.js gained one extra closing brace.
- render-profile.js gained one extra closing brace.

The strongest evidence is that the defects were not conceptual physics mistakes: the affected files otherwise had the intended structure, and the physics layer was already correct. The single-line format almost certainly made review harder because a one-character delimiter error was buried inside a very long line. The drag.js defect was also associated with the earlier keyboard-nudge edit. I cannot prove which individual editing action introduced the two brace errors, so I am treating the exact mechanical origin as uncertain rather than claiming more than the evidence supports.

Round 2 uses normal line breaks, indentation, and comments specifically so this class of failure is visible to both humans and automated review.

## 2. Ambiguities I found in the plan and the decisions I used

The major specification ambiguity was already exposed by round 1: solve() was tested for LoVratio even though the published v1.1 bundle did not list that field. PLAN v1.2 now resolves this by defining LoVratio = LoV / LoVmin.

Other implementation-level ambiguities were resolved in favor of the plan's acceptance criteria:

- The probe uses one common physical height coordinate measured from the bottom, with the two column tops left at their actual different elevations. No height normalisation is used.
- The tray profile uses the plan's efficiency-smearing convention rather than inventing a Murphree-efficiency model.
- The technical documentation treats the tray-versus-packing choice as context-dependent. It does not claim that one method is universally preferable.
- Personal reflection, presentation metadata, process narrative, and owner-specific model-comparison text remain explicit FILL IN areas.

## 3. Deviations from the specification

I found no intentional physics deviation from PLAN v1.2.

The main round-1 deviation was source formatting: the JavaScript had been delivered as single-line files. The specification did not forbid that, but round 2 replaces it with readable source.

The current round also strengthens one edge case that is directly consistent with the architecture: state.js now stores the height probe's clamped value, including its upper bound at the larger of the two current column heights. Previously the renderer visually clamped the probe while the stored state could still retain an out-of-range value. Keeping the stored state and rendered value identical is consistent with the plan's clamp-in-state rule.

## 4. What my verification caught

I independently checked the frozen numerical relationships for the generic default using the PLAN equations:

- L/V = 2.000000
- A = 2.000000
- N = 2.459431619
- N_OG = 3.409496184
- HETP = 0.831776617 m
- Z = 2.045697711 m
- N_act = 4
- Z_tray = 4.400000 m

The requested tray-3 probe value from the top is 7.38083152e-3, matching the documented target to the shown precision.

I also checked the key boundary relationships numerically:

- E_o = 1 gives 3 actual trays and 3.80 m.
- Generic bottom clamp gives x_out = 0.0196 and A ≈ 0.91837, while remaining feasible.
- Generic top clamp gives y_out = 4.0e-4.
- The balanced preset gives A = 1, N = N_OG = 4, and HETP = H_OG = 0.600 m.
- N_OG is independent of packing H_OG, so changing packing changes HETP and packed height without changing the NTU count.
- The SO₂ axis limit is about 1.4375e-4; the renderer switches to scientific notation below 1e-3, avoiding a column of 0.000 tick labels.

I also reviewed the interaction wiring after the round-2 edits: there are three draggable elements, all with keyboard focus, pointer-capture handling, and live aria-valuetext.

The repository connector available for this task does not provide a shell or browser session against the checked-out GitHub branch, so I could not honestly claim to have executed the literal npm test, node --check, or a real Chromium session from this environment. Those remain the final external verification steps for the owner. I did not modify the shared tests or anything outside impl-b/.

## 5. Anything the plan or suite may still get wrong

The most important remaining process gap is verification coverage rather than physics.

The round-1 failure shows that a physics-only test gate can report an excellent physics result while the browser application is completely dead because sibling modules do not parse. PLAN v1.2 should ideally add an automated source-parse smoke test for every impl-*/js/*.js, plus at least one browser smoke test that verifies the demo creates SVG content and responds to a handle event.

The plan's accessibility and mobile requirements are also mostly acceptance-by-browser rather than automated assertions. That is reasonable for the artifact, but it means regressions in tabindex, ARIA labels, responsive overflow, and Pointer Events can still slip through while the physics suite remains green.

Finally, the SO₂ preset continues to be a deliberate model-limitation example. The implementation correctly keeps the straight-line model and warns the reader; changing that preset to look more realistic would actually change the teaching point and should be treated as a future curved-equilibrium phase rather than silently altering the MVP.

## Conclusion

Round 1 demonstrated that the written specification was strong enough to produce numerically identical independent physics implementations. Round 2 fixes the practical failure mode that physics tests alone could not see: readable source, complete direct-manipulation wiring, state-consistent probe clamping, richer technical documentation, and a written verification record.