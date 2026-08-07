# Counting rules

The metric definitions and classification rubric used across all
scored rounds. Fixed BEFORE any round ran (pre-registered); the
corrections rubric was published before any results did.

## Per-round, per-side metrics

**Agent-facing (the "AI web development" axis):**

- **Blast radius** — files read and files edited by the building
  agent, counted from the session transcript. Transcripts govern:
  agent self-reports are never the source of record.
- **Knowledge accounting** — every piece of framework knowledge the
  agent used is attributed to one of three sources:
  1. **Application code** — present in a repo file the agent opened.
  2. **Served framework knowledge** — the framework's own agent
     apparatus (for Next.js: AGENTS.md, bundled version-matched docs,
     `/docs/messages` error pages, first-party Skills; for SpyneJS:
     the SpyneJS Knowledge Base). Counted as `served_reads` —
     symmetric, and NOT a demerit: the count measures how much
     serving the round required.
  3. **Out-of-band** — mechanisms or semantics present in no opened
     file and no served source: web consults OR weights-recall
     (detectable when the agent deploys a mechanism it never read
     anywhere in-session). Counted as `offpage_hops`. This is the
     asymmetric number: knowledge a developer could not have gotten
     from the repo or the framework's own tooling.
- **Corrections** — wrong-first-attempt incidents, counted from the
  transcript, classified under the rubric below.
- **Bolt-ons** — third-party dependencies added to meet the
  requirement. Zero is the parity baseline; each addition is itself a
  statement about what the framework lacks. A framework's own
  first-party agent tooling is NOT a bolt-on — it counts under served
  knowledge.
- **scope_delivered** — fraction of the acceptance list delivered
  (descope-as-data under the settlement protocol: an agent may settle
  for less than full scope after a documented effort window; the
  settlement is recorded, not hidden).

**Runtime (the "resolves the issue" axis):**

- **Staleness window** — seconds between a mutation committing and
  every surface showing current data, including surfaces reached via
  back/forward restoration.
- **Interaction latency** — event to settled UI, measured HOSTED with
  identical instrumentation on both deployments. Localhost latency
  claims are void: deployment is the measurement apparatus, and
  localhost collapses the round trip the architectures differ on.
- **Payload weight** — bytes over the wire per interaction.
- **Deploy artifact count** — tracked per round as an asymmetry
  signal.

## Corrections rubric (5 classes, mechanical)

- **A — framework-semantics correction**: rework attributable to
  incorrect use of the framework's own semantics, having reached code
  or build.
- **B — platform-knowledge correction**: rework driven by
  browser/platform behavior outside either framework's docs.
- **C — tooling/environment artifact**: harness, browser, shell, or
  session artifacts; no application-code defect.
- **D — ordinary engineering rework**: app-logic design or
  implementation revision not attributable to framework semantics.
- **E — plan-stage self-correction**: a design reversed BEFORE any
  code existed.

Classify every correction; publish the raw counts AND the
classification; flag borderline calls for independent review.

## Protocol invariants (what makes a round valid)

1. One fresh agent session per framework arm, no session reuse.
2. Verbatim-identical, framework-neutral task text to every arm.
3. The harness (not the building agent) verifies acceptance.
4. Pre-registration before the round runs: hypotheses, metrics, and
   any decision rules are filed first and never amended after data.
5. Transcripts are the source of record for every agent-facing count.
6. Immutable dated audit files; corrections happen in NEW files.
7. Pre/post git tags per round on every arm.
8. Publish misses. A refuted prediction is a result, not an
   embarrassment.
