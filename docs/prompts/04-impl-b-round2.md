# Round 2 handoff — bring Implementation B to parity

**How to use this file.** Everything below the line is a prompt to paste into
the same model that built `impl-b/` (ChatGPT). Round 1 delivered an excellent
physics module but a site that does not run. This prompt names the three
blocking defects exactly, lists the remaining gaps, and tells it how to verify
its own work before handing back.

If the model has repository access, it can work in place. If it is chat-only,
paste `docs/PLAN.md` alongside this and have it return complete files.

---

You built `impl-b/` in this repository from the specification in
`docs/PLAN.md`. It has now been graded against the shared test suite and driven
in a real browser. This message tells you exactly what the grading found and
what to do about it.

## First, the good news, because it is genuinely good

Your physics module is excellent. Measured, not guessed:

- **It scores 60/61 on the shared suite.** The single failure is a field the
  specification itself omitted — not your fault; details in §3 below.
- **It reproduces all three worked examples exactly** (PLAN §7): N, N_OG, HETP,
  Z, tray counts and column heights, on Examples A, B and C.
- **It agrees with the other implementation to bit-exactness.** Across a
  4,837-point sweep of the reachable operating region, the worst relative
  difference in N, N_OG, HETP and Z was **0.000e+0** — identical doubles — with
  zero tray-count and zero feasibility disagreements.
- **You avoided all five documented traps**, including the fractional-stage
  rule, which is the one the plan's own author originally got wrong. Your
  `stepStaircase` correctly reports `fullSteps = 2` on Example A, and correctly
  takes `N` from the analytic function rather than from the step count.

Do not change `impl-b/js/physics.js` except for the one small addition in §3.
It is right.

## 1. Three syntax errors stop the site from running at all

Three of your twelve JavaScript modules **fail to parse**. Because `drag.js` is
one of them, no drag handle is ever wired: the demo renders zero SVG elements
and nothing is interactive. Every page still returns HTTP 200, which is why this
is easy to miss without opening a browser or running a parser.

Each is a single character.

### 1a. `impl-b/js/drag.js` — unterminated string literal

In the `keydown` handler, the closing quote on `'ArrowLeft` is missing, so the
rest of the file is swallowed into a string literal:

```js
n=o.axis==='y'?e.key==='ArrowDown':e.key==='ArrowLeft;if(!z&&!n)return;
                                                  ^ missing closing quote
```

Fix: `e.key==='ArrowLeft'`.

Note that braces in this file balance correctly — the quote is the only problem.
Your commit *"Fix pointer keyboard nudge expression"* is what introduced it.

### 1b. `impl-b/js/render-ntu.js` — one extra closing brace

The file ends:

```js
...;g.append(z)}}
                ^ one brace too many
```

Counting structural braces with string literals stripped: **11 closing against
10 opening.** Remove one.

### 1c. `impl-b/js/render-profile.js` — one extra closing brace

The file ends:

```js
...E('path',{d:t,class:'profile-tray'}))}}
                                        ^ one brace too many
```

**9 closing against 8 opening.** Remove one.

## 2. Write readable source from now on

Every file you delivered is a single line with zero newline characters. That is
valid JavaScript and the specification never forbade it, so round 1 stands as
delivered and is recorded that way in the project's comparison notes. It is not
being held against you.

But it had a real cost, and it is worth being explicit about it: **three
one-character typos in twelve single-line files are effectively invisible to
review.** Nobody could have caught them by reading, which is why they shipped.

For this round, please produce normally formatted source: line breaks,
indentation, and comments explaining the non-obvious parts — particularly the
numerical branches near A = 1 and the clamping logic. The site has no build step
and no minifier, so what you write is what is served and what a human has to
maintain. This change will be recorded as a round-2 instruction, not as
something you got wrong in round 1.

## 3. Add `LoVratio` to the `solve()` bundle

The suite asserts a field `solve()` should return that the published §2.4 bundle
never listed. **This was a specification defect, not your error** — you
implemented the contract as written, correctly. The specification has since been
amended (PLAN v1.2) to include it.

Add to your `solve()` return object:

```js
LoVratio: LoV / LoVmin   // how many times the minimum liquid rate
```

That is the whole fix, and it takes your score to 61/61.

## 4. Bring the rest up to the same standard as the physics

The grading found these gaps against `docs/PLAN.md`. None is hard; they are
listed so you do not have to rediscover them.

### 4a. The height probe is not draggable — Phase 6

Your `state.js` tracks `probeZ` and your `main.js` renders a probe readout, but
`main.js` calls `makeDraggable` only **twice** (y_out and x_out). The
specification requires **three** draggable elements. Phase 6 needs a probe the
user drags up and down over the two columns, reading the local gas composition
in each.

Behaviour that matters (PLAN §5.1, Handle 3):

- It moves in **height** coordinates (metres), not composition.
- The two columns have **different total heights**. Above the shorter column's
  top, its readout must say so rather than extrapolating. Do not normalise the
  two height axes against each other — that difference is the entire point of
  the site.

### 4b. The composition-versus-height plot must show the contrast

The tray curve must be a **staircase** — flat between trays, jumping at each
one. The packed curve must be **smooth**. That visual contrast is the physical
meaning of staged versus continuous contacting and is the single most important
thing that plot exists to show.

### 4c. The five supporting pages are near-empty

`video.html`, `transcript.html`, `docs.html`, `model-comparison.html` and
`references.html` are 878–2,211 bytes each. The assignment requires six real
sections. Specifically:

- **`docs.html`** should carry the actual technical content: the physics from
  PLAN §3, staged versus continuous contacting, and when to choose trays versus
  packing. Write this properly — it is the part a reader learns from.
- **`video.html`** needs a responsive 16:9 YouTube embed with the video id in
  one clearly-marked constant, so the owner can paste it in later.
- **`transcript.html`** needs a scrollable, selectable region for a verbatim
  auto-generated transcript, with a copy button.
- **`model-comparison.html`** and **`references.html`** need headed sections
  with clearly-marked fill-in regions for the owner's own text.

Leave anything personal — what the owner learned, their process narrative — as
obvious placeholders. Write the technical content in full.

### 4d. Styling, responsiveness and accessibility

Your CSS totals about 5 KB. Bring it up to the standard the plan asks for:

- **Responsive**, usable at 390 px wide with no horizontal page scroll.
- **Light and dark**, both readable. Dark mode should be its own selected
  colours against a dark surface, not an automatic inversion.
- **Keyboard**: every drag handle focusable with `tabindex="0"` and nudgeable
  with the arrow keys, with a live `aria-valuetext`. Your `drag.js` already has
  the keydown logic — it just needs the handles focusable and labelled.
- **Never signal state by colour alone.** The pinch indicator must also change
  shape or carry a text label.
- **No `<input type="range">` anywhere.** Still the instructor's hard
  requirement.

## 5. Verify your own work before handing back

This is the part that would have caught everything above. Please actually run
these rather than reasoning about them.

**Parse every module.** This alone would have caught §1 in seconds:

```bash
for f in impl-b/js/*.js; do cp "$f" "/tmp/$(basename $f .js).mjs"; \
  node --check "/tmp/$(basename $f .js).mjs" || echo "FAILS: $f"; done
```

**Run the shared suite.** All 61 must pass, unmodified:

```bash
PHYSICS_PATH=../../impl-b/js/physics.js npm test
```

**Open the site in a browser** and confirm it actually works. If you have a
browser tool or can drive headless Chromium, use it; if not, serve locally
(`python3 -m http.server`) and check by hand. Confirm: no console errors, SVG
actually renders, and both handles respond to dragging.

**Check these exact numbers on screen** with the default generic preset
(`y_out = 0.002`, `x_out = 0.009`):

| Quantity | Expected |
|---|---|
| N | 2.459432 |
| N_OG | 3.409496 |
| HETP | 0.831777 m |
| Z (packed bed) | 2.045698 m |
| Actual trays | 4 |
| Tray column height | 4.400 m |
| Staircase | 2 complete risers + 1 truncated at y_in |

And these behavioural checks:

- Set `E_o = 1.0` → **3 trays, 3.80 m**.
- Switch packing from Pall rings to structured → **N_OG must not change**; only
  Z and HETP move. If N_OG moves, H_OG has leaked into the NTU calculation.
- Probe at tray 3 from the top → **≈ 7.380832e-3**.
- Drag x_out to its clamp → stops at **0.0196**, the minimum-L/V flag appears,
  and **A falls to ≈ 0.918 while the state stays feasible**. A below 1 is
  normal here; do not add a guard against it.
- Drag y_out to its clamp → stops at **4.0e-4**.
- Click the A = 1 demo preset → **N = N_OG = 4 exactly**, HETP = H_OG, the NTU
  shaded area becomes a rectangle, and the packed profile becomes a straight
  line.
- All four chemical presets render legibly, **including SO₂**, whose x-axis
  range is about 1.4e-4 — check it does not render as a column of `0.000`.

## 6. Write the report this time

Round 1 came back with no written account, so the project can say what you
produced but not why. Please include, in a file `impl-b/ROUND2-REPORT.md`:

1. **What you think caused the three syntax errors.** Genuinely useful — was it
   the single-line output format, an editing step, something else?
2. **What was ambiguous** in `docs/PLAN.md`, and what you decided.
3. **Where you deviated** from the specification, and why.
4. **What your own verification caught** before you handed back.
5. **Anything you think the plan or the test suite still gets wrong.** The suite
   has already been corrected once because your implementation exposed a defect
   in it — that kind of finding is valuable, so please say so if you see more.

## 7. Rules that still hold

- **Do not read `impl-a/`.** The project is comparing what two models produce
  from one specification. You are being given targeted defect reports, which is
  already a form of feedback and is recorded as such; copying the other
  implementation would end the comparison entirely.
- **Do not modify anything outside `impl-b/`** — not the tests, not
  `docs/PLAN.md`, not `impl-a/`. If a test looks wrong, say so in your report;
  there is an amendment process, and it has already been used once on your
  behalf.
- The frozen API in `docs/PLAN.md` §2.4 still governs `physics.js`, now
  including `LoVratio`.
