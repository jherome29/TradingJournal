import type { Trade } from "./types";

export type DateRange = "week" | "month" | "year" | "all";

const VALID_RANGES: DateRange[] = ["week", "month", "year", "all"];

export function parseDateRange(raw: string | undefined): DateRange {
  return VALID_RANGES.includes(raw as DateRange) ? (raw as DateRange) : "all";
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing `today` (ISO week start, not Sunday-start). */
function startOfWeek(today: Date): Date {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function startOfMonth(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function startOfYear(today: Date): Date {
  return new Date(today.getFullYear(), 0, 1);
}

/** Keeps trades on/after the start of the given calendar-aligned period containing `today`.
    Compares `traded_on` as plain YYYY-MM-DD strings, which sort correctly without
    needing Date parsing (and avoids timezone shifts on the trade side). */
export function filterTradesByRange(
  trades: Trade[],
  range: DateRange,
  today: Date = new Date()
): Trade[] {
  if (range === "all") return trades;

  const start =
    range === "week" ? startOfWeek(today) : range === "month" ? startOfMonth(today) : startOfYear(today);
  const cutoff = toDateString(start);

  return trades.filter((t) => t.traded_on >= cutoff);
}
