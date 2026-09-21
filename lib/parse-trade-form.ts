import type { Direction } from "./types";

export interface TradeFormInput {
  traded_on: string;
  direction: Direction;
  entry_price: number | null;
  exit_price: number | null;
  size: number | null;
  pnl: number | null;
  risk: number | null;
  r_multiple: number | null;
  session: string | null;
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

/**
 * R-multiple is a strict function of risk and pnl (how many multiples of
 * what you risked you made or lost), not an independent value -- letting it
 * be typed in separately is how the imported Notion data ended up with
 * inconsistent rows (e.g. a negative risk paired with a stated R-multiple
 * that didn't match pnl / risk at all). Computing it here is the single
 * source of truth for trades logged going forward.
 */
function computeRMultiple(pnl: number | null, risk: number | null): number | null {
  if (pnl === null || risk === null || risk === 0) return null;
  return Math.round((pnl / risk) * 100) / 100;
}

export function parseTradeForm(formData: FormData): TradeFormInput {
  const tradedOn = formData.get("traded_on") as string;
  const notesRaw = formData.get("notes") as string | null;
  const sessionRaw = formData.get("session") as string | null;
  const direction = formData.get("direction") as string;

  // The direction <select> always has a value (defaults to "long"), so this
  // only actually rejects tampered/malformed requests, not normal use.
  if (direction !== "long" && direction !== "short") {
    throw new Error(`Invalid direction: ${direction}`);
  }
  if (!tradedOn) {
    throw new Error("Date is required.");
  }

  const pnl = parseOptionalFiniteNumber(formData.get("pnl") as string, "Net PnL");
  const risk = parseOptionalPositiveNumber(formData.get("risk") as string, "Risk");

  return {
    traded_on: tradedOn,
    direction,
    // Optional, not required: some historical trades (imported from before
    // consistent tracking) genuinely have no recorded entry price or size,
    // and editing those trades' other fields shouldn't be blocked on
    // backfilling values that were never known.
    entry_price: parseOptionalPositiveNumber(formData.get("entry_price") as string, "Entry price"),
    exit_price: parseOptionalPositiveNumber(formData.get("exit_price") as string, "Exit price"),
    size: parseOptionalPositiveNumber(formData.get("size") as string, "Size"),
    pnl,
    risk,
    r_multiple: computeRMultiple(pnl, risk),
    session: sessionRaw || null,
    notes: notesRaw || null,
  };
}
