# Prompt log

Verbatim prompts used on this project, for the "process" section of the
presentation (`docs.html`) and the model comparison (`model-comparison.html`).

Suggested convention — one file per exchange, named
`NN-<round>-<model>.md`, e.g.:

```
01-planning-<model>.md       the prompt that produced docs/PLAN.md v1.0
02-critique-<model>.md       the prompt handed to the critiquing model
03-impl-a-<model>.md         the prompt handed to implementer A
04-impl-b-<model>.md         the prompt handed to implementer B
```

Paste the prompt verbatim, including anything you revised mid-conversation. The
revisions are the interesting part: they are the record of where you steered the
model rather than accepted its first answer. Cross-reference the resulting
decisions by their `D-xx` / `C-xx` ids in `docs/DECISIONS.md`.
