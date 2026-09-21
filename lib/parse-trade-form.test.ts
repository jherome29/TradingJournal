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
      risk: null,
      r_multiple: null,
      session: null,
      notes: "Clean breakout retest",
    });
  });

  it("parses risk, r_multiple, and session when provided", () => {
    const result = parseTradeForm(
      formData({
        traded_on: "2025-01-15",
        direction: "short",
        entry_price: "2650.5",
        size: "0.5",
        risk: "55",
        r_multiple: "-1.5",
        session: "New York",
      })
    );
    expect(result.risk).toBe(55);
    expect(result.r_multiple).toBe(-1.5);
    expect(result.session).toBe("New York");
  });

  it("allows entry price and size to be omitted", () => {
    const result = parseTradeForm(
      formData({
        traded_on: "2025-01-15",
        direction: "long",
      })
    );
    expect(result.entry_price).toBeNull();
    expect(result.size).toBeNull();
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

  it("rejects a missing date", () => {
    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "",
          direction: "long",
          entry_price: "2650.5",
          size: "1",
        })
      )
    ).toThrow("Date is required.");
  });

  it("rejects a non-numeric entry price", () => {
    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "long",
          entry_price: "not-a-number",
          size: "1",
        })
      )
    ).toThrow("Entry price must be a number.");
  });

  it("rejects a zero or negative entry price", () => {
    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "long",
          entry_price: "0",
          size: "1",
        })
      )
    ).toThrow("Entry price must be greater than zero.");

    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "long",
          entry_price: "-5",
          size: "1",
        })
      )
    ).toThrow("Entry price must be greater than zero.");
  });

  it("rejects a zero or negative size", () => {
    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "long",
          entry_price: "2650.5",
          size: "0",
        })
      )
    ).toThrow("Size must be greater than zero.");
  });

  it("rejects a non-numeric exit price when present", () => {
    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "long",
          entry_price: "2650.5",
          size: "1",
          exit_price: "abc",
        })
      )
    ).toThrow("Exit price must be a number.");
  });

  it("allows a negative pnl but rejects a non-numeric one", () => {
    const result = parseTradeForm(
      formData({
        traded_on: "2025-01-15",
        direction: "long",
        entry_price: "2650.5",
        size: "1",
        pnl: "-42.5",
      })
    );
    expect(result.pnl).toBe(-42.5);

    expect(() =>
      parseTradeForm(
        formData({
          traded_on: "2025-01-15",
          direction: "long",
          entry_price: "2650.5",
          size: "1",
          pnl: "not-a-number",
        })
      )
    ).toThrow("PnL must be a number.");
  });
});
