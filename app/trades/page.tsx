import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSignedScreenshotUrls } from "@/lib/screenshot-url";
import { parseDateRange, filterTradesByRange } from "@/lib/date-range";
import type { Trade } from "@/lib/types";
import { DeleteTradeButton } from "./delete-trade-button";
import { DirectionBadge } from "../direction-badge";
import { RangeFilter } from "../range-filter";

interface TradeCoverScreenshot {
  storage_path: string;
  position: number;
}

type TradeWithCoverScreenshots = Trade & { trade_screenshots: TradeCoverScreenshot[] | null };

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseDateRange((await searchParams).range);
  const supabase = await createClient();
  const { data: allTrades, error } = await supabase
    .from("trades")
    .select("*, trade_screenshots(storage_path, position)")
    .order("traded_on", { ascending: false });

  const trades = filterTradesByRange(allTrades ?? [], range) as TradeWithCoverScreenshots[];
  const coverPathByTradeId = new Map(
    trades
      .map((t) => {
        const cover = t.trade_screenshots?.find((s) => s.position === 0);
        return cover ? ([t.id, cover.storage_path] as const) : null;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null)
  );
  const signedUrls = await getSignedScreenshotUrls(
    supabase,
    Array.from(coverPathByTradeId.values())
  );

  const closed = trades.filter((t) => t.pnl !== null);
  const bestId = closed.length
    ? closed.reduce((best, t) => ((t.pnl as number) > (best.pnl as number) ? t : best)).id
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Trades</h1>
        <Link
          href="/trades/new"
          className="rounded-sm border border-accent px-4 py-2 text-sm text-accent transition-transform hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
        >
          Log a trade
        </Link>
      </div>

      <div className="mb-8">
        <RangeFilter basePath="/trades" current={range} />
      </div>

      {error && <p className="text-sm text-loss">{error.message}</p>}

      {!error && trades.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {range === "all"
            ? "Nothing logged yet — your first entry starts the ledger."
            : "No trades in this period."}
        </p>
      )}

      <div className="divide-y divide-border border-y border-border">
        {trades.map((trade, i) => {
          const isBest = trade.id === bestId;
          const coverPath = coverPathByTradeId.get(trade.id);
          const coverUrl = coverPath ? signedUrls.get(coverPath) : undefined;
          const borderHoverColor =
            trade.direction === "long"
              ? "hover:border-l-profit"
              : trade.direction === "short"
                ? "hover:border-l-loss"
                : "hover:border-l-muted-foreground";
          const glowColor =
            trade.direction === "long"
              ? "hover:shadow-[inset_0_0_0_1px_var(--profit),0_0_18px_-6px_var(--profit)]"
              : trade.direction === "short"
                ? "hover:shadow-[inset_0_0_0_1px_var(--loss),0_0_18px_-6px_var(--loss)]"
                : "";
          return (
            <div
              key={trade.id}
              className={`animate-cell-in border-l-2 border-transparent py-4 pl-3 -ml-3 transition-all duration-200 ${borderHoverColor} motion-safe:hover:translate-x-0.5`}
              style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
            >
              <div
                className={`group flex items-start justify-between gap-4 rounded-sm transition-shadow duration-200 ${glowColor}`}
              >
                <Link href={`/trades/${trade.id}`} className="min-w-0 flex-1 py-1 pl-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{trade.traded_on}</span>
                      <span className="text-sm">
                        <DirectionBadge direction={trade.direction} />
                      </span>
                      {isBest && (
                        <span className="animate-pulse-glow-profit rounded-sm border border-profit px-1.5 py-0.5 text-xs leading-none text-profit">
                          Best
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono text-sm ${
                        (trade.pnl ?? 0) >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {trade.pnl !== null
                        ? `${trade.pnl >= 0 ? "+" : "−"}$${Math.abs(trade.pnl).toFixed(2)}`
                        : "Open"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-4 font-mono text-xs text-muted-foreground sm:w-72">
                    <span>Entry {trade.entry_price ?? "—"}</span>
                    <span>Exit {trade.exit_price ?? "—"}</span>
                    <span>Size {trade.size ?? "—"}</span>
                  </div>

                  {trade.notes && (
                    <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                      {trade.notes}
                    </p>
                  )}
                  {coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt="Trade screenshot"
                      className="mt-3 max-h-40 rounded-sm border border-border transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                  )}
                </Link>

                <div className="flex shrink-0 gap-3 pr-1 pt-1.5 text-xs">
                  <Link
                    href={`/trades/${trade.id}/edit`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </Link>
                  <DeleteTradeButton tradeId={trade.id} className="text-loss hover:underline" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
