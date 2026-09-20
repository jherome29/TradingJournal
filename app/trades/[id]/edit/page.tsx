import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTrade, deleteTrade } from "../../actions";
import { TradeForm } from "../../trade-form";

export default async function EditTradePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const { data: trade } = await supabase
    .from("trades")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!trade) notFound();

  const boundUpdate = updateTrade.bind(null, trade.id);
  const boundDelete = deleteTrade.bind(null, trade.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit trade</h1>
        <Link href="/trades" className="text-sm text-neutral-400 hover:text-neutral-200">
          Back to trades
        </Link>
      </div>

      <TradeForm
        action={boundUpdate}
        trade={trade}
        error={searchParams.error}
        submitLabel="Save changes"
      />

      <form action={boundDelete} className="mt-6 border-t border-neutral-800 pt-6">
        <button className="rounded-md border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950">
          Delete trade
        </button>
      </form>
    </main>
  );
}
