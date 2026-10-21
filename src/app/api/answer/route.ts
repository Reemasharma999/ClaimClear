import { z } from "zod";
import { errorResponse, logEvent, newRequestId, rateLimited, tooMany } from "@/lib/guard";
import { redactPII } from "@/lib/guardrails";
import { answerClaim, FactsSchema } from "@/lib/pipeline";

export const maxDuration = 60;

const Body = z.object({
  scenario: z.string().trim().min(10).max(2000),
  facts: FactsSchema,
  language: z.string().max(40).optional(),
  chunks: z
    .array(z.object({ id: z.string().max(40), page: z.number(), section: z.string().max(200), text: z.string().max(3000), indexText: z.string().max(3500) }))
    .min(1)
    .max(16),
});

export async function POST(req: Request) {
  const rid = newRequestId();
  const t0 = Date.now();
  try {
    if (rateLimited(req, "answer")) return tooMany("answer", rid);
    const { scenario, facts, chunks, language } = Body.parse(await req.json());
    const res = await answerClaim(redactPII(scenario).text, facts, chunks, language?.replace(/[^\p{L} -]/gu, "") || "English");
    const verified = res.grounding.filter((g) => g.status === "verified").length;
    logEvent({
      event: "request", route: "answer", rid, status: "ok", ms: Date.now() - t0, model: res.modelName,
      verdict: res.answer.verdict, confidence: res.answer.confidence, quotes: res.grounding.length, verified, guardNotes: res.guardNotes.length,
    });
    return Response.json({ ...res, ref: rid });
  } catch (err) {
    return errorResponse(err, "answer", rid, t0);
  }
}
