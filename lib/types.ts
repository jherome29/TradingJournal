export type Direction = "long" | "short";

export interface Trade {
  id: string;
  user_id: string;
  traded_on: string; // date, YYYY-MM-DD
  // Nullable: entry_price/direction/size are unknown on some imported
  // historical trades that predate consistent tracking. New trades logged
  // through the app UI still require all three (enforced in
  // lib/parse-trade-form.ts) -- this is a DB-level exception for imported
  // history, not a relaxed going-forward standard.
  direction: Direction | null;
  entry_price: number | null;
  exit_price: number | null;
  size: number | null;
  pnl: number | null;
  notes: string | null;
  screenshot_url: string | null; // storage object path, not a public URL
  risk: number | null; // dollar risk amount
  r_multiple: number | null;
  session: string | null;
  created_at: string;
  updated_at: string;
}
