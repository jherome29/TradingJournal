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

function parsePositiveNumber(raw: string, label: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a number.`);
  }
  if (value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return value;
}

function parseOptionalPositiveNumber(raw: string, label: string): number | null {
  if (!raw) return null;
  return parsePositiveNumber(raw, label);
}

function parseOptionalFiniteNumber(raw: string, label: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a number.`);
  }
  return value;
}

export function parseTradeForm(formData: FormData): TradeFormInput {
  const tradedOn = formData.get("traded_on") as string;
  const exitPriceRaw = formData.get("exit_price") as string;
  const pnlRaw = formData.get("pnl") as string;
  const notesRaw = formData.get("notes") as string | null;
  const direction = formData.get("direction") as string;

  if (direction !== "long" && direction !== "short") {
    throw new Error(`Invalid direction: ${direction}`);
  }
  if (!tradedOn) {
    throw new Error("Date is required.");
  }

  return {
    traded_on: tradedOn,
    direction,
    entry_price: parsePositiveNumber(formData.get("entry_price") as string, "Entry price"),
    exit_price: parseOptionalPositiveNumber(exitPriceRaw, "Exit price"),
    size: parsePositiveNumber(formData.get("size") as string, "Size"),
    pnl: parseOptionalFiniteNumber(pnlRaw, "PnL"),
    notes: notesRaw || null,
  };
}
