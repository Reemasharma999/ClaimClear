"use client";

import { Check, Plus, SlidersHorizontal, Sparkles } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { cleanBlanks, DETAILS, unfilledBlanks } from "@/lib/client";
import type { RetrievalMode } from "@/lib/retrieve";
import { btnPrimary, card, StepHeader } from "./ui";

const EXAMPLES = [
  {
    title: "Knee replacement for a senior parent",
    text: "My father needs a knee replacement. He was 63 when we bought the policy 30 months ago. Estimated bill ₹2,80,000 at a network hospital, room rent ₹4,000/day. It's due to osteoarthritis, not an accident.",
  },
  {
    title: "Road accident on a new policy",
    text: "I broke my leg in a road accident and was admitted for 3 days. The policy is only 2 months old and I was 29 when I bought it. Bill about ₹1,20,000 at a network hospital; I took a private room at ₹7,500/day.",
  },
  {
    title: "Cataract surgery, 14 months in",
    text: "Cataract surgery on one eye as a day-care procedure at a network hospital. The policy is 14 months old, I was 45 when I bought it. Bill ₹55,000. It's an illness, not an accident.",
  },
];

export type ScenarioHandle = { addLine: (text: string) => void };

type Props = {
  scenario: string;
  setScenario: (s: string) => void;
  mode: RetrievalMode;
  setMode: (m: RetrievalMode) => void;
  disabled: boolean;
  busy: boolean;
  hasResult: boolean;
  onSubmit: () => void;
};

export const ScenarioStep = forwardRef<ScenarioHandle, Props>(function ScenarioStep(
  { scenario, setScenario, mode, setMode, disabled, busy, hasResult, onSubmit },
  ref,
) {
  const ta = useRef<HTMLTextAreaElement>(null);

  // Insert a sentence stem and select its "__" blank so the user just types the value.
  const insert = (stem: string) => {
    const base = scenario.trimEnd();
    const next = (base ? base + (/[.!?]$/.test(base) ? "" : ".") : "") + stem;
    setScenario(next.trimStart());
    requestAnimationFrame(() => {
      const el = ta.current;
      if (!el) return;
      el.focus();
      const at = el.value.lastIndexOf("__");
      if (at >= 0) el.setSelectionRange(at, at + 2);
      else el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  useImperativeHandle(ref, () => ({
    addLine: (text: string) => {
      ta.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      insert(` ${text} __.`);
    },
  }));

  const present = DETAILS.map((d) => ({ ...d, ok: d.test.test(scenario) }));
  const score = present.filter((d) => d.ok).length;
  const blanks = unfilledBlanks(scenario);

  // Tidy leftover markers, then select the first truly empty blank (if any) so typing fills it.
  const showBlank = () => {
    const clean = cleanBlanks(scenario);
    setScenario(clean);
    requestAnimationFrame(() => {
      const el = ta.current;
      const at = clean.indexOf("__");
      if (!el || at < 0) return;
      el.focus();
      el.setSelectionRange(at, at + 2);
    });
  };

  return (
    <section id="situation" className={`${card} p-5 sm:p-8 ${disabled ? "pointer-events-none opacity-45" : ""}`} inert={disabled}>
      <StepHeader
        n={2}
        state={disabled ? "todo" : hasResult ? "done" : "active"}
        title="Tell us what happened"
        subtitle="Write it like you'd explain it to a friend. The more detail, the more precise the answer."
      />

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-bg transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
        <textarea
          ref={ta}
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit(); }}
          rows={5}
          aria-label="Describe the treatment and your situation"
          placeholder="e.g. My mother needs gallbladder surgery next month. We bought the policy 3 years ago when she was 58…"
          className="block w-full resize-none bg-transparent px-5 pt-4 text-[16px] leading-relaxed outline-none placeholder:text-faint"
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-line/70 px-4 py-3">
          <span className="mr-1 text-xs font-medium text-faint">Details that decide claims</span>
          {present.map((d) =>
            d.ok ? (
              <span key={d.key} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                <Check className="h-3 w-3" /> {d.label.replace("?", "")}
              </span>
            ) : (
              <button
                key={d.key}
                onClick={() => insert(d.stem)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-ink"
              >
                <Plus className="h-3 w-3" /> {d.label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3" aria-label={`${score} of ${DETAILS.length} key details provided`}>
        <div className="flex flex-1 gap-1">
          {DETAILS.map((d, i) => (
            <span key={d.key} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? "bg-accent" : "bg-surface-3"}`} />
          ))}
        </div>
        <span className="text-xs tabular-nums text-faint">{score}/{DETAILS.length} details</span>
      </div>

      {!scenario && (
        <div className="mt-6">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-faint">
            <Sparkles className="h-3.5 w-3.5" /> Or start from an example
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                onClick={() => setScenario(ex.text)}
                className="rounded-2xl border border-line bg-bg p-4 text-left transition hover:-translate-y-0.5 hover:border-accent"
              >
                <p className="text-sm font-semibold">{ex.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{ex.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <details className="group text-sm text-muted">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-ink">
            <SlidersHorizontal className="h-4 w-4" /> Search method
          </summary>
          <div className="mt-2 inline-flex rounded-full border border-line bg-bg p-1" role="radiogroup" aria-label="Retrieval method">
            {([["hybrid", "Hybrid"], ["bm25", "Keyword"], ["vector", "Semantic"]] as const).map(([m, label]) => (
              <button
                key={m}
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${mode === m ? "bg-ink text-bg" : "hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
        <button onClick={onSubmit} disabled={busy || scenario.trim().length < 10 || blanks.length > 0} className={`${btnPrimary} w-full sm:w-auto`}>
          {busy ? "Checking your policy…" : hasResult ? "Check again" : "Check my claim"}
          <kbd className="hidden rounded border border-white/25 px-1.5 text-[10px] font-normal opacity-70 sm:inline">Ctrl ↵</kbd>
        </button>
      </div>
      {blanks.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-xs text-warn" role="status">
          <span>
            {blanks.length === 1 ? "One blank is still empty" : `${blanks.length} blanks are still empty`}: <q className="font-mono">{blanks[0]}</q>
          </span>
          <button onClick={showBlank} className="font-semibold underline underline-offset-4">
            Show me
          </button>
        </p>
      )}
    </section>
  );
});
