import { describe, expect, it } from "vitest";
import { computePrecisionAtK } from "./retrieval-eval";

describe("computePrecisionAtK", () => {
  it("returns 1 when every retrieved id is relevant", () => {
    const retrieved = ["a", "b", "c"];
    const relevant = new Set(["a", "b", "c", "d"]);
    expect(computePrecisionAtK(retrieved, relevant)).toBe(1);
  });

  it("returns 0 when none of the retrieved ids are relevant", () => {
    const retrieved = ["x", "y", "z"];
    const relevant = new Set(["a", "b"]);
    expect(computePrecisionAtK(retrieved, relevant)).toBe(0);
  });

  it("returns the correct fraction for a partial match", () => {
    const retrieved = ["a", "x", "b", "y"];
    const relevant = new Set(["a", "b", "c"]);
    expect(computePrecisionAtK(retrieved, relevant)).toBe(0.5);
  });

  it("returns 0 for an empty retrieved list", () => {
    expect(computePrecisionAtK([], new Set(["a"]))).toBe(0);
  });
});
