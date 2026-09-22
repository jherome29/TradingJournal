-- risk is a dollar risk amount and should never be negative. Added as
-- NOT VALID because at least one imported historical trade currently
-- violates this (likely a sign error from the Notion import) -- existing
-- rows are not retroactively checked. New inserts/updates are enforced
-- immediately; once the bad row is corrected, run
--   alter table public.trades validate constraint trades_risk_nonnegative;
-- to confirm the whole table is clean.
alter table public.trades
  add constraint trades_risk_nonnegative check (risk >= 0) not valid;
