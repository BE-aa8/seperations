# 02 — The critique prompt

**Round:** 2, critique
**Sent to:** Muse AI
**Date:** 2026-09-21
**Produced:** `docs/FEEDBACK.md` — 14 findings, C-01 to C-14

`docs/PLAN.md` v1.0 was handed to a second model to be attacked.

## ⚠ Not archived

**The exact wording of this prompt is not recorded.** It was sent outside the
Claude Code session, so it was never captured, and reconstructing it after the
fact would be inventing a record rather than keeping one.

`[FILL IN]` — paste the prompt you actually used here if you still have it.

## What is known

The plan carried its own instructions to a critiquing model in §0.1, and the
critique that came back followed them closely, so they were plainly read:

- attack the physics derivations and the worked numbers by independent
  calculation;
- check whether the verification strategy is honest about its own weak points;
- check the interaction design's degrees of freedom;
- check whether the phase boundaries are real;
- and **sort findings into errors, omissions and preferences**.

That last instruction did most of the work. Splitting the categories made the
critique adjudicable: an *error* has to be verified and fixed, an *omission*
weighed, a *preference* argued with. Fourteen undifferentiated remarks would
have been far harder to act on.

## Outcome

All 14 findings were accepted; two were implemented differently from the fix
proposed, because the proposed fix would have introduced a different problem.
Two findings also had correct conclusions supported by *incorrect reasoning*,
caught by recomputing rather than reading. See `DECISIONS.md`, critique round.
