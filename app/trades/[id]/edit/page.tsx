import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTrade } from "../../actions";
import { TradeForm } from "../../trade-form";
import { DeleteTradeButton } from "../../delete-trade-button";

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Edit trade</h1>
        <Link href="/trades" className="text-sm text-muted-foreground hover:text-foreground">
          Back to trades
        </Link>
      </div>

      <TradeForm
        action={boundUpdate}
        trade={trade}
        error={searchParams.error}
        submitLabel="Save changes"
        pendingLabel="Saving…"
      />

      <div className="mt-6 border-t border-border pt-6">
        <DeleteTradeButton
          tradeId={trade.id}
          label="Delete trade"
          className="rounded-sm border border-loss/50 px-3 py-2 text-sm text-loss hover:bg-loss/10"
        />
      </div>
    </main>
  );
}
