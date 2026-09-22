import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchAllTrades } from "@/lib/fetch-trades";
import {
  computeOverallStats,
  computeDirectionBreakdown,
  computeExpectancy,
  computeMaxDrawdown,
  computeDayOfWeekBreakdown,
  computePnlDistribution,
  computeSessionBreakdown,
} from "@/lib/trade-stats";
import { CountUp } from "../count-up";

function money(n: number) {
  return `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
}

/** Glow scales with how extreme the bar is — a near-max bar gets real presence,
    a small one stays quiet. Mirrors the calendar's intensity-driven glow. */
function barGlow(positive: boolean, intensity: number) {
  if (intensity < 0.25) return undefined;
  const color = positive ? "91, 155, 118" : "192, 106, 79";
  return `0 0 ${6 + intensity * 14}px -2px rgba(${color}, ${0.35 + intensity * 0.5})`;
}

export default async function AnalyticsPage() {
  const trades = await fetchAllTrades();
  const stats = computeOverallStats(trades);
  const directions = computeDirectionBreakdown(trades);
  const maxAbsDirectionPnl = Math.max(1, ...directions.map((d) => Math.abs(d.pnl)));
  const strongProfitFactor = stats.profitFactor !== null && stats.profitFactor >= 2;

  const expectancy = computeExpectancy(trades);
  const drawdown = computeMaxDrawdown(trades);
  const dayOfWeek = computeDayOfWeekBreakdown(trades);
  const maxAbsDayPnl = Math.max(1, ...dayOfWeek.map((d) => Math.abs(d.pnl)));
  const sessions = computeSessionBreakdown(trades);
  const maxAbsSessionPnl = Math.max(1, ...sessions.map((s) => Math.abs(s.pnl)));
  const distribution = computePnlDistribution(trades);
  const maxBucketCount = Math.max(1, ...distribution.map((b) => b.count));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-medium">Analytics</h1>

      {stats.totalTrades === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing to analyze yet — this fills in once you have closed trades.
        </p>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Expectancy / trade" tone={expectancy >= 0 ? "profit" : "loss"} delay={0}>
              {expectancy >= 0 ? "+" : "−"}$<CountUp value={Math.abs(expectancy)} delay={0} />
            </Stat>
            <Stat label="Max drawdown" tone="loss" delay={80}>
              −$<CountUp value={drawdown.amount} delay={80} />
            </Stat>
            <Stat label="Average win" tone="profit" delay={160}>
              +$<CountUp value={stats.avgWin} delay={160} />
            </Stat>
            <Stat label="Average loss" tone="loss" delay={240}>
              −$<CountUp value={stats.avgLoss} delay={240} />
            </Stat>
            <Stat label="Profit factor" glow={strongProfitFactor ? "profit" : undefined} delay={320}>
              {stats.profitFactor !== null ? <CountUp value={stats.profitFactor} delay={320} /> : "∞"}
            </Stat>
            {stats.bestTrade && (
              <Stat label="Best trade" tone="profit" glow="profit" delay={400}>
                +$<CountUp value={stats.bestTrade.pnl ?? 0} delay={400} />
              </Stat>
            )}
            {stats.worstTrade && (
              <Stat label="Worst trade" tone="loss" glow="loss" delay={480}>
                −$<CountUp value={Math.abs(stats.worstTrade.pnl ?? 0)} delay={480} />
              </Stat>
            )}
          </div>

          {drawdown.peakDate && drawdown.troughDate && drawdown.amount > 0 && (
            <p className="-mt-4 text-xs text-muted-foreground">
              Drawdown ran from {drawdown.peakDate} to {drawdown.troughDate}
            </p>
          )}

          <div>
            <h2 className="mb-4 text-sm text-muted-foreground">Long vs. short</h2>
            <div className="space-y-5">
              {directions.map((d, i) => {
                const widthPct = (Math.abs(d.pnl) / maxAbsDirectionPnl) * 50;
                const positive = d.pnl >= 0;
                return (
                  <div key={d.direction}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        {d.direction === "long" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-profit" strokeWidth={2} />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-loss" strokeWidth={2} />
                        )}
                        {d.direction === "long" ? "Long" : "Short"}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {d.count} trades · {d.winRate.toFixed(0)}% win rate
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-surface">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                      <div
                        className={`animate-grow-x absolute inset-y-0 rounded-sm ${
                          positive ? "left-1/2 origin-left bar-fill-profit-h" : "right-1/2 origin-right bar-fill-loss-h"
                        }`}
                        style={{
                          width: `${widthPct}%`,
                          animationDelay: `${i * 100}ms`,
                          boxShadow: barGlow(positive, widthPct / 50),
                        }}
                      />
                    </div>
                    <p
                      className={`mt-1 text-right font-mono text-sm ${
                        positive ? "text-profit" : "text-loss"
                      }`}
                    >
                      {money(d.pnl)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm text-muted-foreground">By day of week</h2>
            <div className="flex h-32 items-end gap-3">
              {dayOfWeek.map((d, i) => {
                const hasTrades = d.count > 0;
                const positive = d.pnl >= 0;
                const intensity = hasTrades ? Math.abs(d.pnl) / maxAbsDayPnl : 0;
                const heightPct = hasTrades ? Math.max(intensity * 100, 6) : 0;
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full flex-col items-center justify-end">
                      {hasTrades && (
                        <span
                          className={`mb-1 animate-cell-in font-mono text-[10px] ${
                            positive ? "text-profit" : "text-loss"
                          }`}
                          style={{ animationDelay: `${i * 60 + 200}ms` }}
                        >
                          {positive ? "+" : "−"}
                          {Math.round(Math.abs(d.pnl))}
                        </span>
                      )}
                      <div className="flex h-24 w-full items-end">
                        <div
                          className={`w-full origin-bottom rounded-t-sm ${
                            hasTrades
                              ? `animate-grow-y ${positive ? "bar-fill-profit" : "bar-fill-loss"}`
                              : "border-t border-dashed border-border"
                          }`}
                          style={{
                            height: hasTrades ? `${heightPct}%` : "2px",
                            animationDelay: `${i * 60}ms`,
                            boxShadow: hasTrades ? barGlow(positive, intensity) : undefined,
                          }}
                          title={
                            hasTrades
                              ? `${d.day}: ${money(d.pnl)} · ${d.count} trades · ${d.winRate.toFixed(0)}% win rate`
                              : `${d.day}: no trades`
                          }
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {sessions.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm text-muted-foreground">By session</h2>
              <div className="space-y-5">
                {sessions.map((s, i) => {
                  const widthPct = (Math.abs(s.pnl) / maxAbsSessionPnl) * 50;
                  const positive = s.pnl >= 0;
                  return (
                    <div key={s.session}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span>{s.session}</span>
                        <span className="font-mono text-muted-foreground">
                          {s.count} trades · {s.winRate.toFixed(0)}% win rate
                        </span>
                      </div>
                      <div className="relative h-2.5 bg-surface">
                        <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                        <div
                          className={`animate-grow-x absolute inset-y-0 rounded-sm ${
                            positive
                              ? "left-1/2 origin-left bar-fill-profit-h"
                              : "right-1/2 origin-right bar-fill-loss-h"
                          }`}
                          style={{
                            width: `${widthPct}%`,
                            animationDelay: `${i * 100}ms`,
                            boxShadow: barGlow(positive, widthPct / 50),
                          }}
                        />
                      </div>
                      <p
                        className={`mt-1 text-right font-mono text-sm ${
                          positive ? "text-profit" : "text-loss"
                        }`}
                      >
                        {money(s.pnl)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {distribution.length > 1 && (
            <div>
              <h2 className="mb-4 text-sm text-muted-foreground">P/L distribution</h2>
              <div className="flex h-24 items-end gap-1.5">
                {distribution.map((b, i) => {
                  const positive = b.rangeStart + b.rangeEnd >= 0;
                  const intensity = b.count / maxBucketCount;
                  const heightPct = intensity * 100;
                  return (
                    <div
                      key={i}
                      className={`animate-grow-y flex-1 origin-bottom rounded-t-sm ${
                        positive ? "bar-fill-profit" : "bar-fill-loss"
                      }`}
                      style={{
                        height: b.count > 0 ? `${Math.max(heightPct, 6)}%` : "2px",
                        animationDelay: `${i * 40}ms`,
                        boxShadow: b.count > 0 ? barGlow(positive, intensity) : undefined,
                      }}
                      title={`$${b.rangeStart.toFixed(0)} to $${b.rangeEnd.toFixed(0)}: ${b.count} trade${b.count === 1 ? "" : "s"}`}
                    />
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>${distribution[0].rangeStart.toFixed(0)}</span>
                <span>${distribution[distribution.length - 1].rangeEnd.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  children,
  tone,
  glow,
  delay = 0,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "profit" | "loss";
  glow?: "profit" | "loss";
  delay?: number;
}) {
  return (
    <div
      className={`animate-cell-in rounded-sm border bg-surface px-3 py-2 ${
        glow === "profit"
          ? "border-profit/40 shadow-[0_0_16px_-4px_theme(colors.profit)]"
          : glow === "loss"
            ? "border-loss/40 shadow-[0_0_16px_-4px_theme(colors.loss)]"
            : "border-border"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-mono text-base ${
          tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-foreground"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
