"use client";

import { useState } from "react";

const fieldClass =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const numericFieldClass = `${fieldClass} font-mono`;
const labelClass = "text-sm text-muted-foreground";

/** R-multiple is derived from risk and pnl, not entered directly -- see
    lib/parse-trade-form.ts for why. This just previews that computation
    live; the server recomputes it authoritatively on submit. */
function computeRMultiple(riskRaw: string, pnlRaw: string): number | null {
  const risk = Number(riskRaw);
  const pnl = Number(pnlRaw);
  if (!riskRaw || !pnlRaw || !Number.isFinite(risk) || !Number.isFinite(pnl) || risk === 0) {
    return null;
  }
  return Math.round((pnl / risk) * 100) / 100;
}

export function RiskPnlFields({
  defaultRisk,
  defaultPnl,
}: {
  defaultRisk?: number | null;
  defaultPnl?: number | null;
}) {
  const [risk, setRisk] = useState(defaultRisk != null ? String(defaultRisk) : "");
  const [pnl, setPnl] = useState(defaultPnl != null ? String(defaultPnl) : "");
  const rMultiple = computeRMultiple(risk, pnl);

  return (
    <>
      <div className="space-y-1">
        <label htmlFor="risk" className={labelClass}>
          Risk ($)
        </label>
        <input
          id="risk"
          name="risk"
          type="number"
          step="0.01"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className={numericFieldClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="pnl" className={labelClass}>
          Net PnL
        </label>
        <input
          id="pnl"
          name="pnl"
          type="number"
          step="0.01"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          className={numericFieldClass}
        />
      </div>

      <div className="space-y-1">
        <p className={labelClass}>R multiple</p>
        <p className={`${numericFieldClass} border-transparent bg-transparent px-3 py-2`}>
          {rMultiple !== null ? `${rMultiple}R` : "—"}
        </p>
      </div>
    </>
  );
}
