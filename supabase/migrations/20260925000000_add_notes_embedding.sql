-- One embedding per trade (like pnl, risk -- a single value per row, not a
-- many-per-trade relationship the way trade_screenshots is). 768 dimensions
-- matches the nomic-embed-text model this project uses via local Ollama --
-- this number must match whatever embedding model actually produces, or
-- every insert into this column will fail.
create extension if not exists vector;

alter table public.trades
  add column notes_embedding vector(768);
