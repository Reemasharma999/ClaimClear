import { z } from "zod";
import { chunkPages } from "@/lib/chunk";
import { errorResponse, logEvent, newRequestId, rateLimited, tooMany } from "@/lib/guard";
import { flagInjection, looksLikeHealthPolicy, redactPII } from "@/lib/guardrails";
import { embed } from "@/lib/models";
import { SAMPLE_PAGES, SAMPLE_TITLE } from "@/lib/sample-policy";
import type { PolicyIndex } from "@/lib/types";

export const maxDuration = 60;

const Body = z.union([
  z.object({ sample: z.literal(true) }),
  z.object({
    title: z.string().max(200),
    pages: z.array(z.object({ page: z.number().int().positive(), text: z.string().max(20000) })).min(1).max(120),
  }),
]);

const MAX_CHUNKS = 400;

// The sample policy's index is identical for every visitor, so build it once per instance.
let sampleIndex: Promise<PolicyIndex> | null = null;

class UserFacingError extends Error {}

async function buildIndex(title: string, pages: { page: number; text: string }[]): Promise<PolicyIndex> {
  // Defense in depth: the browser already redacts, but never trust the client.
  const clean = pages.map((p) => ({ ...p, text: redactPII(p.text).text }));
  const all = clean.map((p) => p.text).join("\n");
  if (looksLikeHealthPolicy(all).verdict === "no") {
    throw new UserFacingError("This doesn't look like a health insurance policy, so we didn't index it. Please upload the policy wording PDF from your insurer.");
  }
  const chunks = chunkPages(clean, title.slice(0, 200));
  if (!chunks.length) throw new UserFacingError("No readable text found. Is this a scanned PDF? Scanned policies need OCR first.");
  const kept = chunks.slice(0, MAX_CHUNKS);
  const embeddings = await embed(kept.map((c) => c.indexText), "document");
  return {
    title,
    pages: pages.length,
    chunks: kept.map((c, i) => ({ ...c, embedding: embeddings[i] })),
    warnings: [
      ...(chunks.length > MAX_CHUNKS ? [`Only the first ${MAX_CHUNKS} of ${chunks.length} clauses were indexed.`] : []),
      ...(kept.some((c) => flagInjection(c.text))
        ? ["Some text in this PDF looks like instructions aimed at an AI. ClaimClear treats it as plain text and won't follow it, but double-check those clauses."]
        : []),
    ],
  };
}

export async function POST(req: Request) {
  const rid = newRequestId();
  const t0 = Date.now();
  try {
    const body = Body.parse(await req.json());
    if ("sample" in body) {
      sampleIndex ??= buildIndex(SAMPLE_TITLE, SAMPLE_PAGES).catch((e) => {
        sampleIndex = null;
        throw e;
      });
      const idx = await sampleIndex;
      logEvent({ event: "request", route: "index", rid, status: "ok", sample: true, chunks: idx.chunks.length, ms: Date.now() - t0 });
      return Response.json(idx);
    }
    if (rateLimited(req, "index")) return tooMany("index", rid);
    const idx = await buildIndex(body.title, body.pages);
    logEvent({ event: "request", route: "index", rid, status: "ok", pages: idx.pages, chunks: idx.chunks.length, warnings: idx.warnings?.length ?? 0, ms: Date.now() - t0 });
    return Response.json(idx);
  } catch (err) {
    if (err instanceof UserFacingError) {
      logEvent({ event: "request", route: "index", rid, status: "rejected", reason: err.message.slice(0, 60), ms: Date.now() - t0 });
      return Response.json({ error: err.message, code: "rejected_document", ref: rid }, { status: 422 });
    }
    return errorResponse(err, "index", rid, t0);
  }
}
