import { describe, expect, it } from "vitest";
import { buildExtractionPrompt, parseExtractionResponse } from "./extract-trade-notes";

describe("buildExtractionPrompt", () => {
  it("includes the note text in the prompt", () => {
    const prompt = buildExtractionPrompt("I revenge traded today");
    expect(prompt).toContain("I revenge traded today");
  });
});

describe("parseExtractionResponse", () => {
  const allConfluencesFalse = {
    cvdDivergence: false,
    marketStructureShift: false,
    orderBlock: false,
    poi: false,
    vah: false,
    val: false,
    poc: false,
    gapRetest: false,
    timeAndPrice: false,
  };

  it("parses a valid response where a mistake was mentioned", () => {
    const raw = JSON.stringify({
      mentionedMistake: true,
      mistakeDescription: "revenge trading after a loss",
      emotionalState: "frustrated",
      confluences: allConfluencesFalse,
    });
    expect(parseExtractionResponse(raw)).toEqual({
      mentionedMistake: true,
      mistakeDescription: "revenge trading after a loss",
      emotionalState: "frustrated",
      confluences: allConfluencesFalse,
    });
  });

  it("accepts null mistakeDescription and emotionalState when neither was mentioned", () => {
    const raw = JSON.stringify({
      mentionedMistake: false,
      mistakeDescription: null,
      emotionalState: null,
      confluences: allConfluencesFalse,
    });
    expect(parseExtractionResponse(raw)).toEqual({
      mentionedMistake: false,
      mistakeDescription: null,
      emotionalState: null,
      confluences: allConfluencesFalse,
    });
  });

  it("parses multiple confluences being true at once", () => {
    const raw = JSON.stringify({
      mentionedMistake: false,
      mistakeDescription: null,
      emotionalState: null,
      confluences: { ...allConfluencesFalse, cvdDivergence: true, marketStructureShift: true },
    });
    const result = parseExtractionResponse(raw);
    expect(result.confluences.cvdDivergence).toBe(true);
    expect(result.confluences.marketStructureShift).toBe(true);
    expect(result.confluences.orderBlock).toBe(false);
  });

  it("throws when a required field is missing", () => {
    const raw = JSON.stringify({ mentionedMistake: true });
    expect(() => parseExtractionResponse(raw)).toThrow();
  });

  it("throws when confluences is missing entirely", () => {
    const raw = JSON.stringify({
      mentionedMistake: false,
      mistakeDescription: null,
      emotionalState: null,
    });
    expect(() => parseExtractionResponse(raw)).toThrow();
  });

  it("throws when the response isn't valid JSON at all", () => {
    expect(() => parseExtractionResponse("not json")).toThrow();
  });
});
