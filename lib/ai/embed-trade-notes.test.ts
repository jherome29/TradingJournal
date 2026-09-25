import { describe, expect, it } from "vitest";
import { toVectorLiteral, EMBEDDING_DIMENSIONS } from "./embed-trade-notes";

describe("toVectorLiteral", () => {
  it("formats an embedding array as a bracketed vector literal string", () => {
    const embedding = Array(EMBEDDING_DIMENSIONS).fill(0.1);
    expect(toVectorLiteral(embedding)).toBe(`[${embedding.join(",")}]`);
  });

  it("throws when the embedding has the wrong number of dimensions", () => {
    const wrongSize = Array(10).fill(0.1);
    expect(() => toVectorLiteral(wrongSize)).toThrow();
  });
});
