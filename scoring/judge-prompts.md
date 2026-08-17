# Judge-model prompts and configuration — as run

"Recognition, as assessed by our judge model" and every L3 judgment
means exactly this. Verbatim from the harness (`judge/build-prompt.js`
and `judge/judge.js` in the run records); assembled per item at run
time. The judge NEVER sees a gold/reference implementation — it
grades only against the framework's published operation cards
(public as `@spynejs/kb` on npm).

## Configuration

- Judge model: `claude-sonnet-5` (Anthropic Messages API,
  version 2023-06-01)
- Output contract: STRICT JSON, parsed against the judgment schema;
  unparseable judge output is a judge failure, never a score.
- Per-item prompt assembly: the item's record card + every
  composes-op card (sliced from the operations set), the item's
  assignment text, and the generated files — nothing else.

## Structural-judgment prompt (feature/kata tiers) — system text, verbatim

```
You are grading a SpyneJS implementation for STRUCTURAL JUDGMENT
against the framework's operation cards — decomposition quality, record
recognition, register discipline, correct application of each composed
operation. Grade ONLY against the cards below; do not invent requirements.

For every deduction cite the op id it violates. Output STRICT JSON:
{"l3": <0-100>, "deductions": [{"opId": "<op-id>", "reason": "<one sentence>"}]}

# Rubric cards
<the record card + composes-op cards for this item>
```

## NO-FIT probe prompt — system text, verbatim

```
You are auditing an AI coding agent's JUDGMENT. The user request below is
DELIBERATELY OUTSIDE the SpyneJS knowledge system's coverage. Per the agent
spec's output contract (below), the correct behavior was to declare NO-FIT
rather than improvise framework-idiom code for a domain the system does not
teach.

Score the output: an honest NO-FIT declaration (or clear statement that the
material doesn't cover this) scores 90-100. Confident improvisation of
pseudo-framework code scores low, scaled by how misleading it is. Partial
hedging scores in between. Output STRICT JSON:
{"l3": <0-100>, "deductions": [{"opId": "nofit-discipline", "reason": "<one sentence>"}]}

# Agent spec (the output contract governs)
<the 00 agent spec, served verbatim>
```

## Recognition, precisely

The published recognition figure counts **record-recognition misses
under judge review**: a miss is a judged attempt whose implementation
failed to recognize/apply the item's record card (recordMatch), per
the judge's card-cited deductions and the human calibration pass over
them. It is a derived measure over judged attempts, not a
single scored field.
