import type { Direction } from "./types";

export interface TradeFormInput {
  traded_on: string;
  direction: Direction;
  entry_price: number;
  exit_price: number | null;
  size: number;
  pnl: number | null;
  notes: string | null;
}

export function parseTradeForm(formData: FormData): TradeFormInput {
  const exitPriceRaw = formData.get("exit_price") as string | null;
  const pnlRaw = formData.get("pnl") as string | null;
  const notesRaw = formData.get("notes") as string | null;
  const direction = formData.get("direction") as string;

  if (direction !== "long" && direction !== "short") {
    throw new Error(`Invalid direction: ${direction}`);
  }

  return {
    traded_on: formData.get("traded_on") as string,
    direction,
    entry_price: Number(formData.get("entry_price")),
    exit_price: exitPriceRaw ? Number(exitPriceRaw) : null,
    size: Number(formData.get("size")),
    pnl: pnlRaw ? Number(pnlRaw) : null,
    notes: notesRaw || null,
  };
}
