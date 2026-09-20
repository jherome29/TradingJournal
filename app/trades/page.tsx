import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Trade } from "@/lib/types";
import { deleteTrade } from "./actions";
import { signOut } from "../login/actions";

const SCREENSHOT_BUCKET = "trade-screenshots";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, regenerated on every page load

async function withSignedScreenshotUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trades: Trade[]
) {
  const paths = trades
    .map((t) => t.screenshot_url)
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return new Map<string, string>();

  const { data } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  const map = new Map<string, string>();
  data?.forEach((entry) => {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  });
  return map;
}

export default async function TradesPage() {
  const supabase = await createClient();
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .order("traded_on", { ascending: false });

  const signedUrls = await withSignedScreenshotUrls(supabase, trades ?? []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trades</h1>
        <div className="flex gap-2">
          <Link
            href="/trades/new"
            className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
          >
            New trade
          </Link>
          <form action={signOut}>
            <button className="rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error.message}</p>}

      {!error && (trades?.length ?? 0) === 0 && (
        <p className="text-sm text-neutral-400">
          No trades logged yet. Add your first one.
        </p>
      )}

      <ul className="space-y-3">
        {trades?.map((trade) => (
          <li
            key={trade.id}
            className="rounded-md border border-neutral-800 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{trade.traded_on}</span>
                  <span
                    className={
                      trade.direction === "long"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {trade.direction.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-400">
                  Entry {trade.entry_price} · Exit {trade.exit_price ?? "—"} ·
                  Size {trade.size}
                  {trade.pnl !== null && (
                    <>
                      {" · PnL "}
                      <span
                        className={
                          trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {trade.pnl}
                      </span>
                    </>
                  )}
                </p>
                {trade.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                    {trade.notes}
                  </p>
                )}
                {trade.screenshot_url && signedUrls.get(trade.screenshot_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signedUrls.get(trade.screenshot_url)}
                    alt="Trade screenshot"
                    className="mt-2 max-h-48 rounded-md border border-neutral-800"
                  />
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/trades/${trade.id}/edit`}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-900"
                >
                  Edit
                </Link>
                <form action={deleteTrade.bind(null, trade.id)}>
                  <button className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
