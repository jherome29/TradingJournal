import type { Direction, Trade } from "./types";

export interface OverallStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number; // 0-100
  totalPnl: number;
  avgWin: number;
  avgLoss: number; // positive number (magnitude)
  profitFactor: number | null; // null when there are no losses to divide by
  currentStreak: { type: "win" | "loss" | "none"; count: number };
  bestTrade: Trade | null;
  worstTrade: Trade | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Trades with a null pnl (still open) are excluded from performance math. */
function closedTrades(trades: Trade[]): Trade[] {
  return trades.filter((t) => t.pnl !== null);
}

export function computeOverallStats(trades: Trade[]): OverallStats {
  const closed = closedTrades(trades);
  const wins = closed.filter((t) => (t.pnl as number) > 0);
  const losses = closed.filter((t) => (t.pnl as number) < 0);
  const totalPnl = round2(closed.reduce((sum, t) => sum + (t.pnl as number), 0));

  const grossWin = wins.reduce((sum, t) => sum + (t.pnl as number), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl as number), 0));

  // Streak: walk trades most-recent-first (by traded_on) counting consecutive
  // same-outcome trades from the end.
  const chronological = [...closed].sort((a, b) =>
    a.traded_on < b.traded_on ? -1 : a.traded_on > b.traded_on ? 1 : 0
  );
  let currentStreak: OverallStats["currentStreak"] = { type: "none", count: 0 };
  for (let i = chronological.length - 1; i >= 0; i--) {
    const pnl = chronological[i].pnl as number;
    const outcome: "win" | "loss" = pnl >= 0 ? "win" : "loss";
    if (currentStreak.type === "none") {
      currentStreak = { type: outcome, count: 1 };
    } else if (currentStreak.type === outcome) {
      currentStreak.count++;
    } else {
      break;
    }
  }

  const bestTrade = closed.length
    ? closed.reduce((best, t) => ((t.pnl as number) > (best.pnl as number) ? t : best))
    : null;
  const worstTrade = closed.length
    ? closed.reduce((worst, t) => ((t.pnl as number) < (worst.pnl as number) ? t : worst))
    : null;

  return {
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? round2((wins.length / closed.length) * 100) : 0,
    totalPnl,
    avgWin: wins.length ? round2(grossWin / wins.length) : 0,
    avgLoss: losses.length ? round2(grossLoss / losses.length) : 0,
    profitFactor: grossLoss > 0 ? round2(grossWin / grossLoss) : null,
    currentStreak,
    bestTrade,
    worstTrade,
  };
}

export interface EquityPoint {
  traded_on: string;
  cumulativePnl: number;
}

/** Chronological running total of pnl, one point per closed trade. */
export function computeEquityCurve(trades: Trade[]): EquityPoint[] {
  const chronological = [...closedTrades(trades)].sort((a, b) =>
    a.traded_on < b.traded_on ? -1 : a.traded_on > b.traded_on ? 1 : 0
  );
  let running = 0;
  return chronological.map((t) => {
    running = round2(running + (t.pnl as number));
    return { traded_on: t.traded_on, cumulativePnl: running };
  });
}

export interface DirectionBreakdown {
  direction: Direction;
  count: number;
  winRate: number;
  pnl: number;
}

export function computeDirectionBreakdown(trades: Trade[]): DirectionBreakdown[] {
  const closed = closedTrades(trades);
  return (["long", "short"] as Direction[]).map((direction) => {
    const group = closed.filter((t) => t.direction === direction);
    const wins = group.filter((t) => (t.pnl as number) > 0);
    return {
      direction,
      count: group.length,
      winRate: group.length ? round2((wins.length / group.length) * 100) : 0,
      pnl: round2(group.reduce((sum, t) => sum + (t.pnl as number), 0)),
    };
  });
}

/** Expected dollar value per trade, given the win rate and average win/loss size. */
export function computeExpectancy(trades: Trade[]): number {
  const stats = computeOverallStats(trades);
  if (stats.totalTrades === 0) return 0;
  const winRateFrac = stats.wins / stats.totalTrades;
  const lossRateFrac = stats.losses / stats.totalTrades;
  return round2(winRateFrac * stats.avgWin - lossRateFrac * stats.avgLoss);
}

export interface DrawdownResult {
  amount: number; // positive magnitude of the largest peak-to-trough decline
  peakDate: string | null;
  troughDate: string | null;
}

/** Largest decline from a running equity peak to a subsequent low. */
export function computeMaxDrawdown(trades: Trade[]): DrawdownResult {
  const equity = computeEquityCurve(trades);
  if (equity.length === 0) return { amount: 0, peakDate: null, troughDate: null };

  let peak = equity[0].cumulativePnl;
  let peakDate = equity[0].traded_on;
  let maxDrawdown = 0;
  let maxPeakDate: string | null = null;
  let maxTroughDate: string | null = null;

  for (const point of equity) {
    if (point.cumulativePnl > peak) {
      peak = point.cumulativePnl;
      peakDate = point.traded_on;
    }
    const drawdown = peak - point.cumulativePnl;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxPeakDate = peakDate;
      maxTroughDate = point.traded_on;
    }
  }

  return { amount: round2(maxDrawdown), peakDate: maxPeakDate, troughDate: maxTroughDate };
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface DayOfWeekBreakdown {
  day: string;
  count: number;
  winRate: number;
  pnl: number;
}

/** Uses local calendar y/m/d components so the result doesn't depend on the
    runtime's timezone offset shifting which calendar day a date string means. */
export function computeDayOfWeekBreakdown(trades: Trade[]): DayOfWeekBreakdown[] {
  const buckets = WEEKDAY_LABELS.map(() => ({ count: 0, wins: 0, pnl: 0 }));

  for (const t of closedTrades(trades)) {
    const [y, m, d] = t.traded_on.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    buckets[weekday].count++;
    buckets[weekday].pnl += t.pnl as number;
    if ((t.pnl as number) > 0) buckets[weekday].wins++;
  }

  return WEEKDAY_LABELS.map((day, i) => ({
    day,
    count: buckets[i].count,
    winRate: buckets[i].count ? round2((buckets[i].wins / buckets[i].count) * 100) : 0,
    pnl: round2(buckets[i].pnl),
  }));
}

export interface PnlBucket {
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

/** Fixed-count histogram of closed-trade P/L, evenly spanning the observed range. */
export function computePnlDistribution(trades: Trade[], bucketCount = 8): PnlBucket[] {
  const values = closedTrades(trades).map((t) => t.pnl as number);
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ rangeStart: min, rangeEnd: max, count: values.length }];
  }

  const bucketSize = (max - min) / bucketCount;
  const buckets: PnlBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    rangeStart: round2(min + i * bucketSize),
    rangeEnd: round2(min + (i + 1) * bucketSize),
    count: 0,
  }));

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
    buckets[idx].count++;
  }

  return buckets;
}

export interface DailyPnl {
  date: string; // YYYY-MM-DD
  pnl: number;
  count: number;
}

/** One entry per day that had at least one closed trade. */
export function computeDailyPnl(trades: Trade[]): DailyPnl[] {
  const byDate = new Map<string, DailyPnl>();
  for (const t of closedTrades(trades)) {
    const existing = byDate.get(t.traded_on);
    if (existing) {
      existing.pnl = round2(existing.pnl + (t.pnl as number));
      existing.count++;
    } else {
      byDate.set(t.traded_on, { date: t.traded_on, pnl: t.pnl as number, count: 1 });
    }
  }
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}
