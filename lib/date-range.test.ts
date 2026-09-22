import { describe, expect, it } from "vitest";
import { parseDateRange, filterTradesByRange } from "./date-range";
import type { Trade } from "./types";

function trade(overrides: Partial<Trade>): Trade {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    traded_on: "2026-01-01",
    direction: "long",
    entry_price: 2650,
    exit_price: 2660,
    size: 1,
    pnl: 10,
    notes: null,
    risk: null,
    r_multiple: null,
    session: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("parseDateRange", () => {
  it("returns 'all' for undefined", () => {
    expect(parseDateRange(undefined)).toBe("all");
  });

  it("returns 'all' for an invalid value", () => {
    expect(parseDateRange("decade")).toBe("all");
  });

  it.each(["week", "month", "year", "all"])("accepts the valid value %s", (value) => {
    expect(parseDateRange(value)).toBe(value);
  });
});

describe("filterTradesByRange", () => {
  // 2026-01-01 is a Thursday (per existing computeDayOfWeekBreakdown test),
  // so 2026-01-12 is a Monday and 2026-01-14 is the Wednesday within that week.
  const wednesday = new Date(2026, 0, 14);

  it("returns every trade for 'all'", () => {
    const trades = [trade({ traded_on: "2020-01-01" }), trade({ traded_on: "2026-01-14" })];
    expect(filterTradesByRange(trades, "all", wednesday)).toHaveLength(2);
  });

  it("'week' includes trades from this week's Monday onward", () => {
    const trades = [
      trade({ traded_on: "2026-01-11" }), // Sunday, previous week
      trade({ traded_on: "2026-01-12" }), // Monday, this week
      trade({ traded_on: "2026-01-14" }), // today
    ];
    const result = filterTradesByRange(trades, "week", wednesday);
    expect(result.map((t) => t.traded_on)).toEqual(["2026-01-12", "2026-01-14"]);
  });

  it("'week' anchors correctly when today itself is a Sunday", () => {
    const sunday = new Date(2026, 0, 11); // 2026-01-11 is a Sunday
    const trades = [
      trade({ traded_on: "2026-01-04" }), // previous week's Sunday
      trade({ traded_on: "2026-01-05" }), // this week's Monday
    ];
    const result = filterTradesByRange(trades, "week", sunday);
    expect(result.map((t) => t.traded_on)).toEqual(["2026-01-05"]);
  });

  it("'month' includes trades from the 1st of the current month onward", () => {
    const trades = [
      trade({ traded_on: "2025-12-31" }),
      trade({ traded_on: "2026-01-01" }),
      trade({ traded_on: "2026-01-14" }),
    ];
    const result = filterTradesByRange(trades, "month", wednesday);
    expect(result.map((t) => t.traded_on)).toEqual(["2026-01-01", "2026-01-14"]);
  });

  it("'year' includes trades from Jan 1st of the current year onward", () => {
    const trades = [trade({ traded_on: "2025-12-31" }), trade({ traded_on: "2026-01-01" })];
    const result = filterTradesByRange(trades, "year", wednesday);
    expect(result.map((t) => t.traded_on)).toEqual(["2026-01-01"]);
  });

  it("defaults 'today' to the current date when not provided", () => {
    const trades = [trade({ traded_on: "1999-01-01" })];
    expect(filterTradesByRange(trades, "year")).toEqual([]);
  });
});
