-- Driven by migrating real historical trade data from Notion: entry_price
-- and exit_price were never actually tracked (the trader logged risk in
-- dollars and R-multiples instead of price levels), and direction/size are
-- missing on ~57% of historical trades that predate consistent tracking.
-- Relaxing these to nullable reflects reality rather than fabricating data
-- to satisfy a constraint. New trades logged through the app UI still
-- require direction/entry_price/size at the application layer (see
-- lib/parse-trade-form.ts) -- this is a DB-level exception for imported
-- history, not a relaxation of the going-forward logging standard.
alter table trades alter column direction drop not null;
alter table trades alter column entry_price drop not null;
alter table trades alter column size drop not null;

-- New columns the historical data proves are worth tracking (dollar risk,
-- R-multiple, and trading session were present on nearly every real trade
-- once the trader started filling them in).
alter table trades add column if not exists risk numeric(12, 2);
alter table trades add column if not exists r_multiple numeric(6, 2);
alter table trades add column if not exists session text;
