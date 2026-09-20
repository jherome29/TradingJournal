import { describe, expect, it } from "vitest";
import {
  computeOverallStats,
  computeEquityCurve,
  computeDirectionBreakdown,
  computeDailyPnl,
  computeExpectancy,
  computeMaxDrawdown,
  computeDayOfWeekBreakdown,
  computePnlDistribution,
} from "./trade-stats";
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
    screenshot_url: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeOverallStats", () => {
  it("computes win rate, pnl, and profit factor", () => {
    const trades = [
      trade({ traded_on: "2026-01-01", pnl: 100 }),
      trade({ traded_on: "2026-01-02", pnl: -50 }),
      trade({ traded_on: "2026-01-03", pnl: 200 }),
    ];
    const stats = computeOverallStats(trades);

    expect(stats.totalTrades).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(1);
    expect(stats.winRate).toBeCloseTo(66.67, 1);
    expect(stats.totalPnl).toBe(250);
    expect(stats.profitFactor).toBe(6); // 300 gross win / 50 gross loss
  });

  it("excludes open trades (null pnl) from stats", () => {
    const trades = [trade({ pnl: 100 }), trade({ pnl: null, exit_price: null })];
    expect(computeOverallStats(trades).totalTrades).toBe(1);
  });

  it("tracks the current streak from the most recent trade backward", () => {
    const trades = [
      trade({ traded_on: "2026-01-01", pnl: 100 }),
      trade({ traded_on: "2026-01-02", pnl: -20 }),
      trade({ traded_on: "2026-01-03", pnl: 30 }),
      trade({ traded_on: "2026-01-04", pnl: 40 }),
    ];
    expect(computeOverallStats(trades).currentStreak).toEqual({ type: "win", count: 2 });
  });

  it("returns profitFactor null when there are no losses", () => {
    const trades = [trade({ pnl: 100 })];
    expect(computeOverallStats(trades).profitFactor).toBeNull();
  });

  it("handles an empty list without dividing by zero", () => {
    const stats = computeOverallStats([]);
    expect(stats.totalTrades).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.currentStreak).toEqual({ type: "none", count: 0 });
  });
});

describe("computeEquityCurve", () => {
  it("returns a running total sorted chronologically", () => {
    const trades = [
      trade({ traded_on: "2026-01-03", pnl: 50 }),
      trade({ traded_on: "2026-01-01", pnl: 100 }),
      trade({ traded_on: "2026-01-02", pnl: -30 }),
    ];
    expect(computeEquityCurve(trades)).toEqual([
      { traded_on: "2026-01-01", cumulativePnl: 100 },
      { traded_on: "2026-01-02", cumulativePnl: 70 },
      { traded_on: "2026-01-03", cumulativePnl: 120 },
    ]);
  });
});

describe("computeDirectionBreakdown", () => {
  it("splits stats by long vs short", () => {
    const trades = [
      trade({ direction: "long", pnl: 100 }),
      trade({ direction: "long", pnl: -20 }),
      trade({ direction: "short", pnl: 50 }),
    ];
    const [long, short] = computeDirectionBreakdown(trades);
    expect(long).toEqual({ direction: "long", count: 2, winRate: 50, pnl: 80 });
    expect(short).toEqual({ direction: "short", count: 1, winRate: 100, pnl: 50 });
  });
});

describe("computeDailyPnl", () => {
  it("aggregates multiple trades on the same day", () => {
    const trades = [
      trade({ traded_on: "2026-01-01", pnl: 100 }),
      trade({ traded_on: "2026-01-01", pnl: -40 }),
      trade({ traded_on: "2026-01-02", pnl: 20 }),
    ];
    expect(computeDailyPnl(trades)).toEqual([
      { date: "2026-01-01", pnl: 60, count: 2 },
      { date: "2026-01-02", pnl: 20, count: 1 },
    ]);
  });
});

describe("computeExpectancy", () => {
  it("weights average win/loss by their observed frequency", () => {
    // 2 wins of +100, 2 losses of -50 -> winRate .5, avgWin 100, avgLoss 50
    // expectancy = .5*100 - .5*50 = 25
    const trades = [
      trade({ pnl: 100 }),
      trade({ pnl: 100 }),
      trade({ pnl: -50 }),
      trade({ pnl: -50 }),
    ];
    expect(computeExpectancy(trades)).toBe(25);
  });

  it("returns 0 for no closed trades", () => {
    expect(computeExpectancy([])).toBe(0);
  });
});

describe("computeMaxDrawdown", () => {
  it("finds the largest peak-to-trough decline in the equity curve", () => {
    // Running equity: 100, 150, 90, 120, 60, 200
    // Peaks: 100 -> 150 -> (dd 60 at 90) -> 120 -> (dd 90 at 60) -> 200
    const trades = [
      trade({ traded_on: "2026-01-01", pnl: 100 }),
      trade({ traded_on: "2026-01-02", pnl: 50 }),
      trade({ traded_on: "2026-01-03", pnl: -60 }),
      trade({ traded_on: "2026-01-04", pnl: 30 }),
      trade({ traded_on: "2026-01-05", pnl: -60 }),
      trade({ traded_on: "2026-01-06", pnl: 140 }),
    ];
    const result = computeMaxDrawdown(trades);
    expect(result.amount).toBe(90);
    expect(result.peakDate).toBe("2026-01-02");
    expect(result.troughDate).toBe("2026-01-05");
  });

  it("returns zero drawdown for a strictly rising equity curve", () => {
    const trades = [
      trade({ traded_on: "2026-01-01", pnl: 10 }),
      trade({ traded_on: "2026-01-02", pnl: 10 }),
    ];
    expect(computeMaxDrawdown(trades).amount).toBe(0);
  });
});

describe("computeDayOfWeekBreakdown", () => {
  it("groups trades by the calendar weekday of traded_on", () => {
    // 2026-01-01 Thu, 2026-01-02 Fri, 2026-01-03 Sat
    const trades = [
      trade({ traded_on: "2026-01-01", pnl: 100 }),
      trade({ traded_on: "2026-01-01", pnl: -20 }),
      trade({ traded_on: "2026-01-02", pnl: 50 }),
    ];
    const result = computeDayOfWeekBreakdown(trades);
    const thu = result.find((r) => r.day === "Thu")!;
    const fri = result.find((r) => r.day === "Fri")!;
    const sat = result.find((r) => r.day === "Sat")!;

    expect(thu).toEqual({ day: "Thu", count: 2, winRate: 50, pnl: 80 });
    expect(fri).toEqual({ day: "Fri", count: 1, winRate: 100, pnl: 50 });
    expect(sat).toEqual({ day: "Sat", count: 0, winRate: 0, pnl: 0 });
  });
});

describe("computePnlDistribution", () => {
  it("buckets closed trades evenly across the observed range", () => {
    const trades = [
      trade({ pnl: 0 }),
      trade({ pnl: 50 }),
      trade({ pnl: 100 }),
    ];
    const buckets = computePnlDistribution(trades, 2);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].count + buckets[1].count).toBe(3);
    expect(buckets[0].rangeStart).toBe(0);
    expect(buckets[1].rangeEnd).toBe(100);
  });

  it("puts every trade in one bucket when all values are equal", () => {
    const trades = [trade({ pnl: 20 }), trade({ pnl: 20 })];
    expect(computePnlDistribution(trades, 4)).toEqual([
      { rangeStart: 20, rangeEnd: 20, count: 2 },
    ]);
  });

  it("returns an empty array with no closed trades", () => {
    expect(computePnlDistribution([])).toEqual([]);
  });
});
