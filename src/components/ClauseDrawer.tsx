"use client";

import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { clauseLabel } from "@/lib/client";
import type { Chunk } from "@/lib/types";

/** The policy page itself, with the exact sentence the answer relied on highlighted. */
export function ClauseDrawer({ chunk, quote, onClose }: { chunk: Chunk; quote?: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const [heading, ...rest] = chunk.text.split("\n");
  const isHeading = heading.trim() === chunk.section.trim();
  const body = isHeading ? rest.join("\n") : chunk.text;

  const parts = useMemo(() => {
    if (!quote) return null;
    const q = quote.trim().replace(/\s+/g, " ");
    const text = body.replace(/\s+/g, " ");
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    return i < 0 ? null : [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)];
  }, [body, quote]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Policy clause ${chunk.section}`}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet-in absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-float sm:inset-y-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-[500px] sm:rounded-[28px]">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <p className="font-mono text-xs text-faint">
              Page {chunk.page} · {clauseLabel(chunk.section, chunk.id)}
            </p>
            <p className="mt-1 font-serif text-2xl leading-tight">{chunk.section.replace(/^[\d.]+\s*/, "")}</p>
          </div>
          <button ref={closeRef} onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 hover:bg-surface-3" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {quote && (
            <div className={`mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ${parts ? "bg-good-bg text-good" : "bg-warn-bg text-warn"}`}>
              {parts ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>
                {parts
                  ? "Verified: this exact wording appears in your policy."
                  : `The AI quoted “${quote}”, but that exact wording isn't in this clause. Read the clause yourself before relying on it.`}
              </span>
            </div>
          )}
          <article className="paper rounded-2xl border border-line px-6 py-5 text-[15px] leading-[28px]">
            {isHeading && <p className="font-semibold">{heading}</p>}
            {parts ? (
              <p>
                {parts[0]}
                <mark className="hl">{parts[1]}</mark>
                {parts[2]}
              </p>
            ) : (
              <p className="whitespace-pre-wrap">{body}</p>
            )}
          </article>
          <p className="mt-4 text-xs text-faint">Clause id {chunk.id}. This is the exact text the AI was given; nothing else from your policy was used for this point.</p>
        </div>
      </div>
    </div>
  );
}
