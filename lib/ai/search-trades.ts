import type { SupabaseClient } from "@supabase/supabase-js";

export interface SimilarTrade {
  id: string;
  traded_on: string;
  direction: string | null;
  pnl: number | null;
  notes: string | null;
  distance: number;
}

/** Finds trades whose notes are semantically similar to the given query
    embedding, via the match_trades Postgres function. Runs through the
    caller's own Supabase client, so RLS applies exactly as it does
    everywhere else in this app -- a user can only ever match their own
    trades. */
export async function searchSimilarTrades(
  supabase: SupabaseClient,
  queryEmbeddingLiteral: string,
  matchCount = 5
): Promise<SimilarTrade[]> {
  const { data, error } = await supabase.rpc("match_trades", {
    query_embedding: queryEmbeddingLiteral,
    match_count: matchCount,
  });
  if (error) throw new Error(`match_trades RPC failed: ${error.message}`);
  return data ?? [];
}
