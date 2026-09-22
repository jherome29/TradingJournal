# AI Engineering Learning Roadmap

This is a personal learning curriculum, not a product roadmap. The goal is
to practice real AI engineering concepts using this journal's actual data
and schema — not to ship the "ideal" trading journal per CLAUDE.md's
product roadmap. Those are two different documents on purpose:
CLAUDE.md's "Planned direction" section governs what ships into the main
app experience; this file governs what gets built and learned along the
way, which may or may not ever be wired into the main app.

## Constraints

- **$0 cost.** No paid API keys. Every LLM, embedding, and vision call
  runs locally via [Ollama](https://ollama.com) — no Anthropic/OpenAI/Voyage
  billing.
- **Isolated from the main app.** Each step lives in its own module (e.g.
  `lib/ai/`) and, until proven useful through real usage, is not wired into
  the core trade-logging flow. Learning and shipping are separate
  questions.
- **Sequential dependency, mostly.** Steps 1→5 each build on the previous
  one's output. n8n and the "parallel" items don't have to wait.

## Prerequisite: local setup

1. Install Ollama.
2. Pull **`llama3.2:3b`** as the default model for every step, including step 5 — Meta built native tool-calling support into it despite the small size, and on this device's CPU-only setup it's noticeably faster and lighter than an 8B model (roughly 2-3GB RAM vs 5-8GB), which matters more here than squeezing out marginal quality. If tool-calling in step 5 turns out unreliable at this size, `qwen2.5:3b` is the fallback to try before stepping up to 8B.
3. Pull an embedding model (`nomic-embed-text`) for step 2.
4. Later, pull a vision model (`llama3.2-vision`) for the multimodal track.
5. Ollama exposes an OpenAI-compatible local endpoint (`http://localhost:11434/v1`) — the standard `openai` npm SDK can point at it with a custom `baseURL`, so no bespoke client code is needed just to talk to it.
6. **Set `num_ctx` explicitly on every request.** Ollama defaults many models to a 2048-4096 token context regardless of the model's real max, silently truncating anything beyond it -- this looks like "the model ignored my instructions" and is a known time-sink if you don't know to check it up front.
7. **Actual hardware (checked 2026-09-22):** Intel Core i5-1335U (10 cores/12 threads), Intel Iris Xe integrated graphics (not CUDA-capable -- Ollama runs CPU-only here), ~20GB RAM. Implication: `llama3.2:3b` is the right default here, not just for early iteration -- an 8B model would work but with slower responses (several seconds to ~30s per call on CPU alone) and heavier RAM use, for a laptop that needs to stay usable for everything else while inference runs. The vision model track (later) will be noticeably slower regardless of text-model choice, potentially a minute-plus per image. RAM itself is not a bottleneck.

## The curriculum

**1. Structured extraction**
Send each trade's `notes` to the local model with a JSON schema (validated with Zod). Extract: mentioned mistakes, emotional state, inferred setup type, rule adherence. No new infra. Teaches: getting reliable structured output from an LLM and catching it when it doesn't comply.
**Use Ollama's native structured-output mode** (`format: json` / JSON-schema-constrained decoding), not plain prompt-and-hope. Small local models are much worse than hosted ones at freeform JSON compliance -- if you don't constrain decoding, failures will be confounded between "my prompt/schema design" and "this model just can't follow instructions," and you won't be able to tell which one you're actually learning from.

**2. Embeddings + RAG (pgvector)**
Enable `pgvector` on the existing Supabase project. Embed `notes` (+ step 1's extracted fields) via the local embedding model. Query via hybrid search: vector similarity `order by ... <=>` combined with normal SQL filters (session, date range, direction). Teaches: vector search, hybrid retrieval. Skip indexing (IVFFlat/HNSW) — not needed at this row count.
**Ship a minimal retrieval eval as part of this step, not step 4.** Hand-pick 5-10 trades you know should retrieve each other, check precision@k. This needs no LLM calls (just vector math) and stops you from building on top of unmeasured retrieval quality for two whole steps.
**Expect blurry retrieval as the first real lesson, not a bug.** A single embedding per 500-word note that rambles across market structure, entry reasoning, and self-directed psychology critique averages several topics into one vector. Don't pre-solve this -- just recognize it as a known RAG limitation when it happens, not a mystery.

**3. Trade Review pipeline (RAG-augmented generation)**
Combine steps 1+2: for a given trade, retrieve similar past trades via RAG, feed them plus the extracted rules and this trade's stats (from the already-tested `lib/trade-stats.ts` functions — avg risk, R vs baseline, post-loss/win bucket) into a synthesis call that critiques the trade. Teaches: multi-step pipeline design instead of single-shot prompting.
*(Not "LLM-as-judge" -- that term specifically means using an LLM to evaluate/score other outputs against a rubric, which belongs in step 4. This step is generation, not judging. Get the term right now so it's not misused later.)*

**4. Evals**
Hand-grade 10-20 trades into a golden set with an actual rubric (e.g. faithfulness to the retrieved trades, actionability, tone) -- not just vague "good/bad." Score future prompt/pipeline changes against it automatically. This is also where **LLM-as-judge** properly belongs, if you want to scale grading beyond what you hand-label: use a second LLM call to score outputs against your rubric. Use temperature 0 for anything being graded, for reproducibility.

**5. Agent / MCP server**
Wrap `lib/trade-stats.ts`'s functions, the RAG search from step 2, and the review pipeline from step 3 as callable tools. An LLM with tool-use becomes the "Weekly Review" conversational agent — grounded in real function calls, not hallucinated math. Exposable as an MCP server so any MCP client (this session included) can query the journal conversationally.
**Tool-calling reliability drops off a cliff on small local models faster than plain generation does.** This is where a wrong model choice most often gets misdiagnosed as "agents are hard." Use the tool-calling-capable model named in the prerequisites section, not just whatever ran fine in steps 1-3.

**6. n8n (self-hosted, free)**
Not a sequential step — an orchestration layer over 1-5. First workflow: Cron → call the agent/review logic → deliver via email/Discord/Slack. Second, later: replay the eval set (step 4) on a schedule and alert on regression (= "eval-gated CI," without needing GitHub Actions for it).
**Networking gotcha:** if n8n runs in Docker and Ollama runs on the host machine, `localhost:11434` from inside the container won't reach it. Use `host.docker.internal` (Windows/Mac) or the equivalent Docker network config on Linux. Known one-hour time-sink if you don't expect it.

**Parallel track, anytime after step 1:**
Multimodal — run a local vision model over `trade_screenshots` images (chart annotation, comparing what the chart shows against what the notes claim). Directly related to the "Chart annotation" item already listed as unbuilt in CLAUDE.md's Trade Detail roadmap.

**Later, only once steps 1-5 generate real traffic:**
Observability/tracing (token/latency/cost per call), model routing (cheap model for extraction, stronger one for synthesis), semantic caching, streaming output to the UI. These are meaningless to build before there's real call volume to observe or optimize.

## Practices to apply at every step

These were missing from the original plan entirely -- add them now, not retroactively:

- **Version prompts like code.** As the extraction/review/agent prompts get iterated on, track which prompt version produced which eval score. Even a plain changelog per prompt file is enough at this scale -- without it, step 4's evals can't answer "did my prompt change actually help."
- **Keep the TDD discipline from `lib/trade-stats.ts` for the plumbing.** The LLM call itself isn't unit-testable, but the Zod schema validation, the SQL hybrid-query construction, and the prompt-templating function that assembles context all are. Test those the same way the rest of this codebase is tested -- mock the LLM boundary, test everything around it.
- **Use temperature 0 wherever determinism matters** (extraction, anything being graded in evals) -- variance makes eval scores noisy and unreproducible.

## Non-goals for now

- Wiring any of this into the main trade form/pages before it's proven useful through actual use.
- Paying for any hosted API.
- Building for scale (indexes, caching, queues) before real usage volume justifies it.

## Next immediate action

Set up Ollama locally, confirm it runs and is reachable, then start Step 1 (structured extraction) as its own module.
