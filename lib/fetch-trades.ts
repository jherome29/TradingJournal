import { createClient } from "@/lib/supabase/server";
import type { Trade } from "@/lib/types";

/** All of the current user's trades, oldest first. RLS scopes this to their own rows. */
export async function fetchAllTrades(): Promise<Trade[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("traded_on", { ascending: true });
  return data ?? [];
}
