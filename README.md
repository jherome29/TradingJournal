# Trading Journal

A personal trading journal for logging and reviewing XAUUSD (gold) trades. It
replaces unstructured notes-and-screenshots (previously kept in Notion) with a
structured, queryable log of every trade.

## Scope (phase one)

This is the **core journal only**: log a trade, list trades, edit or delete
an entry, attach a screenshot. No AI features, analytics, or automation yet —
those come later, once real usage shows which fields and metrics are actually
worth tracking.

The `trades` schema is intentionally minimal (date, direction, entry/exit
price, size, PnL, notes, screenshot) and easy to extend. Fields like
session/time-of-day, strategy tag, or risk % are expected additions once the
core habit of logging is in place.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Supabase](https://supabase.com/) — Auth, Postgres, Storage
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) for unit tests

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com/dashboard), then
either:

- **Link and push (recommended):**
  ```bash
  supabase login
  supabase link --project-ref <your-project-ref>
  supabase db push
  ```
- **Or manually:** paste the contents of
  `supabase/migrations/20250101000000_create_trades.sql` into the Supabase
  SQL Editor and run it.

This creates the `trades` table (with row-level security scoped to the
signed-in user) and a private `trade-screenshots` storage bucket.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's **Settings > API** page. Never commit `.env.local`.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login` — use the "Sign up" button to create your account (Supabase Auth may
require email confirmation depending on your project's auth settings).

## Scripts

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test              # Vitest
```

## CI / branching

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, and tests
on every push and pull request against `main`, `develop`, and `feature/**`
branches. The intended flow is:

```
feature/<name> → develop → main
```

Open feature branches off `develop`, PR into `develop`, and periodically PR
`develop` into `main` for releases.

## Project structure

```
app/
  login/           # email/password auth (sign in, sign up, sign out)
  trades/          # list, create, edit/delete trades
lib/
  supabase/        # browser + server Supabase clients
  parse-trade-form.ts  # form parsing, unit tested
  types.ts         # shared Trade type
supabase/
  migrations/      # SQL schema + RLS policies
```
