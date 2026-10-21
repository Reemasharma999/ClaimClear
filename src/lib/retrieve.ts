import { BM25 } from "./bm25";
import type { IndexedChunk, RetrievedChunk } from "./types";

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export type RetrievalMode = "hybrid" | "bm25" | "vector";

// Reciprocal Rank Fusion (Cormack et al., 2009).
// BM25 scores (0..∞) and cosine scores (-1..1) live on different scales, so we
// can't just add them. RRF ignores the raw scores and fuses *ranks*:
//     rrf(doc) = Σ over rankers 1 / (K + rank)
// K=60 is the value from the paper; it stops the #1 result from dominating.
const K = 60;
const PER_RETRIEVER = 20;

/**
 * Hybrid retrieval over several queries at once (query decomposition).
 * Each query runs through BM25 and vector search; every ranked list is fused with RRF.
 * Runs entirely in the browser — the user's policy index never sits on our server.
 */
export function hybridSearch(
  chunks: IndexedChunk[],
  queries: { text: string; embedding: number[] }[],
  topK = 10,
  mode: RetrievalMode = "hybrid",
): RetrievedChunk[] {
  const bm25 = new BM25(chunks.map((c) => c.indexText));
  const fused = new Map<number, { rrf: number; bm25Rank: number | null; vectorRank: number | null }>();

  const add = (index: number, rank: number, kind: "bm25" | "vector") => {
    const e = fused.get(index) ?? { rrf: 0, bm25Rank: null, vectorRank: null };
    e.rrf += 1 / (K + rank);
    const key = kind === "bm25" ? "bm25Rank" : "vectorRank";
    e[key] = e[key] === null ? rank : Math.min(e[key]!, rank);
    fused.set(index, e);
  };

  for (const q of queries) {
    if (mode !== "vector") {
      bm25.search(q.text).slice(0, PER_RETRIEVER).forEach((r, i) => add(r.index, i + 1, "bm25"));
    }
    if (mode !== "bm25") {
      chunks
        .map((c, index) => ({ index, score: cosine(q.embedding, c.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, PER_RETRIEVER)
        .forEach((r, i) => add(r.index, i + 1, "vector"));
    }
  }

  return [...fused.entries()]
    .sort((a, b) => b[1].rrf - a[1].rrf)
    .slice(0, topK)
    .map(([index, e]) => {
      const { id, page, section, text, indexText } = chunks[index];
      return { id, page, section, text, indexText, bm25Rank: e.bm25Rank, vectorRank: e.vectorRank, rrfScore: e.rrf };
    });
}
