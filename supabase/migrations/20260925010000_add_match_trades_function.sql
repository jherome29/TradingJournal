-- Postgres function for similarity search over trades.notes_embedding,
-- callable via supabase-js's .rpc(). SECURITY INVOKER (the default) means
-- it runs as the calling user, so RLS on trades still applies -- a user
-- can only ever match their own trades, same as every other query in
-- this app.
create or replace function public.match_trades(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id uuid,
  traded_on date,
  direction text,
  pnl numeric,
  notes text,
  distance float
)
language sql
stable
as $$
  select
    trades.id,
    trades.traded_on,
    trades.direction,
    trades.pnl,
    trades.notes,
    trades.notes_embedding <=> query_embedding as distance
  from public.trades
  where trades.notes_embedding is not null
  order by distance asc
  limit match_count;
$$;

grant execute on function public.match_trades(vector(768), int) to authenticated;
