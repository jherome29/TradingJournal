import { z } from "zod";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2:3b";

const ConfluencesSchema = z.object({
  cvdDivergence: z.boolean(),
  marketStructureShift: z.boolean(),
  orderBlock: z.boolean(),
  poi: z.boolean(),
  vah: z.boolean(),
  val: z.boolean(),
  poc: z.boolean(),
  gapRetest: z.boolean(),
  timeAndPrice: z.boolean(),
});

const TradeNoteSignalsSchema = z.object({
  mentionedMistake: z.boolean(),
  mistakeDescription: z.string().nullable(),
  emotionalState: z.string().nullable(),
  confluences: ConfluencesSchema,
});

export type TradeNoteSignals = z.infer<typeof TradeNoteSignalsSchema>;

/** JSON schema handed to Ollama's `format` field to constrain decoding --
    hand-written rather than derived from the Zod schema above, since two
    fields don't yet justify a zod-to-json-schema dependency. */
const CONFLUENCE_KEYS = [
  "cvdDivergence",
  "marketStructureShift",
  "orderBlock",
  "poi",
  "vah",
  "val",
  "poc",
  "gapRetest",
  "timeAndPrice",
] as const;

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    mentionedMistake: { type: "boolean" },
    mistakeDescription: { type: ["string", "null"] },
    emotionalState: { type: ["string", "null"] },
    confluences: {
      type: "object",
      properties: Object.fromEntries(CONFLUENCE_KEYS.map((key) => [key, { type: "boolean" }])),
      required: CONFLUENCE_KEYS,
    },
  },
  required: ["mentionedMistake", "mistakeDescription", "emotionalState", "confluences"],
};

export function buildExtractionPrompt(notes: string): string {
  return `You are analyzing a trader's private journal note about a single trade. Read the note and determine:
1. Whether the trader describes having made a mistake on this trade.
2. What emotional state (if any) the trader describes feeling, in a few words (e.g. "frustrated", "confident", "anxious"). Use null if no emotional state is described.
3. Which of these specific trade confluences are explicitly mentioned in the note (a trade can have several at once, mark each independently true or false):
   - cvdDivergence: CVD (cumulative volume delta) divergence
   - marketStructureShift: market structure shift / MSS
   - orderBlock: order block (OB)
   - poi: point of interest (POI)
   - vah: value area high (VAH)
   - val: value area low (VAL)
   - poc: point of control (POC)
   - gapRetest: a gap being retested
   - timeAndPrice: a specific time-and-price confluence

Only mark a confluence true if the note actually mentions it -- do not assume one is present just because it's common in this trader's style.

Note:
"""
${notes}
"""`;
}

export function parseExtractionResponse(raw: string): TradeNoteSignals {
  return TradeNoteSignalsSchema.parse(JSON.parse(raw));
}

async function callOllama(prompt: string): Promise<string> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    body: JSON.stringify({
      model: MODEL,
      prompt,
      format: RESPONSE_JSON_SCHEMA,
      stream: false,
      options: { temperature: 0 },
    }),
  });
  const data = await res.json();
  return data.response;
}

export async function extractTradeNoteSignals(notes: string): Promise<TradeNoteSignals> {
  const prompt = buildExtractionPrompt(notes);
  const raw = await callOllama(prompt);
  return parseExtractionResponse(raw);
}
