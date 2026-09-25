import type { SupabaseClient } from "@supabase/supabase-js";
import { extractTradeNoteSignals, type TradeNoteSignals } from "./extract-trade-notes";
import { searchSimilarTrades } from "./search-trades";
import {
  computeAverageR,
  computeRiskConsistency,
  computePostOutcomeStats,
} from "@/lib/trade-stats";
import type { Trade } from "@/lib/types";

const MODEL = "llama3.2:3b";
const OLLAMA_URL = "http://localhost:11434/api/generate";

export interface SimilarTradeSummary {
  tradedOn: string;
  pnl: number | null;
  notesSnippet: string;
}

export interface ReviewContext {
  targetNotes: string;
  targetPnl: number | null;
  targetRMultiple: number | null;
  extractedSignals: TradeNoteSignals;
  avgRisk: number | null;
  stddevRisk: number | null;
  avgRMultiple: number | null;
  postWinWinRate: number;
  postLossWinRate: number;
  similarTrades: SimilarTradeSummary[];
}

/** Pure prompt construction -- the part that's actually testable without a
    live model or database. */
export function buildReviewPrompt(ctx: ReviewContext): string {
  const lines: string[] = [];

  lines.push("You are reviewing one of a trader's own journal entries. Be direct and specific.");
  lines.push("");
  lines.push(`Trade notes: "${ctx.targetNotes}"`);
  lines.push(`Result: pnl ${ctx.targetPnl}, r_multiple ${ctx.targetRMultiple}`);
  lines.push("");
  lines.push(
    `Extracted signals: mentionedMistake=${ctx.extractedSignals.mentionedMistake}` +
      (ctx.extractedSignals.mistakeDescription
        ? `, mistake="${ctx.extractedSignals.mistakeDescription}"`
        : "") +
      `, emotionalState=${ctx.extractedSignals.emotionalState ?? "none described"}`
  );
  lines.push("");
  lines.push(
    `Trader's baseline: avg risk $${ctx.avgRisk?.toFixed(2) ?? "?"} (±$${ctx.stddevRisk?.toFixed(2) ?? "?"}), avg R ${ctx.avgRMultiple?.toFixed(2) ?? "?"}.`
  );
  lines.push(
    `Historically, win rate is ${ctx.postWinWinRate}% following a win and ${ctx.postLossWinRate}% following a loss.`
  );
  lines.push("");

  if (ctx.similarTrades.length === 0) {
    lines.push("No similar past trades were found.");
  } else {
    lines.push("Similar past trades:");
    for (const t of ctx.similarTrades) {
      lines.push(`- ${t.tradedOn} (pnl ${t.pnl}): "${t.notesSnippet}"`);
    }
  }
  lines.push("");
  lines.push(
    "Write a short, direct review of this trade: what went right or wrong, and whether it fits a pattern from the similar trades or baseline stats above."
  );

  return lines.join("\n");
}

async function callOllamaForReview(prompt: string): Promise<string> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0 },
    }),
  });
  const data = await res.json();
  return data.response;
}

/** Full pipeline: extract signals from this trade's note, pull baseline
    stats from the trader's whole history, retrieve similar past trades via
    RAG, then synthesize a review. Each step's output feeds the next --
    this is the actual "pipeline" step, not a single prompt. */
export async function reviewTrade(supabase: SupabaseClient, tradeId: string): Promise<string> {
  const { data: target, error } = await supabase
    .from("trades")
    .select("notes, pnl, r_multiple, risk, notes_embedding")
    .eq("id", tradeId)
    .single();
  if (error || !target) throw new Error(`Could not load trade ${tradeId}: ${error?.message}`);
  if (!target.notes) throw new Error(`Trade ${tradeId} has no notes to review`);

  const { data: allTradesData } = await supabase.from("trades").select("*");
  const allTrades = (allTradesData ?? []) as Trade[];

  const [extractedSignals, similarRaw] = await Promise.all([
    extractTradeNoteSignals(target.notes),
    target.notes_embedding
      ? searchSimilarTrades(supabase, target.notes_embedding, 6)
      : Promise.resolve([]),
  ]);

  const riskConsistency = computeRiskConsistency(allTrades);
  const avgRMultiple = computeAverageR(allTrades);
  const postOutcome = computePostOutcomeStats(allTrades);

  const similarTrades: SimilarTradeSummary[] = similarRaw
    .filter((t) => t.id !== tradeId)
    .slice(0, 5)
    .map((t) => ({
      tradedOn: t.traded_on,
      pnl: t.pnl,
      notesSnippet: (t.notes ?? "").slice(0, 100),
    }));

  const context: ReviewContext = {
    targetNotes: target.notes,
    targetPnl: target.pnl,
    targetRMultiple: target.r_multiple,
    extractedSignals,
    avgRisk: riskConsistency.avgRisk,
    stddevRisk: riskConsistency.stddevRisk,
    avgRMultiple,
    postWinWinRate: postOutcome.afterWin.winRate,
    postLossWinRate: postOutcome.afterLoss.winRate,
    similarTrades,
  };

  const prompt = buildReviewPrompt(context);
  return callOllamaForReview(prompt);
}
