# Seed fixtures

The canonical seeder for every arm of the comparison, copied verbatim
from the Next.js arm (`app/seed/route.ts` there — both apps seed from
this one route so the databases are identical by construction).

Three deterministic sets, selected by query parameter:

| Set | Customers | Invoices | Purpose |
|---|---|---|---|
| `?set=next-learn` | 6 | 13 | fidelity — byte-for-byte the Next.js Learn tutorial data |
| default (enterprise) | 40 | 500 | measurement — large enough that architectures stop looking alike |
| `?set=scale` | 200 | 5,000 | the B4+ scale condition |

Determinism matters: every id, name, amount, date, and status derives
from a fixed seed, so seeding twice produces byte-identical databases
(including invoice UUIDs). Cross-arm metrics are meaningless if the
arms hold different data.

- `route.ts` — the seeder (a Next.js route handler; trivially portable
  to a standalone script — it is plain `postgres` + `bcrypt`).
- `placeholder-data.ts` — the verbatim next-learn tutorial set.
- `enterprise-data.ts` — the deterministic generator for the
  enterprise and scale sets.
