import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchAllTrades } from "@/lib/fetch-trades";
import { computeOverallStats, computeEquityCurve } from "@/lib/trade-stats";
import { DirectionBadge } from "../direction-badge";
import { EquityChart } from "./equity-chart";
import { CountUp } from "../count-up";

function streakLabel(streak: { type: "win" | "loss" | "none"; count: number }) {
  if (streak.type === "none") return "No trades yet";
  const noun = streak.type === "win" ? "win" : "loss";
  const plural = streak.count === 1 ? noun : `${noun}${noun.endsWith("s") ? "es" : "s"}`;
  return `${streak.count}-${plural} streak`;
}

export default async function DashboardPage() {
  const trades = await fetchAllTrades();
  const stats = computeOverallStats(trades);
  const equity = computeEquityCurve(trades);
  const recent = [...trades].reverse().slice(0, 6);

  const pnlPositive = stats.totalPnl >= 0;
  const StreakIcon =
    stats.currentStreak.type === "win"
      ? TrendingUp
      : stats.currentStreak.type === "loss"
        ? TrendingDown
        : Minus;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div className="border-l-2 border-accent pl-4">
          <p className="text-sm text-muted-foreground">Total profit and loss</p>
          <p
            className={`font-mono text-6xl font-semibold tracking-tight ${
              pnlPositive ? "text-profit" : "text-loss"
            }`}
          >
            {pnlPositive ? "+" : "−"}$<CountUp value={Math.abs(stats.totalPnl)} />
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            {stats.totalTrades} trades · {stats.winRate.toFixed(1)}% win rate ·
            <StreakIcon
              className={`h-3.5 w-3.5 ${
                stats.currentStreak.type === "win"
                  ? "text-profit"
                  : stats.currentStreak.type === "loss"
                    ? "text-loss"
                    : ""
              }`}
            />
            {streakLabel(stats.currentStreak)}
          </p>
        </div>
        <Link
          href="/trades/new"
          className="shrink-0 rounded-sm border border-accent px-4 py-2 text-sm text-accent transition-transform hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
        >
          Log a trade
        </Link>
      </div>

      <EquityChart data={equity} />

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm text-muted-foreground">Recent trades</h2>
          <Link href="/trades" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing logged yet — your first entry starts the ledger.
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {recent.map((trade) => (
              <Link
                key={trade.id}
                href={`/trades/${trade.id}`}
                className="flex items-center justify-between py-3 text-sm hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">{trade.traded_on}</span>
                  <DirectionBadge direction={trade.direction} />
                </div>
                <span
                  className={`font-mono ${
                    (trade.pnl ?? 0) >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  {trade.pnl !== null
                    ? `${trade.pnl >= 0 ? "+" : "−"}$${Math.abs(trade.pnl).toFixed(2)}`
                    : "Open"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
