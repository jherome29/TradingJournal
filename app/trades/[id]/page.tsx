import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSignedScreenshotUrl } from "@/lib/screenshot-url";

export default async function TradeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: trade } = await supabase
    .from("trades")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!trade) notFound();

  const screenshotUrl = trade.screenshot_url
    ? await getSignedScreenshotUrl(supabase, trade.screenshot_url)
    : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-mono text-2xl font-medium">{trade.traded_on}</h1>
          <span
            className={`flex items-center gap-1.5 text-sm ${
              trade.direction === "long" ? "text-profit" : "text-loss"
            }`}
          >
            {trade.direction === "long" ? (
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {trade.direction === "long" ? "Long" : "Short"}
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/trades" className="text-muted-foreground hover:text-foreground">
            Back
          </Link>
          <Link href={`/trades/${trade.id}/edit`} className="text-accent hover:underline">
            Edit
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4 text-sm">
        <Stat label="Entry" value={trade.entry_price} />
        <Stat label="Exit" value={trade.exit_price ?? "—"} />
        <Stat label="Size" value={trade.size} />
        <Stat
          label="P/L"
          value={trade.pnl !== null ? `${trade.pnl >= 0 ? "+" : "−"}${Math.abs(trade.pnl)}` : "Open"}
          tone={trade.pnl !== null ? (trade.pnl >= 0 ? "profit" : "loss") : undefined}
        />
      </div>

      {trade.notes && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{trade.notes}</p>
        </div>
      )}

      {screenshotUrl && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">Screenshot</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="Trade screenshot"
            className="w-full rounded-sm border border-border"
          />
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "profit" | "loss";
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p
        className={`font-mono text-base ${
          tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
