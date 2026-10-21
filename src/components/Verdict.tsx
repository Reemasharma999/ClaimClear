"use client";

import { AlertTriangle, CircleCheck, CircleHelp, CircleMinus, CircleX, ListChecks, MessageCircleQuestion, ShieldCheck, ThumbsUp } from "lucide-react";
import { clauseLabel, inr, type Result } from "@/lib/client";
import type { CitationCheck } from "@/lib/pipeline";
import type { Chunk } from "@/lib/types";
import { card } from "./ui";

export const VERDICT = {
  covered: { label: "Likely covered", Icon: CircleCheck, tone: "text-good", bg: "bg-good-bg", bar: "bg-good" },
  partially_covered: { label: "Partly covered", Icon: CircleMinus, tone: "text-warn", bg: "bg-warn-bg", bar: "bg-warn" },
  not_covered: { label: "Likely not covered", Icon: CircleX, tone: "text-bad", bg: "bg-bad-bg", bar: "bg-bad" },
  insufficient_information: { label: "Need a few more details", Icon: CircleHelp, tone: "text-info", bg: "bg-info-bg", bar: "bg-info" },
} as const;

const CONF = { low: 1, medium: 2, high: 3 } as const;

export function VerdictHero({ result }: { result: Result }) {
  const { answer, grounding } = result;
  const v = VERDICT[answer.verdict];
  const verified = grounding.filter((g) => g.status !== "unverified").length;
  return (
    <section className={`${card} rise overflow-hidden`}>
      <div className={`h-1.5 ${v.bar}`} />
      <div className="p-6 sm:p-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full ${v.bg} ${v.tone} px-3 py-1.5 text-sm font-semibold`}>
            <v.Icon className="h-4 w-4" /> {v.label}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-muted" title="How sure the analysis is, given the facts provided">
            Confidence
            <span className="flex gap-0.5" aria-label={`${answer.confidence} confidence`}>
              {[1, 2, 3].map((i) => (
                <span key={i} className={`h-2.5 w-1.5 rounded-sm ${i <= CONF[answer.confidence] ? "bg-ink" : "bg-surface-3"}`} />
              ))}
            </span>
            <span className="capitalize">{answer.confidence}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" /> {verified}/{grounding.length} quotes verified in your policy
          </span>
        </div>
        <h2 className="mt-5 max-w-3xl font-serif text-3xl leading-[1.15] tracking-tight sm:text-[2.6rem]">{answer.headline}</h2>
        {(result.guardNotes ?? []).map((n) => (
          <p key={n} className="mt-4 flex max-w-3xl items-start gap-2 rounded-xl bg-warn-bg px-4 py-3 text-sm text-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {n}
          </p>
        ))}
      </div>
    </section>
  );
}

const IMPACT = {
  helps: { Icon: ThumbsUp, cls: "bg-good-bg text-good", label: "Works in your favour" },
  hurts: { Icon: AlertTriangle, cls: "bg-bad-bg text-bad", label: "Reduces or blocks the claim" },
  neutral: { Icon: CircleMinus, cls: "bg-surface-2 text-muted", label: "Worth knowing" },
} as const;

export function Findings({ result, chunks, onCite }: { result: Result; chunks: Map<string, Chunk>; onCite: (id: string, quote: string) => void }) {
  const status = (id: string, quote: string): CitationCheck["status"] =>
    result.grounding.find((g) => g.chunkId === id && g.quote === quote)?.status ?? "unverified";
  // Show what hurts first: that's what the family needs to plan for.
  const order = { hurts: 0, neutral: 1, helps: 2 } as const;
  const findings = [...result.answer.findings].sort((a, b) => order[a.impact] - order[b.impact]);

  return (
    <section className={`${card} rise p-6 sm:p-8`} style={{ animationDelay: "80ms" }}>
      <h3 className="text-lg font-semibold tracking-tight">Why: clause by clause</h3>
      <p className="mt-1 text-sm text-muted">Tap a clause tag to read the exact wording in your policy.</p>
      <ol className="mt-6 space-y-3">
        {findings.map((f, i) => {
          const m = IMPACT[f.impact];
          return (
            <li key={i} className="flex gap-4 rounded-2xl border border-line/70 bg-bg p-4 sm:p-5">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.cls}`} title={m.label}>
                <m.Icon className="h-4 w-4" aria-hidden />
                <span className="sr-only">{m.label}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-relaxed">{f.point}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.citations.map((c, j) => {
                    const s = status(c.chunkId, c.quote);
                    const chunk = chunks.get(c.chunkId);
                    return (
                      <button
                        key={j}
                        onClick={() => onCite(c.chunkId, c.quote)}
                        className={`group inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition hover:-translate-y-px ${
                          s === "unverified" ? "border-bad/40 bg-bad-bg text-bad" : "border-line bg-surface hover:border-accent"
                        }`}
                        aria-label={`Open clause ${chunk?.section ?? c.chunkId}${s === "unverified" ? ", quote could not be verified" : ""}`}
                      >
                        <span className="font-mono font-semibold">{clauseLabel(chunk?.section, c.chunkId)}</span>
                        <span className="truncate text-muted group-hover:text-ink">{chunk?.section.replace(/^[\d.]+\s*/, "") ?? "Clause"}</span>
                        <span className={s === "verified" ? "text-good" : s === "approximate" ? "text-warn" : "text-bad"}>
                          {s === "verified" ? "✓" : s === "approximate" ? "≈" : "⚠"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-faint">✓ quote found word-for-word in the policy · ≈ near match · ⚠ not found; treat with caution</p>
    </section>
  );
}

export function Receipt({ result, onAddBill }: { result: Result; onAddBill: () => void }) {
  const e = result.estimate;
  if (!e) {
    return (
      <aside className={`${card} rise p-6`} style={{ animationDelay: "120ms" }}>
        <p className="text-xs font-medium uppercase tracking-wider text-faint">Claim estimate</p>
        <p className="mt-3 font-serif text-2xl leading-snug">How much will you pay?</p>
        <p className="mt-2 text-sm text-muted">Add an estimated bill amount and we&apos;ll calculate the insurer&apos;s share and yours, line by line.</p>
        <button onClick={onAddBill} className="mt-5 text-sm font-semibold text-accent hover:underline">
          + Add estimated bill
        </button>
      </aside>
    );
  }
  const deductions = e.steps.slice(1);
  return (
    <aside className="receipt rise bg-surface px-6 py-9 shadow-float sm:px-7" style={{ animationDelay: "120ms" }} aria-label="Claim estimate">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">Claim estimate</p>
        <p className="font-mono text-[10px] text-faint">{new Date().toLocaleDateString("en-IN")}</p>
      </div>
      <div className="dotted-rule my-5" />
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Hospital bill</dt>
          <dd className="tabular-nums">{inr(e.bill)}</dd>
        </div>
        {deductions.map((s, i) => {
          const prev = e.steps[i].amountAfter;
          const cut = prev - s.amountAfter;
          return (
            <div key={i} className="flex justify-between gap-4">
              <dt className="text-muted">{s.label}</dt>
              <dd className="shrink-0 tabular-nums text-bad">{cut > 0 ? `− ${inr(cut)}` : inr(s.amountAfter)}</dd>
            </div>
          );
        })}
      </dl>
      <div className="dotted-rule my-5" />
      <div className="flex justify-between text-sm">
        <span>Insurer pays</span>
        <span className="font-semibold tabular-nums text-good">{inr(e.payable)}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="pb-1 text-sm font-semibold">You pay</span>
        <span className="font-serif text-[2.6rem] leading-none tracking-tight">{inr(e.outOfPocket)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-good-bg" aria-hidden>
        <div className="h-full rounded-full bg-bad/80" style={{ width: `${Math.min(100, (e.outOfPocket / e.bill) * 100)}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between text-[11px] text-faint">
        <span>You {Math.round((e.outOfPocket / e.bill) * 100)}%</span>
        <span>Insurer {Math.round((e.payable / e.bill) * 100)}%</span>
      </p>
      <p className="mt-5 text-[11px] leading-relaxed text-faint">{e.caveat}</p>
    </aside>
  );
}

export function MissingInfo({ questions, onAnswer }: { questions: string[]; onAnswer: (q: string) => void }) {
  if (!questions.length) return null;
  return (
    <section className="rise rounded-3xl border border-info/20 bg-info-bg p-6 text-info sm:p-7">
      <p className="flex items-center gap-2 font-semibold">
        <MessageCircleQuestion className="h-5 w-5" /> These answers could change the result
      </p>
      <ul className="mt-4 space-y-2">
        {questions.map((q, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface/70 px-4 py-3 text-sm text-ink">
            <span>{q}</span>
            <button onClick={() => onAnswer(q)} className="shrink-0 text-xs font-semibold text-accent hover:underline">
              Answer →
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NextSteps({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <section className={`${card} rise p-6 sm:p-7`}>
      <p className="flex items-center gap-2 font-semibold">
        <ListChecks className="h-5 w-5 text-accent" /> What to do next
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-xs">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
