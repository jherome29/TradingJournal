import { describe, expect, it } from "vitest";
import { buildReviewPrompt } from "./review-trade";
import type { ReviewContext } from "./review-trade";

function sampleContext(overrides: Partial<ReviewContext> = {}): ReviewContext {
  return {
    targetNotes: "Revenge traded after getting stopped out.",
    targetPnl: -60,
    targetRMultiple: -1.2,
    extractedSignals: {
      mentionedMistake: true,
      mistakeDescription: "revenge trading after a loss",
      emotionalState: "frustrated",
      confluences: {
        cvdDivergence: false,
        marketStructureShift: false,
        orderBlock: false,
        poi: false,
        vah: false,
        val: false,
        poc: false,
        gapRetest: false,
        timeAndPrice: false,
      },
    },
    avgRisk: 52.84,
    stddevRisk: 26.71,
    avgRMultiple: 0.22,
    postWinWinRate: 41,
    postLossWinRate: 36,
    similarTrades: [
      { tradedOn: "2026-01-06", pnl: -55, notesSnippet: "Clearly a revenge trade after..." },
    ],
    ...overrides,
  };
}

describe("buildReviewPrompt", () => {
  it("includes the target trade's own notes and pnl", () => {
    const prompt = buildReviewPrompt(sampleContext());
    expect(prompt).toContain("Revenge traded after getting stopped out.");
    expect(prompt).toContain("-60");
  });

  it("includes the extracted mistake description when present", () => {
    const prompt = buildReviewPrompt(sampleContext());
    expect(prompt).toContain("revenge trading after a loss");
  });

  it("includes the baseline risk stats for comparison", () => {
    const prompt = buildReviewPrompt(sampleContext());
    expect(prompt).toContain("52.84");
    expect(prompt).toContain("26.71");
  });

  it("includes similar past trades from RAG", () => {
    const prompt = buildReviewPrompt(sampleContext());
    expect(prompt).toContain("Clearly a revenge trade after...");
  });

  it("omits the mistake description line when no mistake was mentioned", () => {
    const prompt = buildReviewPrompt(
      sampleContext({
        extractedSignals: {
          mentionedMistake: false,
          mistakeDescription: null,
          emotionalState: "confident",
          confluences: sampleContext().extractedSignals.confluences,
        },
      })
    );
    expect(prompt).not.toContain("mistakeDescription");
    expect(prompt).toContain("confident");
  });

  it("says no similar trades were found when the list is empty", () => {
    const prompt = buildReviewPrompt(sampleContext({ similarTrades: [] }));
    expect(prompt).toMatch(/no similar/i);
  });
});
