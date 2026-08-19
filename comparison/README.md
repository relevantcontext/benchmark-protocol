# comparison/ — the measured-comparison dataset

## Scope: which experiment this is

This directory belongs to the **companion measured-comparison
program** — twelve agent builds across six scored rounds on two
implementations of the same application, plus a dedicated
re-instrumentation session that measured interaction latency on both
live deployments with identical probes.

It is **distinct from the served-knowledge experiments** that the
[article](https://spynejs.com/blog/frameworks-are-starting-to-ship-knowledge)'s
main body reports (the scripted API benchmark behind 344→19, 67/70,
and 4/29 — receipts for those live in [`../scoring/`](../scoring/)).
The two instruments share the application and the knowledge base and
nothing else: different tasks, different scoring, different claims.
Numbers from this directory must not be attributed to the
served-knowledge harness, and vice versa.

The two applications:
[acme-dashboard-nextjs](https://github.com/relevantcontext/acme-dashboard-nextjs) ·
[acme-dashboard-spynejs](https://github.com/relevantcontext/acme-dashboard-spynejs)
— both live, both carrying per-round `pre-*`/`post-*` tags.

## Method

**Environment.** Identical instrumentation code injected into both
LIVE deployments (the two apps above, at scale fixture: 200
customers / 5,000+ invoices), same session, same machine, same
browser, sequential runs ~30 minutes apart. The live payment
simulation was ACTIVE on both applications throughout — a real-world
noise floor both sides share, visible in the p95s.

**Interaction metrics** (sort, deep page jump): trigger a real UI
interaction, observe the **rows container** (the smallest common
ancestor of the data rows) with a MutationObserver, and record
settled = last mutation timestamp − trigger timestamp, where settled
means **≥250 ms with no further mutations** in that container.
Detection loops are **MessageChannel-driven** — message ports are not
subject to background-tab timer throttling, so detection latency
cannot contaminate values (values derive from mutation timestamps
only).

**Toggle metric:** trigger → **first mutation in the clicked row**.
The quiet-window form is unusable for this metric on pages with
per-row live updates (see discarded data); first-mutation is the
perceived flip, defined identically on both sides.

**Cold-load metrics** are two architecture-appropriate proxies —
**they are NOT one metric**, and no single instant means the same
thing in both architectures:
- Next.js (server-rendered document): navigationStart → ≥3 data rows
  present in the document, measured in a same-origin iframe with the
  observer attached from iframe creation. n=20.
- SpyneJS (SPA): top-level cache-busted document loads; ttfb,
  DOMContentLoaded, and **bootstrap-complete** (the ~460 KB
  `/api/bootstrap` responseEnd) as the content proxy — rows render
  one frame after bootstrap-complete. n=12.
Browser asset cache warm on both sides; documents cache-busted.

**Input mechanism:** synthetic element clicks throughout, except
SpyneJS sort, which used real pointer clicks. Replication note: the
framework binds its sort listener to the header **button**; synthetic
clicks dispatched on the button work, but clicks dispatched on the
button's inner span do not reach it — early batches made that mistake
(see discarded data). The timing path after the click is identical
either way.

**Sample counts:** sort n=20 per side · page jump n=20 per side ·
toggle n=24 per side (even count: statuses net to their original
values) · cold-load n=20 (Next.js) / n=12 (SpyneJS).

## Discarded and excluded data — read this before the numbers

Every excluded value is preserved in
[`runtime-samples.csv`](runtime-samples.csv) under an explicit
`status` (`excluded-artifact`, `superseded-method`,
`discarded-corrupt`) with its cause. Nothing was silently dropped.

1. **Body-scoped quiet-window batches (both sides): discarded.** With
   the observer on `document.body`, the live payment feed mutates the
   page every ~1s, so a 250 ms quiet window chain-extends
   indefinitely; hidden-tab timer throttling amplified it. One
   Next.js toggle batch (n=24) and two SpyneJS sort batches (n=40)
   produced 1.1–12.5 s garbage this way — preserved, labeled, unused.
2. **SpyneJS sort "noise" batches were doubly invalid:** the clicks
   in those batches were dispatched on the header's inner span and
   never reached the bound button — no sort occurred at all; the
   series measures pure live-feed cadence. Root-caused, then re-run
   with real clicks (the included set).
3. **Iframe rendering artifact (SpyneJS cold-load): 8 samples
   excluded, preserved verbatim.** In iframe context the SPA's
   rAF-driven renderer stalls (7.3–9.6 s to rows despite ~800 ms
   bootstrap-complete) — an embedded-rendering artifact, not app
   behavior; top-level loads land at 772 ms p50. The two iframe
   batches (hidden and visible) are both in the CSV.
4. **Next.js cold-load throttled batch: excluded.** One early batch
   clustered at ~1000 ms because hidden-tab throttling delayed
   observer attach to ~1 s; the values measured attach latency, not
   content timing. Replaced by the MessageChannel probe (~115 ms
   p50). Preserved in the CSV.
5. **Superseded-method sets kept:** earlier interval-timer-detected
   sort/page batches (consistent with the MessageChannel replacements)
   and a row-scoped 600 ms-quiet toggle set for Next.js (which
   occasionally catches the server revalidation wave — a different,
   also-interesting quantity, but not the perceived flip).
6. **Viewport-overlap false alarm (recorded because we briefly
   believed it):** at a squeezed 785 px viewport the SpyneJS header
   columns overlap and clicks aimed at "Amount" landed on the "Date"
   span — three real clicks with no sort applied, initially suspected
   as an app defect. At normal width, sorting works in all columns
   and both directions (independently confirmed on the live site).
   Harness-targeting artifact, not an application finding.
7. **Fixture writes:** toggle sampling flips invoice statuses in
   even-count pairs (net zero). Discarded early batches may have left
   a handful of statuses flipped on both live fixtures — within the
   live simulation's own churn, disclosed for completeness.
8. **One unrecorded loss:** the very first Next.js toggle batch (n=8,
   body-scoped) timed out before returning; its values were never
   recorded and do not appear in the CSV. Disclosed here so the file
   count reconciles.

## Files

- [`runtime-samples.csv`](runtime-samples.csv) — every raw sample,
  byte-identical to the session record, with status labels.
- [`summary.md`](summary.md) — the p50/p95 table, the aggregate
  agent-cost figure, and the reading both sides' numbers support.
