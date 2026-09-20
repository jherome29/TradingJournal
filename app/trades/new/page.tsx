import Link from "next/link";
import { createTrade } from "../actions";
import { TradeForm } from "../trade-form";

export default function NewTradePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-medium">New trade</h1>
        <Link href="/trades" className="text-sm text-muted-foreground hover:text-foreground">
          Back to trades
        </Link>
      </div>

      <TradeForm
        action={createTrade}
        error={searchParams.error}
        submitLabel="Log trade"
        pendingLabel="Logging…"
      />
    </main>
  );
}
