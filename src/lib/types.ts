// Shared types for the ClaimClear RAG pipeline.

export type Page = { page: number; text: string };

/** One retrievable unit of the policy. */
export type Chunk = {
  id: string; // e.g. "p4-c2"
  page: number;
  section: string; // nearest heading, e.g. "4.2 Specific Waiting Period"
  text: string; // raw clause text shown to the user and quoted by the model
  /** Contextual chunk header + text. This is what gets embedded and BM25-indexed. */
  indexText: string;
};

export type IndexedChunk = Chunk & { embedding: number[] };

export type PolicyIndex = {
  title: string;
  pages: number;
  chunks: IndexedChunk[];
  warnings?: string[]; // shown on the policy card: truncation, suspected injected instructions
};

/** Why a chunk was retrieved: its rank in each retriever and the fused score. */
export type RetrievedChunk = Chunk & {
  bm25Rank: number | null;
  vectorRank: number | null;
  rrfScore: number;
};
