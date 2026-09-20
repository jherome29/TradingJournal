import type { Trade } from "@/lib/types";

export function TradeForm({
  action,
  trade,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  trade?: Trade;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="traded_on" className="text-sm text-neutral-300">
            Date
          </label>
          <input
            id="traded_on"
            name="traded_on"
            type="date"
            required
            defaultValue={trade?.traded_on}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="direction" className="text-sm text-neutral-300">
            Direction
          </label>
          <select
            id="direction"
            name="direction"
            required
            defaultValue={trade?.direction ?? "long"}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="entry_price" className="text-sm text-neutral-300">
            Entry price
          </label>
          <input
            id="entry_price"
            name="entry_price"
            type="number"
            step="0.01"
            required
            defaultValue={trade?.entry_price}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="exit_price" className="text-sm text-neutral-300">
            Exit price
          </label>
          <input
            id="exit_price"
            name="exit_price"
            type="number"
            step="0.01"
            defaultValue={trade?.exit_price ?? undefined}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="size" className="text-sm text-neutral-300">
            Size
          </label>
          <input
            id="size"
            name="size"
            type="number"
            step="0.01"
            required
            defaultValue={trade?.size}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pnl" className="text-sm text-neutral-300">
            PnL
          </label>
          <input
            id="pnl"
            name="pnl"
            type="number"
            step="0.01"
            defaultValue={trade?.pnl ?? undefined}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm text-neutral-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={6}
          defaultValue={trade?.notes ?? undefined}
          placeholder="What was the setup, what went right or wrong, anything worth remembering..."
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="screenshot" className="text-sm text-neutral-300">
          Screenshot {trade?.screenshot_url && "(uploading replaces the current one)"}
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/*"
          className="w-full text-sm text-neutral-300"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
