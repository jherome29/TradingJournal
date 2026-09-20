import Link from "next/link";
import { createTrade } from "../actions";
import { TradeForm } from "../trade-form";

export default function NewTradePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">New trade</h1>
        <Link href="/trades" className="text-sm text-neutral-400 hover:text-neutral-200">
          Back to trades
        </Link>
      </div>

      <TradeForm action={createTrade} error={searchParams.error} submitLabel="Log trade" />
    </main>
  );
}
