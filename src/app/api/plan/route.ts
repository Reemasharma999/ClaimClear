import { z } from "zod";
import { errorResponse, logEvent, newRequestId, rateLimited, tooMany } from "@/lib/guard";
import { redactPII } from "@/lib/guardrails";
import { planClaim } from "@/lib/pipeline";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rid = newRequestId();
  const t0 = Date.now();
  try {
    if (rateLimited(req, "plan")) return tooMany("plan", rid);
    const { scenario } = z.object({ scenario: z.string().trim().min(10).max(2000) }).parse(await req.json());
    const plan = await planClaim(redactPII(scenario).text);
    logEvent({
      event: "request", route: "plan", rid, status: "ok", ms: Date.now() - t0, model: plan.modelName,
      triage: plan.triage.status, urgency: plan.triage.urgency, language: plan.triage.language, queries: plan.queries.length, droppedFacts: plan.droppedFacts.length,
    });
    return Response.json({ ...plan, ref: rid });
  } catch (err) {
    return errorResponse(err, "plan", rid, t0);
  }
}
