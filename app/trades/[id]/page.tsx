import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSignedScreenshotUrls } from "@/lib/screenshot-url";
import { DirectionBadge } from "../../direction-badge";

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

  const { data: screenshots } = await supabase
    .from("trade_screenshots")
    .select("id, storage_path")
    .eq("trade_id", trade.id)
    .order("position", { ascending: true });

  const signedUrls = await getSignedScreenshotUrls(
    supabase,
    (screenshots ?? []).map((s) => s.storage_path)
  );
  const screenshotUrls = (screenshots ?? [])
    .map((s) => signedUrls.get(s.storage_path))
    .filter((url): url is string => Boolean(url));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-mono text-2xl font-medium">{trade.traded_on}</h1>
          <DirectionBadge direction={trade.direction} />
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
        <Stat label="Entry" value={trade.entry_price ?? "—"} />
        <Stat label="Exit" value={trade.exit_price ?? "—"} />
        <Stat label="Size" value={trade.size ?? "—"} />
        <Stat
          label="P/L"
          value={trade.pnl !== null ? `${trade.pnl >= 0 ? "+" : "−"}${Math.abs(trade.pnl)}` : "Open"}
          tone={trade.pnl !== null ? (trade.pnl >= 0 ? "profit" : "loss") : undefined}
        />
        {trade.risk !== null && <Stat label="Risk" value={`$${trade.risk}`} />}
        {trade.r_multiple !== null && <Stat label="R multiple" value={`${trade.r_multiple}R`} />}
        {trade.session && <Stat label="Session" value={trade.session} />}
      </div>

      {trade.notes && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{trade.notes}</p>
        </div>
      )}

      {screenshotUrls.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">
            {screenshotUrls.length > 1 ? "Screenshots" : "Screenshot"}
          </h2>
          <div className="space-y-3">
            {screenshotUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Trade screenshot"
                className="w-full rounded-sm border border-border"
              />
            ))}
          </div>
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
