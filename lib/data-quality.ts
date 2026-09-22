import type { Trade } from "./types";

export interface DataQualityIssue {
  tradeId: string;
  tradedOn: string;
  message: string;
}

function flag(t: Trade, message: string): DataQualityIssue {
  return { tradeId: t.id, tradedOn: t.traded_on, message };
}

/** Surfaces trades whose numbers can't be internally consistent, so bad
    entries (import errors, typos) don't silently distort dashboard stats. */
export function findDataQualityIssues(trades: Trade[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  for (const t of trades) {
    if (t.risk !== null && t.risk < 0) {
      issues.push(
        flag(t, `Negative risk (-$${Math.abs(t.risk).toFixed(2)}) -- risk should never be negative`)
      );
    }

    if (t.risk !== null && t.risk > 0 && t.pnl !== null && t.r_multiple === null) {
      issues.push(flag(t, "Missing r_multiple despite having both pnl and a positive risk"));
    }

    if (t.pnl !== null && t.r_multiple !== null) {
      const pnlSign = Math.sign(t.pnl);
      const rSign = Math.sign(t.r_multiple);
      if (pnlSign !== 0 && rSign !== 0 && pnlSign !== rSign) {
        issues.push(flag(t, "pnl and r_multiple have opposite signs"));
      }
    }
  }

  return issues;
}
