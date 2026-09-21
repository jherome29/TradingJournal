# Trading Journal — Working Spec

This file is the reference for working in this repo. It describes current
state, not aspirations — treat anything under "Planned direction" as *not
built yet*.

## Purpose

A personal trading journal for logging and reviewing XAUUSD (gold) trades.
It replaces unstructured trade notes (previously paragraphs + screenshots in
Notion, no fixed fields) with a structured, queryable log — so trades can
actually be filtered, aggregated, and reviewed over time instead of just
re-read.

**Current phase: core CRUD only.** Log a trade, list trades, edit/delete,
attach a screenshot. No AI, no analytics, no automation yet. Those are
deliberately deferred until real usage shows what's worth building (see
"Planned direction").

## Tech stack

- **Next.js 16**, App Router, TypeScript, strict mode
- **Supabase**: Postgres (trades table), Auth (email/password), Storage
  (screenshots)
- **Tailwind CSS** for styling
- **Vitest** for unit tests
- Deploy target: not yet decided (local dev only at this phase)

## Data model

Single table, `public.trades` (migration:
`supabase/migrations/20250101000000_create_trades.sql`):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` |
| `user_id` | uuid, FK → `auth.users` | ownership; RLS scopes every policy to `auth.uid() = user_id` |
| `traded_on` | date | not null |
| `direction` | text | `check (direction in ('long','short'))`, nullable |
| `entry_price` | numeric(10,2) | nullable |
| `exit_price` | numeric(10,2) | nullable — trade may still be open |
| `size` | numeric(10,2) | nullable |
| `pnl` | numeric(12,2) | nullable |
| `risk` | numeric(12,2) | nullable — dollar risk amount |
| `r_multiple` | numeric(6,2) | nullable |
| `session` | text | nullable — freeform (e.g. "New York", "London", "Asia") |
| `notes` | text | freeform, the Notion-replacement field |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger |

`direction`, `entry_price`, and `size` were relaxed to nullable in
`supabase/migrations/20260920000000_relax_and_extend_trades.sql` to
accommodate 258 real historical trades imported from a Notion export, where
these fields were never consistently tracked. New trades logged through the
app UI still require all three at the application layer (see
`lib/parse-trade-form.ts`) — this is a DB-level exception for imported
history, not a relaxed going-forward standard.

Screenshots live in a separate table, `public.trade_screenshots` (migration:
`supabase/migrations/20260921000000_add_trade_screenshots.sql`), one row per
image so a trade can have any number of them:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` |
| `trade_id` | uuid, FK → `trades` | `on delete cascade` |
| `storage_path` | text | **storage object path, not a public URL** — bucket `trade-screenshots` is private; signed URLs are generated on read (see `lib/screenshot-url.ts`) |
| `position` | integer | display order within a trade, default 0 |
| `created_at` | timestamptz | |

RLS on `trade_screenshots` has no direct `user_id` column, so its policies
join back to `trades` (`exists (select 1 from trades where trades.id =
trade_screenshots.trade_id and trades.user_id = auth.uid())`) rather than
filtering on the row itself directly. The original `trades.screenshot_url`
column was dropped in this same migration.

RLS is enabled with per-operation policies (select/insert/update/delete),
each scoped to `auth.uid() = user_id`. Table-level `GRANT`s to
`authenticated` are required separately from RLS — both must exist or every
query fails (`grant ... on table trades to authenticated` is in the
migration).

**This schema is intentionally minimal and expected to change.** Do not
over-design it further. Known likely additions once real usage clarifies
what matters: `strategy_tag`, maybe splitting `notes` into structured
sub-fields. When adding columns, prefer a new migration with `alter table
trades add column ...` over restructuring what's there — this table will
get altered often in this phase, that's expected, not a design failure.

## Commands

```bash
npm run dev         # dev server
npm run build        # production build
npm run lint          # ESLint (flat config, eslint.config.mjs)
npm run typecheck      # tsc --noEmit
npm test                 # vitest run
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, and test on every push
and PR against `main`, `develop`, and `feature/**`.

## Branching

```
feature/<name> → develop → main
```

Feature/fix branches off `develop`, PR into `develop`. Periodically PR
`develop` → `main` once things are verified working against a real Supabase
project — `main` should reflect what's actually confirmed working, not just
what passed CI.

## Coding conventions

- **Strict TypeScript.** No `any` as an escape hatch — if a Supabase/`@supabase/ssr`
  callback type isn't inferred, write the interface explicitly (see
  `lib/supabase/server.ts`, `proxy.ts` for the pattern with cookie
  callbacks).
- **Server Actions over API routes** for mutations (`app/trades/actions.ts`,
  `app/login/actions.ts`) — this is a single-app CRUD surface, a separate API
  layer would be unused abstraction.
- **RLS is the authorization boundary, not application code.** Every table
  exposed to `authenticated`/`anon` must have RLS enabled with policies that
  filter by `auth.uid()`, not just `to authenticated` alone (role check
  without an ownership predicate is BOLA/IDOR). New tables need both RLS
  policies *and* explicit `GRANT`s — see the data model note above.
- **Pure logic is extracted and unit tested**, side-effecting code (DB calls,
  redirects) is not — e.g. `lib/parse-trade-form.ts` is tested directly;
  `app/trades/actions.ts` just calls it. Keep that split when adding
  mutations: parse/validate in a plain function, orchestrate in the action.
- **No premature abstraction.** This is a single-user, single-instrument app
  in its first phase — don't add multi-tenancy, plugin systems, or generic
  "trade provider" abstractions until there's a second real use case forcing
  it.
- Keep files scoped to one responsibility (one route's page, one route's
  actions, one shared form component) rather than growing a shared
  "utils"/"helpers" catch-all.

## Planned direction (not built yet)

Two separate expansions are planned **after** the core journal has been used
enough in practice to know what's actually worth tracking. Neither should be
started speculatively — don't scaffold for these ahead of time. The tree
below is the target end-state shape, kept here as a reference for *what*
these two layers eventually cover — it is not a build order and none of the
schema-dependent or AI branches should be started until the core journal has
real usage behind it (see "Current phase" above: 258 real historical trades
have been imported from a Notion export as of 2026-09-21, but no day-to-day
usage of the app itself has happened yet — most of those imported rows are
missing `direction`/`entry_price`/`size`/`exit_price` since the trader
tracked dollar risk and R-multiples instead of price levels).

```
Dashboard          — built: win rate, expectancy, equity curve, recent trades
                     not built: Average R (schema has `r_multiple` now,
                     view not built yet)
Analytics          — built: direction, day/time, distribution, drawdown
                     not built: Strategy breakdown (needs `strategy_tag`);
                     Session breakdown (schema has `session` now, view not
                     built yet)
Calendar           — built
Trade Journal
  └─ Trade Detail   — built: entry/exit/size/notes/screenshot
                     not built: Chart annotation, structured Execution
                     fields, Reasoning, Psychology, Review — likely new
                     columns or a related table, shape TBD by real usage
Setups / Playbook   — not built: a separate strategies/setups table a trade
                     can reference via strategy_tag
Psychology          — not built: undefined scope — figure out what this
                     actually captures once logging real trades surfaces
                     the need
Mistakes / Rule
  Violations        — not built: likely a tags/rules table trades can
                     reference, not a `trades` column
AI Insights         — not built: this *is* the "AI engineering layer" below
  ├─ Trade Review        → AI-assisted trade feedback
  ├─ Pattern Detection   → RAG over trade history + notes
  ├─ Weekly Review       → agent that can query/summarize the journal
  └─ Questions to Review → same agent, different report shape
```

**1. Analysis & insights** — this journal is meant to become more than a
log: an overview layer with stats, charts, and breakdowns (win rate, PnL
over time, performance by direction/session/strategy once those fields
exist, drawdown, R-multiple distribution, etc.) so patterns are visible
without manually re-reading every entry.

**2. AI engineering layer** — once the schema and the analytics layer above
have stabilized from real usage:
- Structured extraction from old Notion export/imports into `trades` rows
- AI-assisted trade feedback (review a trade or a stretch of trades) — "Trade
  Review" in the tree above
- RAG over trade history + notes — "Pattern Detection" above
- An agent that can query/summarize the journal conversationally — "Weekly
  Review" / "Questions to Review" above
- An MCP server exposing this journal's data/tools to other agents
- n8n (or similar) for orchestration/automation between the above
- Eval-gated CI for anything AI-generated, before it ships

If a session's task looks like it's building toward one of these before the
core journal + analytics are solid, flag that explicitly rather than
proceeding — it likely means the request jumped ahead of the stated phase.
