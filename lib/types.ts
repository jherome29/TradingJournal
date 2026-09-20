export type Direction = "long" | "short";

export interface Trade {
  id: string;
  user_id: string;
  traded_on: string; // date, YYYY-MM-DD
  direction: Direction;
  entry_price: number;
  exit_price: number | null;
  size: number;
  pnl: number | null;
  notes: string | null;
  screenshot_url: string | null; // storage object path, not a public URL
  created_at: string;
  updated_at: string;
}
