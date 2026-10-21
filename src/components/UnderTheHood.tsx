"use client";

import { ChevronDown, Cpu } from "lucide-react";
import { useState } from "react";
import type { Plan } from "@/lib/client";
import type { RetrievalMode } from "@/lib/retrieve";
import type { RetrievedChunk } from "@/lib/types";

/** The "engineering view": what the AI actually did, for curious users and reviewers. */
export function UnderTheHood({ plan, retrieved, mode, answerModel, onOpen }: { plan: Plan; retrieved: RetrievedChunk[]; mode: RetrievalMode; answerModel?: string; onOpen: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const max = Math.max(...retrieved.map((r) => r.rrfScore), 0.0001);

  return (
    <section className="overflow-hidden rounded-3xl bg-code-bg text-code-ink">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-4 p-6 text-left sm:px-8">
        <Cpu className="h-5 w-5 text-[#7fd6bf]" />
        <div className="flex-1">
          <p className="font-semibold text-white">Show the AI&apos;s work</p>
          <p className="text-sm opacity-60">Extracted facts, search queries, retrieval ranks and the models used</p>
        </div>
        <ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-8 border-t border-white/10 p-6 font-mono text-[13px] sm:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#7fd6bf]">01 · facts extracted · {plan.modelName}</p>
              <dl className="mt-3 space-y-1">
                {Object.entries(plan.facts).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-white/5 py-1">
                    <dt className="opacity-60">{k}</dt>
                    <dd className={v === null ? "opacity-30" : "text-white"}>{v === null ? "null" : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#7fd6bf]">02 · query decomposition</p>
              <ol className="mt-3 space-y-2">
                {plan.queries.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="opacity-40">q{i + 1}</span>
                    <span className="text-white">{q.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#7fd6bf]">03 · {mode} retrieval → reciprocal rank fusion</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="text-left text-[11px] opacity-50">
                  <tr>
                    <th className="py-1.5 font-normal">clause</th>
                    <th className="py-1.5 font-normal">bm25</th>
                    <th className="py-1.5 font-normal">vector</th>
                    <th className="w-1/3 py-1.5 font-normal">rrf score</th>
                  </tr>
                </thead>
                <tbody>
                  {retrieved.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="py-1.5 pr-3">
                        <button onClick={() => onOpen(r.id)} className="text-left text-white hover:underline">
                          {r.section.length > 38 ? r.section.slice(0, 38) + "…" : r.section}
                        </button>
                      </td>
                      <td className="py-1.5 tabular-nums">{r.bm25Rank ? `#${r.bm25Rank}` : "–"}</td>
                      <td className="py-1.5 tabular-nums">{r.vectorRank ? `#${r.vectorRank}` : "–"}</td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#7fd6bf]" style={{ width: `${(r.rrfScore / max) * 100}%` }} />
                          </div>
                          <span className="tabular-nums opacity-70">{r.rrfScore.toFixed(3)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="leading-relaxed opacity-70">
            04 · {answerModel ?? "…"} answered from these {retrieved.length} clauses only. Every quote was string-matched against its clause, and
            the estimate was computed in TypeScript from the numbers the model extracted. <a href="/how-it-works" className="text-[#7fd6bf] underline">How it works →</a>
          </p>
        </div>
      )}
    </section>
  );
}
