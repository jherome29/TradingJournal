import type { Trade } from "@/lib/types";
import { TradeDateField } from "./date-field";
import { DirectionSelect } from "./direction-select";
import { SubmitButton } from "./submit-button";

const fieldClass =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const numericFieldClass = `${fieldClass} font-mono`;
const labelClass = "text-sm text-muted-foreground";

export function TradeForm({
  action,
  trade,
  error,
  submitLabel,
  pendingLabel,
}: {
  action: (formData: FormData) => void;
  trade?: Trade;
  error?: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="traded_on" className={labelClass}>
            Date
          </label>
          <TradeDateField name="traded_on" defaultValue={trade?.traded_on} />
        </div>

        <div className="space-y-1">
          <label htmlFor="direction" className={labelClass}>
            Direction
          </label>
          <DirectionSelect name="direction" defaultValue={trade?.direction} />
        </div>

        <div className="space-y-1">
          <label htmlFor="entry_price" className={labelClass}>
            Entry price
          </label>
          <input
            id="entry_price"
            name="entry_price"
            type="number"
            step="0.01"
            required
            defaultValue={trade?.entry_price}
            className={numericFieldClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="exit_price" className={labelClass}>
            Exit price
          </label>
          <input
            id="exit_price"
            name="exit_price"
            type="number"
            step="0.01"
            defaultValue={trade?.exit_price ?? undefined}
            className={numericFieldClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="size" className={labelClass}>
            Size
          </label>
          <input
            id="size"
            name="size"
            type="number"
            step="0.01"
            required
            defaultValue={trade?.size}
            className={numericFieldClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pnl" className={labelClass}>
            PnL
          </label>
          <input
            id="pnl"
            name="pnl"
            type="number"
            step="0.01"
            defaultValue={trade?.pnl ?? undefined}
            className={numericFieldClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={6}
          defaultValue={trade?.notes ?? undefined}
          placeholder="What was the setup, what went right or wrong, anything worth remembering..."
          className={fieldClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="screenshot" className={labelClass}>
          Screenshot {trade?.screenshot_url && "(uploading replaces the current one)"}
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/*"
          className="w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-border file:bg-surface-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground file:transition-colors hover:file:bg-surface hover:file:border-accent"
        />
      </div>

      {error && <p className="text-sm text-loss">{error}</p>}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
