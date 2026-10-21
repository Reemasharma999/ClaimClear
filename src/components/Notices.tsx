import { EyeOff, HeartHandshake, MessageSquareWarning, Siren } from "lucide-react";
import type { Plan } from "@/lib/client";
import { card } from "./ui";

/** Safety comes before analysis: crisis and emergency banners render above everything else. */
export function UrgencyBanner({ urgency }: { urgency: Plan["triage"]["urgency"] }) {
  if (urgency === "self_harm_risk") {
    return (
      <div className="rise flex items-start gap-4 rounded-3xl border border-info/30 bg-info-bg p-5 text-info sm:p-6" role="alert">
        <HeartHandshake className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="text-sm leading-relaxed text-ink">
          <p className="font-semibold text-info">You don&apos;t have to go through this alone.</p>
          <p className="mt-1">
            If you or someone you know is thinking about self-harm, please talk to someone now. <strong>Tele-MANAS</strong> is free,
            confidential and available 24×7: call <a className="font-semibold underline" href="tel:14416">14416</a> or{" "}
            <a className="font-semibold underline" href="tel:18008914416">1-800-891-4416</a>. In an emergency, call{" "}
            <a className="font-semibold underline" href="tel:112">112</a>.
          </p>
        </div>
      </div>
    );
  }
  if (urgency === "emergency") {
    return (
      <div className="rise flex items-start gap-4 rounded-3xl border border-bad/30 bg-bad-bg p-5 sm:p-6" role="alert">
        <Siren className="mt-0.5 h-6 w-6 shrink-0 text-bad" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-bad">If this is an emergency, get care first. The claim can wait.</p>
          <p className="mt-1">
            Go to the nearest hospital or call <a className="font-semibold underline" href="tel:112">112</a>. Under IRDAI rules, insurers
            must decide on a cashless request within one hour. Emergency admissions can usually be intimated within 24 hours.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

/** Shown instead of a verdict when the question can't be answered from a policy. No error red: the user did nothing wrong. */
export function ClarifyCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const t = plan.triage;
  const title = {
    unclear: "Tell us a little more",
    not_a_claim_question: "That's outside what ClaimClear can answer",
    abusive_or_nonsense: "We couldn't find a medical situation in that",
    ok: "",
  }[t.status];
  return (
    <section className={`${card} rise mx-auto max-w-3xl p-6 sm:p-8`}>
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warn-bg text-warn">
          <MessageSquareWarning className="h-5 w-5" />
        </span>
        <div>
          <p className="font-serif text-2xl leading-snug">{title}</p>
          <p className="mt-2 leading-relaxed text-muted">{t.userMessage}</p>
          <p className="mt-4 text-sm text-muted">
            ClaimClear checks whether <strong className="text-ink">your health policy</strong> covers a <strong className="text-ink">medical treatment</strong>. For example:{" "}
            <em>&ldquo;Gallbladder surgery for my mother, policy is 3 years old, she was 58 when we bought it, bill about ₹1.2 lakh.&rdquo;</em>
          </p>
          <button onClick={onEdit} className="mt-5 text-sm font-semibold text-accent hover:underline">
            ← Edit my description
          </button>
        </div>
      </div>
    </section>
  );
}

export function PrivacyNotice({ redactions, droppedFacts }: { redactions: string[]; droppedFacts: string[] }) {
  if (!redactions.length && !droppedFacts.length) return null;
  const counts = Object.entries(redactions.reduce<Record<string, number>>((a, r) => ({ ...a, [r]: (a[r] ?? 0) + 1 }), {}));
  return (
    <div className="rise flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-xs text-muted">
      <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {counts.length > 0 && (
          <p>
            For your privacy we removed {counts.map(([label, n]) => `${n > 1 ? `${n} ` : "an "}${label}${n > 1 ? "s" : ""}`).join(", ")} before
            sending. Claims never depend on them.
          </p>
        )}
        {droppedFacts.length > 0 && (
          <p>
            We ignored {droppedFacts.length === 1 ? "a value that looked" : "values that looked"} impossible ({droppedFacts.join(", ")}), so
            {droppedFacts.length === 1 ? " it was" : " they were"} treated as unknown. Please double-check the numbers you entered.
          </p>
        )}
      </div>
    </div>
  );
}
