import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { embedMany, type LanguageModel } from "ai";

// Model choice is configuration, not code. Everything below runs on free tiers:
// Gemini (GOOGLE_GENERATIVE_AI_API_KEY) as primary, Groq (GROQ_API_KEY) as an
// optional fallback when Gemini rate-limits. Swapping to Claude later is one line:
// `anthropic("claude-sonnet-5-5")` from @ai-sdk/anthropic.

// Providers retire models (gemini-2.5-flash was closed to new accounts in 2026), so we
// try a chain of Gemini models before falling back to Groq. GEN_MODEL overrides the first.
// Chosen by benchmark (Oct 2026, same structured-output task): gemini-3.5-flash ~2.0s,
// 3.5-flash-lite ~1.5s, 3.8-flash >45s even at thinkingLevel "low" (and it rejects "minimal").
// Newest isn't best: for a user waiting at a hospital desk, latency is part of quality.
const GEMINI_CHAIN = [...new Set([process.env.GEN_MODEL ?? "gemini-3.5-flash", "gemini-3.5-flash-lite"])];
const FALLBACK_MODEL = process.env.FALLBACK_MODEL ?? "openai/gpt-oss-120b";
const EMBED_MODEL = process.env.EMBED_MODEL ?? "gemini-embedding-001";
export const EMBED_DIMS = 768; // Matryoshka embedding: truncated from 3072 → 768 with little quality loss, 4x smaller index

function models(): { name: string; model: LanguageModel }[] {
  const list: { name: string; model: LanguageModel }[] = [];
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) list.push(...GEMINI_CHAIN.map((name) => ({ name, model: google(name) })));
  if (process.env.GROQ_API_KEY) list.push({ name: FALLBACK_MODEL, model: groq(FALLBACK_MODEL) });
  if (!list.length) throw new Error("No LLM key configured. Set GOOGLE_GENERATIVE_AI_API_KEY (and optionally GROQ_API_KEY).");
  return list;
}

/**
 * Newer Gemini models "think" before answering by default, which took ~87s for a simple
 * fact extraction on gemini-3.8-flash. We set the thinking effort per task: minimal for
 * extraction, low for clause analysis. Every model in GEMINI_CHAIN must accept both levels;
 * check this if you override GEN_MODEL. (Groq ignores this option.)
 */
export const thinking = (level: "minimal" | "low" | "medium") => ({ google: { thinkingConfig: { thinkingLevel: level } } });

/**
 * Try each configured model in order; a 429, outage, retired model or hang on one falls
 * through to the next. Each attempt gets its own timeout, and the whole chain shares a
 * deadline that keeps us inside the 60s serverless limit with time left to respond.
 */
export async function withFallback<T>(
  fn: (model: LanguageModel, abortSignal: AbortSignal) => Promise<T>,
  { attemptMs = 30_000, deadlineMs = 52_000 }: { attemptMs?: number; deadlineMs?: number } = {},
): Promise<{ result: T; modelName: string; attempts: number }> {
  const start = Date.now();
  let lastErr: unknown = new Error("timeout: no model attempt fit inside the deadline");
  let attempts = 0;
  for (const { name, model } of models()) {
    const remaining = deadlineMs - (Date.now() - start);
    if (remaining < 5_000) break;
    attempts++;
    try {
      return { result: await fn(model, AbortSignal.timeout(Math.min(attemptMs, remaining))), modelName: name, attempts };
    } catch (err) {
      lastErr = err;
      console.warn(JSON.stringify({ event: "model_fallback", model: name, ms: Date.now() - start, error: String((err as Error)?.message).slice(0, 200) }));
    }
  }
  throw lastErr;
}

/**
 * Gemini embeddings are *asymmetric*: documents and queries are embedded with
 * different task types so a short question lands near the long passage that answers it.
 */
export async function embed(values: string[], kind: "document" | "query") {
  const { embeddings } = await embedMany({
    model: google.embedding(EMBED_MODEL),
    values,
    maxParallelCalls: 2,
    providerOptions: {
      google: {
        taskType: kind === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY",
        outputDimensionality: EMBED_DIMS,
      },
    },
  });
  // Round to 5 decimals: halves the JSON size sent to the browser, no measurable effect on ranking.
  return embeddings.map((e) => e.map((x) => Math.round(x * 1e5) / 1e5));
}
