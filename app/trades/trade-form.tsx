import type { Trade } from "@/lib/types";
import { TradeDateField } from "./date-field";
import { DirectionSelect } from "./direction-select";
import { SessionSelect } from "./session-select";
import { SubmitButton } from "./submit-button";
import { RiskPnlFields } from "./risk-pnl-fields";
import { DeleteScreenshotButton } from "./delete-screenshot-button";

const fieldClass =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const numericFieldClass = `${fieldClass} font-mono`;
const labelClass = "text-sm text-muted-foreground";

export function TradeForm({
  action,
  trade,
  existingScreenshots,
  error,
  submitLabel,
  pendingLabel,
}: {
  action: (formData: FormData) => void;
  trade?: Trade;
  existingScreenshots?: { id: string; url: string }[];
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
          <DirectionSelect name="direction" defaultValue={trade?.direction ?? undefined} />
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
            defaultValue={trade?.entry_price ?? undefined}
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
            defaultValue={trade?.size ?? undefined}
            className={numericFieldClass}
          />
        </div>

        <RiskPnlFields defaultRisk={trade?.risk} defaultPnl={trade?.pnl} />

        <div className="space-y-1">
          <label htmlFor="session" className={labelClass}>
            Session
          </label>
          <SessionSelect name="session" defaultValue={trade?.session} />
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

      {trade && existingScreenshots && existingScreenshots.length > 0 && (
        <div className="space-y-2">
          <p className={labelClass}>Screenshots</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingScreenshots.map((shot) => (
              <div key={shot.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.url}
                  alt="Trade screenshot"
                  className="aspect-video w-full rounded-sm border border-border object-cover"
                />
                <DeleteScreenshotButton
                  tradeId={trade.id}
                  screenshotId={shot.id}
                  className="absolute right-1 top-1 rounded-sm bg-background/80 px-1.5 py-0.5 text-xs text-loss opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="screenshots" className={labelClass}>
          {existingScreenshots && existingScreenshots.length > 0
            ? "Add more screenshots"
            : "Screenshots"}
        </label>
        <input
          id="screenshots"
          name="screenshots"
          type="file"
          accept="image/*"
          multiple
          className="w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-border file:bg-surface-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground file:transition-colors hover:file:bg-surface hover:file:border-accent"
        />
      </div>

      {error && <p className="text-sm text-loss">{error}</p>}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
