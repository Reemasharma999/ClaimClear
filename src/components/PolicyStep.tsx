"use client";

import { AlertTriangle, BookOpenText, FileCheck2, FileUp, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import type { PolicyIndex } from "@/lib/types";
import { card, StepHeader } from "./ui";

export function PolicyStep({
  index,
  indexing,
  onSample,
  onUpload,
  onReset,
}: {
  index: PolicyIndex | null;
  indexing: string | null;
  onSample: () => void;
  onUpload: (f: File) => void;
  onReset: () => void;
}) {
  const [drag, setDrag] = useState(false);

  if (index) {
    return (
      <section className={`${card} rise flex flex-wrap items-center gap-4 p-5 sm:p-6`}>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">Step 1 · Policy ready</p>
          <p className="truncate font-semibold">{index.title}</p>
          <p className="text-sm text-muted">
            {index.pages} pages · {index.chunks.length} clauses indexed · searchable in this tab only
          </p>
        </div>
        <button onClick={onReset} className="text-sm font-medium text-muted underline decoration-line underline-offset-4 hover:text-ink">
          Change policy
        </button>
        {index.warnings?.map((w) => (
          <p key={w} className="flex w-full items-start gap-2 rounded-xl bg-warn-bg px-3 py-2 text-xs text-warn">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
          </p>
        ))}
      </section>
    );
  }

  return (
    <section className={`${card} p-5 sm:p-8`}>
      <StepHeader n={1} state="active" title="Start with the policy" subtitle="ClaimClear only answers from the policy you give it." />

      {indexing ? (
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-line bg-bg p-6" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <div className="flex-1">
            <p className="font-medium">{indexing}</p>
            <div className="shimmer mt-3 h-1.5 w-full rounded-full" />
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onSample}
            className="group flex flex-col items-start rounded-2xl border border-line bg-bg p-5 text-left transition hover:-translate-y-0.5 hover:border-accent hover:shadow-card"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-ink">
              <BookOpenText className="h-5 w-5" />
            </span>
            <span className="mt-4 font-semibold">Try a sample policy</span>
            <span className="mt-1 text-sm text-muted">Suraksha Health Plus: a fictional 6-page policy with real-world clauses.</span>
            <span className="mt-4 text-sm font-semibold text-accent group-hover:underline">Use sample →</span>
          </button>

          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onUpload(f);
            }}
            className={`group flex cursor-pointer flex-col items-start rounded-2xl border border-dashed p-5 text-left transition hover:-translate-y-0.5 hover:border-accent ${
              drag ? "border-accent bg-accent-soft" : "border-line bg-bg"
            }`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-ink">
              <FileUp className="h-5 w-5" />
            </span>
            <span className="mt-4 font-semibold">Upload your policy PDF</span>
            <span className="mt-1 text-sm text-muted">Drop the policy wording from your insurer&apos;s email or website. Text PDFs, up to 120 pages.</span>
            <span className="mt-4 text-sm font-semibold text-accent group-hover:underline">Choose file →</span>
            <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-faint">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Your PDF is read in your browser and never stored on our servers. Its text is sent to an AI model on a free tier, whose provider may
        use inputs to improve its models, so leave out names, policy numbers and ID numbers.
      </p>
    </section>
  );
}
