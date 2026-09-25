const OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings";
const EMBEDDING_MODEL = "nomic-embed-text";

/** Must match nomic-embed-text's actual output size -- the trades.notes_embedding
    column is vector(768); a mismatch here fails every insert. */
export const EMBEDDING_DIMENSIONS = 768;

/** Converts a raw embedding array into the string format Postgres/pgvector
    expects for a vector column (a bracketed, comma-separated literal). */
export function toVectorLiteral(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected a ${EMBEDDING_DIMENSIONS}-dimensional embedding, got ${embedding.length}`
    );
  }
  return `[${embedding.join(",")}]`;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(OLLAMA_EMBED_URL, {
    method: "POST",
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  });
  const data = await res.json();
  return data.embedding;
}
