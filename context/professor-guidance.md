# What Prof. Co Said About AI Projects (Lecture Notes)

Paraphrased notes from the class YouTube lecture transcripts, with approximate timestamps so the original can be checked. Full transcripts are kept out of this public repo.

## Lecture 5 — how to use agentic coding tools
- **~5:34** Always start in planning mode, with any tool (Claude Code, Codex, Grok). In plan mode you discuss without writing code; skipping it means the AI builds something prematurely and wastes tokens and time.
- **~6:27** A website that does calculations is the easiest way to demo a concept. His live demo was an absorption column design web app (equilibrium/operating lines, stage stepping).
- **~18:43** If doing the AI project, document everything: export or copy the plan (it's a markdown file) and keep it.
- **~21:22** Put browser verification into the plan: have the AI open the site, check every panel, take screenshots, and confirm equations render. Websites are notoriously bad at rendering equations.
- **~20:12** His personal preference for web apps is Streamlit.

## Lecture 8 — model comparison and resourcefulness
- **~2:13** He won't standardize on one tool, because whatever is used now will be obsolete next year. The skill that matters is adaptability.
- **~2:44** That's why resourcefulness, curiosity, and creativity are 25% of the rubric: figure out tools on your own, compare the pros and cons of hosting options (HuggingFace, Streamlit, etc.), decide, and explain why.
- **~3:29** He compared this to co-op: you get freedom in how you do things and impress your boss with resourcefulness.
- **~19:14** Comparing outcomes from different AIs is part of the presentation.
- **~19:36** The workflow he described: push the code to a GitHub branch, paste it into a second model (e.g., Claude Opus or another frontier model), ask it to check for errors and suggest improvements, and be ready to justify which suggestions matter, as you would to a boss. He expects the differences to be small.

## Lecture 9 — keep it at undergrad level
- **~0:24** An AI-generated tool he showed was correct but went far beyond the undergraduate level. He said he should have told it not to go beyond a third-year ChemE student. Lesson: constrain the level explicitly.
- **~3:45** For practicing presentations: transcribe your practice run, give the AI both your transcript and his lecture transcript on the topic, and ask for tips on explaining it better.

## Lecture 10 — suggested project direction (packed columns, but the pattern applies)
- **~1:01:13** For the AI project, do something educational for yourself that doesn't go too far from the course.
- **~1:01:49** Add **pricing**: have the AI find published equipment prices.
- **~1:02:04** Add **operating scenarios**: normal conditions plus turndown (adjusting flow rates and checking the unit still works over a reasonable range).
- **~1:02:57** Do an **economic analysis** over the operating range, e.g., cost per unit of product, including construction estimates.
- **~1:03:38** Grading is less about what the AI did and more about how well you answer questions when presenting. His question will almost always be **"how does that make sense?"** He cares about whether formulas and units make physical sense, not the numbers.

## Lecture 12 — project topics and presentation structure
- **~0:00** Lists lithium batteries and **mechanical vapor recompression**. He said Tesla had just started what he believed was the only lithium hydroxide purification plant in the US, in Texas, and that it uses MVR in one of its steps.
- **~0:22** These are topics he wants students to present instead of him lecturing. Students will teach with slides; it doesn't have to be equation-by-equation.
- **~0:52** Roughly 8 students said they'd do individual projects; he planned for about 10 project slots.
- **~1:38** Suggested topics: liquid-liquid extraction; MVR (used heavily in mineral purification); domestic refining of rare earths, lithium, cobalt, nickel so the US imports less; membranes/reverse osmosis; crystallization for pharma; chromatography.
- **~4:15** Presentation structure:
  1. Significance first: commercial importance, which industries use it.
  2. A real process: the actual chemicals separated, production volumes, dominant countries and companies.
  3. Then theory and terminology, the way he'd teach it.
- **~5:41** For crystallization, know: degree of supersaturation, spinodal vs. binodal decomposition, seeding, and why crystal size is crucial (too big and too small are both bad; know why).
- **~7:01** Platform preference: Marimo/molab notebooks; HuggingFace ZeroGPU or Streamlit also fine; other ideas welcome. He wants to learn from what students explore.
- **~7:36** The most important part is coming up and talking. He asks more technical questions than co-op supervisors would; not knowing is okay, look it up. It's cooperative and low-stakes.
- **~8:44** The YouTube video is the practice presentation before presenting live. Include all AI prompting and document how you did it.

## Lecture 13 — compression and energy (air separation, useful for MVR Q&A)
- **~17:08** Across the whole chemical industry, **compression is the single most energy-intensive operation**. Relevant to the MVR energy argument: MVR spends compressor power to avoid spending steam.
- **~17:39** Discussion of moisture and compressors: some machines are damaged by liquid, others tolerate it. Relevant to MVR, where the compressor handles wet vapor from the evaporator and entrained droplets or foam are a real concern.
- **~18:22** Compressor and expansion turbine often share the same shaft, recovering work. Shows his interest in energy-recovery reasoning.
