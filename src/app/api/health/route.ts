// Health check for the host (Render) and the uptime monitor that keeps the free instance awake.
// Deliberately cheap: no AI calls, so pinging it every few minutes costs no quota.

export const dynamic = "force-dynamic";

const startedAt = new Date().toISOString();

export function GET() {
  return Response.json({
    ok: true,
    startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    aiConfigured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    fallbackConfigured: Boolean(process.env.GROQ_API_KEY),
  });
}
