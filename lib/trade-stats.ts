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

export interface DirectionCoverage {
  withDirection: number;
  total: number;
}

/** How many closed trades actually have a direction logged, vs the total --
    lets the UI caveat a long/short breakdown that only covers part of the data. */
export function computeDirectionCoverage(trades: Trade[]): DirectionCoverage {
  const closed = closedTrades(trades);
  return {
    withDirection: closed.filter((t) => t.direction !== null).length,
    total: closed.length,
  };
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

/** Fixed-count histogram evenly spanning the observed range of `values`. */
function bucketValues(values: number[], bucketCount: number): PnlBucket[] {
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

/** Fixed-count histogram of closed-trade P/L, evenly spanning the observed range. */
export function computePnlDistribution(trades: Trade[], bucketCount = 8): PnlBucket[] {
  const values = closedTrades(trades).map((t) => t.pnl as number);
  return bucketValues(values, bucketCount);
}

/** Fixed-count histogram of r_multiple, evenly spanning the observed range.
    Unlike dollar P/L, this isn't skewed by risk size changing trade to trade,
    so it's a more honest view of edge quality than computePnlDistribution. */
export function computeRMultipleDistribution(trades: Trade[], bucketCount = 8): PnlBucket[] {
  const values = trades.map((t) => t.r_multiple).filter((r): r is number => r !== null);
  return bucketValues(values, bucketCount);
}

export interface RiskConsistency {
  avgRisk: number | null;
  stddevRisk: number | null; // sample stddev; null with fewer than 2 values
  count: number;
}

/** How consistent position sizing is across trades that have a risk logged.
    A high stddev relative to the average means risk isn't being sized
    consistently, which undermines any $-based stat computed on top of it. */
export function computeRiskConsistency(trades: Trade[]): RiskConsistency {
  const values = trades.map((t) => t.risk).filter((r): r is number => r !== null);
  if (values.length === 0) return { avgRisk: null, stddevRisk: null, count: 0 };

  const avg = values.reduce((sum, r) => sum + r, 0) / values.length;
  const stddev =
    values.length < 2
      ? null
      : Math.sqrt(
          values.reduce((sum, r) => sum + (r - avg) ** 2, 0) / (values.length - 1)
        );

  return {
    avgRisk: round2(avg),
    stddevRisk: stddev === null ? null : round2(stddev),
    count: values.length,
  };
}

/** Average r_multiple across trades that have one; null if none do. */
export function computeAverageR(trades: Trade[]): number | null {
  const values = trades
    .map((t) => t.r_multiple)
    .filter((r): r is number => r !== null);
  if (values.length === 0) return null;
  return round2(values.reduce((sum, r) => sum + r, 0) / values.length);
}

export interface SessionBreakdown {
  session: string;
  count: number;
  winRate: number;
  pnl: number;
}

/** Groups closed trades by exact session string (case-sensitive); null session
    becomes "Unspecified". Session is freeform text, not an enum, so this does
    not merge differently-spelled/cased labels that mean the same session. */
export function computeSessionBreakdown(trades: Trade[]): SessionBreakdown[] {
  const buckets = new Map<string, { count: number; wins: number; pnl: number }>();

  for (const t of closedTrades(trades)) {
    const label = t.session ?? "Unspecified";
    const bucket = buckets.get(label) ?? { count: 0, wins: 0, pnl: 0 };
    bucket.count++;
    bucket.pnl += t.pnl as number;
    if ((t.pnl as number) > 0) bucket.wins++;
    buckets.set(label, bucket);
  }

  return Array.from(buckets.entries())
    .map(([session, b]) => ({
      session,
      count: b.count,
      winRate: b.count ? round2((b.wins / b.count) * 100) : 0,
      pnl: round2(b.pnl),
    }))
    .sort((a, b) =>
      a.session === "Unspecified" ? 1 : b.session === "Unspecified" ? -1 : b.count - a.count
    );
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

export interface PostOutcomeBreakdown {
  count: number;
  winRate: number;
  avgRisk: number | null;
}

export interface PostOutcomeStats {
  afterWin: PostOutcomeBreakdown;
  afterLoss: PostOutcomeBreakdown;
}

function summarizePostOutcomeGroup(group: Trade[]): PostOutcomeBreakdown {
  const wins = group.filter((t) => (t.pnl as number) > 0);
  const risks = group.map((t) => t.risk).filter((r): r is number => r !== null);
  return {
    count: group.length,
    winRate: group.length ? round2((wins.length / group.length) * 100) : 0,
    avgRisk: risks.length ? round2(risks.reduce((sum, r) => sum + r, 0) / risks.length) : null,
  };
}

/** Splits closed trades into "followed a win" vs "followed a loss" (or
    breakeven), by chronological order of traded_on. A gap here -- e.g. worse
    win rate or bigger avg risk after a loss -- is a real tilt/revenge-sizing
    signal, unlike a plain win/loss streak count which only describes what
    happened without indicating whether it's affecting behavior. */
export function computePostOutcomeStats(trades: Trade[]): PostOutcomeStats {
  const chronological = [...closedTrades(trades)].sort((a, b) =>
    a.traded_on < b.traded_on ? -1 : a.traded_on > b.traded_on ? 1 : 0
  );

  const afterWinGroup: Trade[] = [];
  const afterLossGroup: Trade[] = [];

  for (let i = 1; i < chronological.length; i++) {
    const prevWasWin = (chronological[i - 1].pnl as number) > 0;
    (prevWasWin ? afterWinGroup : afterLossGroup).push(chronological[i]);
  }

  return {
    afterWin: summarizePostOutcomeGroup(afterWinGroup),
    afterLoss: summarizePostOutcomeGroup(afterLossGroup),
  };
}
