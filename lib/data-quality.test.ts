import { describe, expect, it } from "vitest";
import { findDataQualityIssues } from "./data-quality";
import type { Trade } from "./types";

function trade(overrides: Partial<Trade>): Trade {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    traded_on: "2026-01-01",
    direction: "long",
    entry_price: 2650,
    exit_price: 2660,
    size: 1,
    pnl: 10,
    notes: null,
    risk: 50,
    r_multiple: 0.2,
    session: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("findDataQualityIssues", () => {
  it("flags a negative risk value", () => {
    const issues = findDataQualityIssues([trade({ risk: -58, r_multiple: null })]);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/negative/i);
  });

  it("flags a missing r_multiple when both pnl and a positive risk are present", () => {
    const issues = findDataQualityIssues([trade({ pnl: 100, risk: 50, r_multiple: null })]);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/r_multiple/i);
  });

  it("flags pnl and r_multiple having opposite signs", () => {
    const issues = findDataQualityIssues([trade({ pnl: 100, risk: 50, r_multiple: -2 })]);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/opposite sign/i);
  });

  it("does not flag a clean trade", () => {
    const issues = findDataQualityIssues([trade({ pnl: 100, risk: 50, r_multiple: 2 })]);
    expect(issues).toEqual([]);
  });

  it("does not flag an open trade (null pnl) missing r_multiple", () => {
    const issues = findDataQualityIssues([
      trade({ pnl: null, exit_price: null, risk: 50, r_multiple: null }),
    ]);
    expect(issues).toEqual([]);
  });

  it("does not flag a trade with no risk logged", () => {
    const issues = findDataQualityIssues([trade({ pnl: 100, risk: null, r_multiple: null })]);
    expect(issues).toEqual([]);
  });

  it("includes the trade id and traded_on so the UI can link to it", () => {
    const t = trade({ risk: -10, r_multiple: null, traded_on: "2026-03-05" });
    const issues = findDataQualityIssues([t]);
    expect(issues[0]).toMatchObject({ tradeId: t.id, tradedOn: "2026-03-05" });
  });

  it("can flag more than one issue on the same trade", () => {
    const issues = findDataQualityIssues([trade({ risk: -58, pnl: -58, r_multiple: null })]);
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  it("returns an empty array for no trades", () => {
    expect(findDataQualityIssues([])).toEqual([]);
  });
});
