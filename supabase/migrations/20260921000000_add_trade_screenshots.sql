-- Real historical trades imported from Notion prove a single screenshot_url
-- column isn't enough -- some trades have up to 5 chart screenshots
-- attached. Move screenshots to their own table so a trade can have any
-- number of them, ordered by position.
create table if not exists trade_screenshots (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades (id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trade_screenshots_trade_id_idx
  on trade_screenshots (trade_id, position);

alter table trade_screenshots enable row level security;

grant select, insert, update, delete on table trade_screenshots to authenticated;

-- This table has no user_id column of its own -- ownership is derived from
-- the parent trade, so every policy checks it via an EXISTS join rather
-- than a direct auth.uid() = user_id comparison.
create policy "Users can view own trade screenshots"
  on trade_screenshots for select
  to authenticated
  using (
    exists (
      select 1 from trades
      where trades.id = trade_screenshots.trade_id
        and trades.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own trade screenshots"
  on trade_screenshots for insert
  to authenticated
  with check (
    exists (
      select 1 from trades
      where trades.id = trade_screenshots.trade_id
        and trades.user_id = (select auth.uid())
    )
  );

create policy "Users can update own trade screenshots"
  on trade_screenshots for update
  to authenticated
  using (
    exists (
      select 1 from trades
      where trades.id = trade_screenshots.trade_id
        and trades.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from trades
      where trades.id = trade_screenshots.trade_id
        and trades.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own trade screenshots"
  on trade_screenshots for delete
  to authenticated
  using (
    exists (
      select 1 from trades
      where trades.id = trade_screenshots.trade_id
        and trades.user_id = (select auth.uid())
    )
  );

-- Nothing currently populates the old single-screenshot column (verified
-- zero non-null values across all 258 imported + manually logged trades),
-- so dropping it is not a data loss -- screenshots now live exclusively in
-- trade_screenshots.
alter table trades drop column if exists screenshot_url;
