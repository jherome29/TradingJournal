-- Core trades table for the personal XAUUSD journal.
-- Kept intentionally minimal (phase one). Add columns like session,
-- strategy_tag, or risk_pct later with `alter table trades add column ...`
-- once it's clear what's worth tracking.

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  traded_on date not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric(10, 2) not null,
  exit_price numeric(10, 2),
  size numeric(10, 2) not null,
  pnl numeric(12, 2),
  notes text,
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sorting the journal by date is the primary read pattern (list view).
create index if not exists trades_user_id_traded_on_idx
  on trades (user_id, traded_on desc);

alter table trades enable row level security;

-- Ownership-scoped policies: TO authenticated alone only checks the role,
-- so every policy also filters rows by auth.uid() = user_id.
create policy "Users can view own trades"
  on trades for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own trades"
  on trades for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own trades"
  on trades for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own trades"
  on trades for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Keep updated_at accurate on every edit.
create or replace function set_trades_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trades_set_updated_at
  before update on trades
  for each row
  execute function set_trades_updated_at();

-- Storage bucket for trade screenshots. Private by default; access is
-- via signed URLs generated per-user (see storage RLS below).
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', false)
on conflict (id) do nothing;

-- Screenshots are stored under a per-user folder: {user_id}/{filename}.
-- Upsert (replacing a screenshot) needs INSERT + SELECT + UPDATE, not just INSERT.
create policy "Users can view own screenshots"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can upload own screenshots"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trade-screenshots'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can update own screenshots"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'trade-screenshots'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own screenshots"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
