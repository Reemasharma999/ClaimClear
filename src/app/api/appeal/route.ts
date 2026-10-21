import { z } from "zod";
import { errorResponse, logEvent, newRequestId, rateLimited, tooMany } from "@/lib/guard";
import { redactPII } from "@/lib/guardrails";
import { draftAppeal, type Answer } from "@/lib/pipeline";

export const maxDuration = 60;

// Only the fields the letter uses, with size limits. Anything else is rejected.
const Body = z.object({
  scenario: z.string().trim().min(1).max(2000),
  rejectionReason: z.string().max(1000),
  answer: z.object({
    findings: z
      .array(z.object({ point: z.string().max(1000), citations: z.array(z.object({ chunkId: z.string().max(40), quote: z.string().max(1000) })).max(5) }))
      .min(1)
      .max(12),
  }),
});

export async function POST(req: Request) {
  const rid = newRequestId();
  const t0 = Date.now();
  try {
    if (rateLimited(req, "appeal")) return tooMany("appeal", rid);
    const body = Body.parse(await req.json());
    const res = await draftAppeal(redactPII(body.scenario).text, body.answer as Answer, redactPII(body.rejectionReason).text);
    logEvent({ event: "request", route: "appeal", rid, status: "ok", ms: Date.now() - t0, model: res.modelName });
    return Response.json({ ...res, ref: rid });
  } catch (err) {
    return errorResponse(err, "appeal", rid, t0);
  }
}
