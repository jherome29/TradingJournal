import Link from "next/link";
import { fetchAllTrades } from "@/lib/fetch-trades";
import { findDataQualityIssues } from "@/lib/data-quality";

export default async function DataQualityPage() {
  const trades = await fetchAllTrades();
  const issues = findDataQualityIssues(trades);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-medium">Data quality</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Trades whose numbers can&rsquo;t be internally consistent -- these silently distort
        dashboard stats until fixed.
      </p>

      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No issues found across {trades.length} trades.
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {issues.map((issue, i) => (
            <div key={`${issue.tradeId}-${i}`} className="flex items-center justify-between py-3">
              <div>
                <span className="font-mono text-sm text-muted-foreground">{issue.tradedOn}</span>
                <p className="text-sm text-loss">{issue.message}</p>
              </div>
              <Link
                href={`/trades/${issue.tradeId}/edit`}
                className="shrink-0 text-sm text-accent hover:underline"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
