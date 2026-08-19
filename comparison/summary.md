# Comparison summary — interaction latency and agent cost

All values from [`runtime-samples.csv`](runtime-samples.csv)
(`status=included` rows only); method and exclusions in
[`README.md`](README.md). Hosted, live deployments, scale fixture,
live payment simulation active on both sides.

## Interaction latency (p50 / p95, ms)

| Interaction | Next.js | SpyneJS |
|---|---|---|
| Sort click → table settled (n=20/side) | 132 / 181 | 24 / 200 |
| Deep page jump (first ↔ last) → settled (n=20/side) | 130 / 294 | 58 / 201 |
| Status toggle → first change in the clicked row (n=24/side) | 11 / 14 | 68 / 93 |
| Cold load → first data rows *(proxy: rows present in SSR document, n=20)* | 115 / 145 | — |
| Cold load → bootstrap-complete *(proxy: ~460 KB data fetch done; rows one frame later, n=12)* | — | 772 / 1191 |
| Cold load ttfb | 31 / 47 | 85 / 249 |

Rounding note for re-computers: even-n medians are midpoints, rounded
half-up — the Next.js toggle median is 10.5 (printed 11) and its
cold-load ttfb median is 30.5 (printed 31). Recompute from the CSV;
the raw values govern.

Frames that ship with these numbers:

- **Both toggle results sit under the ~100 ms perceptual-instant
  threshold.** 11 ms is an optimistic local update reconciled with
  the server afterward; 68 ms is the actual state emission reaching
  every subscribed surface in one pass. The gap is architectural
  accounting, not felt sluggishness — and each design's cost is the
  other's benefit (reconciliation machinery on one side, a slower
  first paint of the flip on the other).
- **The cold-load rows are two architecture-appropriate proxies, not
  one metric.** A server-rendered document carries its rows in the
  HTML; an SPA ships a shell and buys the session's data in one
  ~460 KB purchase. Neither instant exists in the other architecture.
- p95s on both sides carry live-feed noise (the simulation mutates
  both applications throughout sampling); medians are robust to it.

## Agent cost

Across the twelve-build program (six scored rounds, both sides,
identical task statements, fresh agent session per feature), the
SpyneJS side consumed **~1.9× the agent output tokens in aggregate**
(per-round range 1.57–2.60×), measured from the session transcripts
of every build. Next.js is the agents' home terrain; that cost
difference is stated as measured.

## The reading

> in-page data interactions settle ~2–5× faster on the SpyneJS side;
> first-paint-of-data on cold load and perceived toggle flip are
> faster on the Next.js side — each architecture wins exactly where
> its model predicts.

The server-rendered document wins arrival (rows in the initial HTML;
~6× faster to first data) and the optimistic flip (11 vs 68 ms);
client-held data wins every subsequent data interaction (sort 24 vs
132, page jump 58 vs 130) because after its slower load the SPA never
makes another round trip for them. No result in this table is a
general verdict about either framework — one application, these
interactions, this method.
