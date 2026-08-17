# Violation taxonomy — as scored

This is the rule set behind every published violation count, extracted
verbatim from the scoring implementation
([`l1-linter.js`](l1-linter.js) — the exact code that produced the
published numbers; [`l1-selftest.js`](l1-selftest.js) is its
positive-control fixture run). Nothing here is post-hoc: the linter,
weights, and formula predate the headline runs.

**A violation, in one sentence:** one lint-check hit — a static
pattern in an attempt's generated code that contradicts a specific
operation card's rule (`checkId` → `opId`), counted per occurrence,
by a pure mechanical linter (regex + light parsing, no AST, no
model in the loop).

**L1 score per attempt:** `100 − Σ(weighted deductions)`, floored
at 0. Registry-form checks weigh 15 each; all other checks 8 each.

## The checks

Eight **registry checks** (weight 15) all enforce one op —
`recognize-never-emit`: the framework's internal registry forms are
recognize-only; application code must never emit them. Each check
targets one form:

| checkId | form it detects |
|---|---|
| `registry:sendCachedPayload` | the internal cached-payload sender |
| `registry:addChannel` | the deprecated channel-registration call |
| `registry:el$-toggle` | internal el$ toggle form |
| `registry:template-dot-star` | `.template*` internal accessors |
| `registry:string-channels` | string-literal channel registration |
| `registry:non-array-traits` | traits declared as non-array |
| `registry:propFilters` | internal propFilters surface |
| `registry:viewstream-getChannel` | ViewStream `getChannel` internal form |

Ten **discipline checks** (weight 8), each enforcing one card:

| checkId | opId (the card it enforces) | what it detects |
|---|---|---|
| `addEventListener` | `declare-broadcast-events` | manual DOM listeners instead of declared broadcastEvents |
| `constants-file` | `spyneappproperties-vs-channel-state` | state parked in constants files instead of its sanctioned home |
| `viewstream-extra-method` | `wiring-surface-only-on-viewstream` | methods on a ViewStream beyond the four sanctioned members (`constructor`, `broadcastEvents`, `addActionListeners`, `onRendered`) |
| `regex-specials-in-label` | `match-action-labels-by-pattern` | regex metacharacters inside action-label strings |
| `nested-payload-key` | `fetch-conform-map` | reaching through unconformed nested payload keys |

(Several check ids appear at more than one detection site in the
linter; the linter source is the authority — every check documents
its false-positive/false-negative surface inline.)

## Counting rules

- Violations are counted **per occurrence per attempt** (one attempt
  may carry several).
- An attempt that failed generation (recorded `failureMode`, e.g. a
  provider error or unparseable output) emits no files, so it carries
  zero violations **by construction**; failed attempts are disclosed
  separately in every denominator.
- The linter runs identically on every arm — baseline attempts and
  full-stack attempts are scored by the same code path in the same
  run.
