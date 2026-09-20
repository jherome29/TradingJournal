import { describe, expect, it } from "vitest";
import { parseTradeForm } from "./parse-trade-form";

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("parseTradeForm", () => {
  it("parses required fields and numeric conversions", () => {
    const result = parseTradeForm(
      formData({
        traded_on: "2025-01-15",
        direction: "long",
        entry_price: "2650.5",
        exit_price: "2660.25",
        size: "1",
        pnl: "97.5",
        notes: "Clean breakout retest",
      })
    );

    expect(result).toEqual({
      traded_on: "2025-01-15",
      direction: "long",
      entry_price: 2650.5,
      exit_price: 2660.25,
      size: 1,
      pnl: 97.5,
      notes: "Clean breakout retest",
    });
  });

  it("treats empty optional fields as null", () => {
    const result = parseTradeForm(
      formData({
        traded_on: "2025-01-15",
        direction: "short",
        entry_price: "2650.5",
        exit_price: "",
        size: "1",
        pnl: "",
        notes: "",
      })
    );

    expect(result.exit_price).toBeNull();
    expect(result.pnl).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("rejects an invalid direction", () => {
    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "sideways",
          entry_price: "2650.5",
          size: "1",
        })
      )
    ).toThrow("Invalid direction: sideways");
  });
});
