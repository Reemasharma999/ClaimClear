// Guardrails: the deterministic checks around the model.
//
// Production LLM systems fail at the edges: junk input, hostile input, wrong documents,
// out-of-range numbers, confident answers with no evidence, hung providers. Each check
// here is plain code (not another LLM call) so it is fast, free, testable, and can't be
// talked out of its job. Mapped to the OWASP Top 10 for LLM Applications (2025):
//   LLM01 Prompt injection          → flagInjection, prompt fencing in pipeline.ts
//   LLM02 Sensitive info disclosure → redactPII (runs in the browser, before anything is sent)
//   LLM05 Improper output handling  → sanitizeFacts, sanitizeCostRules, enforceGrounding
//   LLM10 Unbounded consumption     → fail-fast triage, rate limits, timeouts (guard.ts, models.ts)
//
// This file has no server-only imports, so the browser can use it too.

// ─── Input: personal data ────────────────────────────────────────────────────

const PII: { label: string; re: RegExp }[] = [
  { label: "Aadhaar number", re: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { label: "PAN", re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { label: "phone number", re: /(?:\+91[\s-]?|\b0)?\b[6-9]\d{4}[\s-]?\d{5}\b/g },
  { label: "email address", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
];

/** Replace ID numbers, phones and emails with placeholders. Claims never depend on them. */
export function redactPII(text: string) {
  const found: string[] = [];
  let out = text;
  for (const { label, re } of PII) {
    out = out.replace(re, () => {
      found.push(label);
      return `[${label} removed]`;
    });
  }
  return { text: out, redactions: found };
}

// ─── Input: crisis language (backup to the model's own triage) ───────────────

const SELF_HARM = /\b(suicid\w*|kill (my|him|her)self|end (my|his|her) life|self[- ]?harm|overdos\w*|khudkushi|aatmahatya)\b/i;
export const mentionsSelfHarm = (text: string) => SELF_HARM.test(text);

// ─── Document checks ─────────────────────────────────────────────────────────

const HEALTH_POLICY_TERMS = [
  /hospitali[sz]ation/i, /sum insured/i, /waiting period/i, /exclusion/i, /pre-?existing/i,
  /co-?pay/i, /room rent/i, /in-?patient/i, /day care/i, /cashless/i, /network hospital/i, /policy (period|wording|schedule)/i,
];

/** Fail fast on the wrong document (a resume, a car policy) before spending embedding calls on it. */
export function looksLikeHealthPolicy(text: string) {
  const hits = HEALTH_POLICY_TERMS.filter((re) => re.test(text)).length;
  return { hits, verdict: hits >= 5 ? "yes" : hits >= 2 ? "maybe" : "no" } as const;
}

// Indirect prompt injection: instructions aimed at an AI, hidden in a document.
const INJECTION = /(ignore (all |any )?(previous|prior|above) (instructions|rules)|disregard (the|all) (rules|instructions)|you are (now )?(an? )?(ai|assistant|chatbot|language model)|system prompt|always (answer|say|respond)\b.{0,40}\bcovered)/i;
export const flagInjection = (text: string) => INJECTION.test(text);

// ─── Output: facts the model extracted ───────────────────────────────────────

type FactsLike = {
  monthsSincePolicyStart: number | null;
  ageAtPolicyEntry: number | null;
  billAmount: number | null;
  roomRentPerDay: number | null;
  hospitalisationHours: number | null;
};

const inRange = (v: number | null, min: number, max: number) => (v === null || !Number.isFinite(v) || v < min || v > max ? null : v);

/** Null out impossible values instead of letting them drive a verdict (e.g. a 900-year-old policy). */
export function sanitizeFacts<T extends FactsLike>(f: T): { facts: T; dropped: string[] } {
  const clean = {
    ...f,
    monthsSincePolicyStart: inRange(f.monthsSincePolicyStart, 0, 600),
    ageAtPolicyEntry: inRange(f.ageAtPolicyEntry, 0, 110),
    billAmount: inRange(f.billAmount, 100, 50_00_00_000),
    roomRentPerDay: inRange(f.roomRentPerDay, 50, 10_00_000),
    hospitalisationHours: inRange(f.hospitalisationHours, 0, 24 * 365),
  };
  const dropped = (Object.keys(clean) as (keyof FactsLike)[]).filter((k) => k in f && f[k] !== null && clean[k] === null);
  return { facts: clean, dropped };
}

// ─── Output: numbers read from the policy ────────────────────────────────────

type CostRulesLike = {
  sumInsured: number | null;
  subLimit: number | null;
  roomRentCapPerDay: number | null;
  copays: { percent: number; reason: string }[];
};

export function sanitizeCostRules<T extends CostRulesLike>(r: T): T {
  const pos = (v: number | null) => (v !== null && Number.isFinite(v) && v > 0 ? v : null);
  return {
    ...r,
    sumInsured: pos(r.sumInsured),
    subLimit: pos(r.subLimit),
    roomRentCapPerDay: pos(r.roomRentCapPerDay),
    copays: r.copays.filter((c) => Number.isFinite(c.percent) && c.percent > 0 && c.percent < 100).slice(0, 4),
  };
}

// ─── Output: evidence gate ───────────────────────────────────────────────────

type AnswerLike = { verdict: string; confidence: "low" | "medium" | "high"; missingInfo: string[] };
type CheckLike = { status: "verified" | "approximate" | "unverified" };

/**
 * A verdict is only as good as its evidence. If none of the model's quotes can be
 * found in the policy, we don't show a confident yes/no; we say we can't tell.
 * Also caps confidence when the facts that decide most claims are unknown.
 */
export function enforceGrounding<T extends AnswerLike>(answer: T, checks: CheckLike[], facts: FactsLike): { answer: T; notes: string[] } {
  const notes: string[] = [];
  const out = { ...answer, missingInfo: [...answer.missingInfo] };
  const supported = checks.filter((c) => c.status !== "unverified").length;

  if (checks.length > 0 && supported === 0 && answer.verdict !== "insufficient_information") {
    out.verdict = "insufficient_information";
    out.confidence = "low";
    notes.push("None of the quotes behind this answer could be found in your policy, so we're not showing a verdict. Please check the clauses yourself.");
  } else if (checks.length > 0 && supported / checks.length < 0.5 && out.confidence === "high") {
    out.confidence = "medium";
    notes.push("Some quotes couldn't be matched to your policy text, so confidence was lowered.");
  }

  if (facts.monthsSincePolicyStart === null && out.confidence === "high") {
    out.confidence = "medium";
    if (!out.missingInfo.some((q) => /month|year|old|start/i.test(q))) out.missingInfo.unshift("How long has the policy been active (including renewals and portability)?");
  }
  return { answer: out, notes };
}

// ─── Errors: what users see vs what we log ───────────────────────────────────

export type FriendlyError = { status: number; code: string; message: string };

/** Map raw provider/validation errors to messages a user can act on. Raw details go to logs only. */
export function toFriendlyError(err: unknown): FriendlyError {
  const e = err as { name?: string; message?: string; statusCode?: number };
  const msg = `${e?.name ?? ""} ${e?.message ?? ""}`;
  if (e?.name === "ZodError") return { status: 400, code: "bad_request", message: "That request wasn't in the expected format. Please refresh the page and try again." };
  if (/api key|api_key|unauthori[sz]ed|permission denied|401|403/i.test(msg)) return { status: 503, code: "config", message: "The AI service isn't configured correctly. If you run this app, check your API key." };
  if (/quota|rate.?limit|429|exhausted|too many requests/i.test(msg)) return { status: 429, code: "busy", message: "The free AI quota is busy right now. Please try again in a minute." };
  if (/abort|timeout|timed out|deadline/i.test(msg)) return { status: 504, code: "timeout", message: "The AI took too long to respond. Please try again; it's usually faster the second time." };
  if (/no object generated|could not parse|json|schema|type validation/i.test(msg)) return { status: 502, code: "bad_output", message: "The AI returned an answer we couldn't read safely, so we didn't show it. Please try again." };
  if (/no longer available|not found|404|unsupported model/i.test(msg)) return { status: 503, code: "model", message: "The AI model is temporarily unavailable. Please try again shortly." };
  if (/safety|blocked|recitation/i.test(msg)) return { status: 422, code: "blocked", message: "The AI declined to process this text. Please describe the medical situation in plain words." };
  return { status: 500, code: "unknown", message: "Something went wrong on our side. Please try again." };
}
