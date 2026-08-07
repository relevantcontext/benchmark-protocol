# benchmark-protocol

A framework-neutral protocol for benchmarking web frameworks under AI
agents — the exact instrument behind a measured comparison in which
fresh AI agent sessions evolved the same product on two frameworks
from identical task statements, with every claim counted from
transcripts and published with its misses.

Article: forthcoming. Site: [relevantcontext.io](https://relevantcontext.io)

## What's here

Four artifacts — enough to run the same experiment against any
framework:

1. **[`tasks/`](tasks/)** — the verbatim task statements for all seven
   rounds (B1 sorting, B2 freshness, B3 quick-search, B4 scale, B5
   real-time, P1 polish, P2-1 bulk editing), exactly as delivered to
   every arm, with each round's acceptance criteria.
2. **[`fixtures/`](fixtures/)** — the deterministic seed fixtures
   (6/13 → 40/500 → 200/5,000 customers/invoices), so arms hold
   byte-identical data.
3. **[`counting-rules.md`](counting-rules.md)** — the pre-registered
   metric definitions (blast radius, knowledge accounting,
   corrections, bolt-ons, staleness, hosted latency) and the 5-class
   corrections rubric.
4. **The protocol invariants** (bottom of counting-rules.md) — fresh
   agent per arm, verbatim tasks, harness-verified acceptance,
   pre-registration, transcripts-over-self-reports, immutable audits,
   pre/post tags, publish the misses.

## How to run a round against another framework

1. Stand up the baseline app on your framework (the Next.js Learn
   dashboard is the reference product; seed with `fixtures/`).
2. Pick a round from `tasks/`. Deliver the task text VERBATIM to a
   fresh agent session — no framework hints, no extra context beyond
   what your framework's own agent tooling serves.
3. Do not interject. If the agent stalls, the settlement protocol
   applies: a documented effort window, then descope-as-data.
4. Verify the acceptance list yourself (the harness, not the agent).
5. Count from the transcript per `counting-rules.md`. Tag pre/post.
6. Publish what you measure — including the misses.

## The two arms this protocol has already run against

- [acme-dashboard-nextjs](https://github.com/relevantcontext/acme-dashboard-nextjs) — Next.js 16.3, full first-party agent apparatus
- [acme-dashboard-spynejs](https://github.com/relevantcontext/acme-dashboard-spynejs) — SpyneJS, served Knowledge Base

Both repos carry per-round `pre-*`/`post-*` tags and full metrics
pointers, so every number is inspectable at the commit it was
measured at.

## License

MIT. The fixtures derive from Vercel's
[Next.js Learn](https://nextjs.org/learn) course data (MIT).
