# Per-cell aggregate results — knowledge arms × models × suites

Aggregates from the archived run records (per-attempt JSONL, private
archive; aggregates published here in full). Scoring: the published
linter for violations/L1 ([violation-taxonomy.md](violation-taxonomy.md));
the published judge prompts for L3/recognition/NO-FIT
([judge-prompts.md](judge-prompts.md)).

**Arms.** Knowledge arms: `baseline` (no framework knowledge served),
`00-only` (the one-page agent spec only), `full-stack` (the complete
served knowledge stack). Model arms: `sonnet` = `claude-sonnet-5`
(alias pin verified live 2026-07-22; Anthropic publishes no dated
snapshot for it), `gpt` = `gpt-5.5-2026-04-23` (default reasoning
effort), `gpt-low` = the same model at effort `low`. Temperature 0
where the API supports it.

**An attempt** is one independent generation per (item × knowledge
arm × model); no automatic retries — provider/parse failures are
recorded on the attempt (`fails` below) and disclosed, and a failed
attempt emits no files so it carries zero violations by construction.

## Phase A — tranche 3 (kata suite, stack v50-4b97a0cd)

| model | arm | attempts | violations | mean L1 | fails |
|---|---|---|---|---|---|
| sonnet | baseline | 195 | 80 | 96.6 | 9 |
| sonnet | 00-only | 195 | 78 | 95.7 | 42 |
| sonnet | full-stack | 195 | 5 | 99.6 | 21 |
| gpt-low | baseline | 195 | 212 | 91.2 | 0 |
| gpt-low | 00-only | 195 | 54 | 97.8 | 0 |
| gpt-low | full-stack | 195 | 9 | 99.3 | 0 |
| gpt | baseline | 45 | 52 | 90.1 | 3 |
| gpt | 00-only | 45 | 6 | 98.8 | 1 |
| gpt | full-stack | 45 | 5 | 98.3 | 1 |

**Headline: baseline 344 violations → full-stack 19 violations**,
each over 435 attempts (413 / 413 completing generation net of the
per-cell failures above). *An earlier internal summary circulated the
baseline figure as 342; the records say 344. The records govern, and
this table is generated from them.*

## Phase A follow-up — r2 refinement sweep (stack v50-r2-b28d4282)

| model | arm | attempts | violations | mean L1 | fails |
|---|---|---|---|---|---|
| sonnet | 00-only | 195 | 93 | 95.8 | 9 |
| sonnet | full-stack | 195 | 3 | 99.9 | 7 |
| gpt-low | 00-only | 195 | 49 | 97.9 | 0 |
| gpt-low | full-stack | 195 | 1 | 100.0 | 0 |
| gpt | 00-only | 45 | 3 | 99.4 | 5 |
| gpt | full-stack | 45 | 0 | 100.0 | 0 |

## Phase B — feature / kata / NO-FIT suites (stack v50-r4-f05fb070)

| tier | model | arm | attempts | violations | mean L1 | fails |
|---|---|---|---|---|---|---|
| feature | sonnet | baseline | 30 | 64 | 82.3 | 1 |
| feature | sonnet | full-stack | 30 | 0 | **100.0** | 0 |
| feature | gpt-low | baseline | 30 | 112 | 69.9 | 0 |
| feature | gpt-low | full-stack | 30 | 0 | **100.0** | 0 |
| feature | gpt | baseline | 12 | 51 | 66.0 | 0 |
| feature | gpt | full-stack | 12 | 0 | **100.0** | 1 |
| kata | gpt | full-stack | 30 | 0 | 100.0 | 0 |
| kata | gpt-low | full-stack | 30 | 0 | 100.0 | 0 |
| nofit | sonnet | baseline | 18 | 152 | 41.6 | 1 |
| nofit | sonnet | full-stack | 18 | 9 | 88.0 | 12 |
| nofit | gpt-low | baseline | 18 | 234 | 26.4 | 0 |
| nofit | gpt-low | full-stack | 18 | 14 | 92.5 | 3 |

Feature-tier L1 under full-stack is 100.0 for every scored attempt on
every model arm (71 scored / 72 attempted; the one unscored attempt
is a gpt parse failure, listed under fails).

## Recognition (phase B, full-stack, judged)

**67 / 70** judged full-stack attempts recognized and applied their
item's record card; the 3 misses (all gpt-low, one item, attempts
1–3) are identified in the calibration record. Definition:
[judge-prompts.md](judge-prompts.md) § "Recognition, precisely."

## NO-FIT honesty (phase B)

| arm | honest NO-FIT / scored |
|---|---|
| full-stack | **4 / 29** |
| baseline | 3 / 36 |

(Unscored NO-FIT attempts — null judgments — excluded from both
denominators and disclosed here: full-stack 7.) Low in both arms:
models overwhelmingly improvised rather than declaring the task
out of coverage. This number is published as a failure finding,
not a success.

## Suites

12 feature items · 6 NO-FIT probes · kata specs per tranche subsets;
three prompt variants (close paraphrase / natural request /
underspecified) under locked assignments.
