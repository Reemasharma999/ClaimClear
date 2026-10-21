"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { Plan, Stage } from "@/lib/client";
import type { RetrievedChunk } from "@/lib/types";
import { card } from "./ui";

const FACT_LABELS: Record<string, (v: unknown) => string> = {
  treatment: (v) => String(v),
  monthsSincePolicyStart: (v) => `${v} months insured`,
  ageAtPolicyEntry: (v) => `${v} at purchase`,
  billAmount: (v) => `₹${Number(v).toLocaleString("en-IN")} bill`,
  roomRentPerDay: (v) => `₹${Number(v).toLocaleString("en-IN")}/day room`,
  networkHospital: (v) => (v ? "network hospital" : "non-network hospital"),
  isAccident: (v) => (v ? "accident" : "illness"),
  preExistingCondition: (v) => `pre-existing: ${v}`,
  hospitalisationHours: (v) => `${v} hrs admitted`,
};

/**
 * A 10–20s wait feels shorter when users can see real progress. Each step
 * reports what the system actually found, not a fake percentage bar.
 */
export function Progress({ stage, plan, retrieved, totalClauses }: { stage: Stage; plan: Plan | null; retrieved: RetrievedChunk[]; totalClauses: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const order: Stage[] = ["planning", "retrieving", "answering", "done"];
  const at = order.indexOf(stage);
  const facts = plan ? Object.entries(plan.facts).filter(([, v]) => v !== null && v !== "") : [];

  const steps = [
    {
      title: "Understanding your situation",
      done: plan ? `Found ${facts.length} facts and ${plan.queries.length} things to check in the policy` : "",
      body: plan && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {facts.map(([k, v]) => (
            <span key={k} className="rise rounded-full bg-surface-2 px-2.5 py-1 text-xs">
              {FACT_LABELS[k]?.(v) ?? `${k}: ${v}`}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: "Searching the policy",
      done: retrieved.length ? `${retrieved.length} relevant clauses out of ${totalClauses}` : "",
      body: retrieved.length > 0 && (
        <p className="mt-1.5 font-mono text-xs text-faint">{retrieved.slice(0, 6).map((r) => r.section.split(" ")[0]).join("  ·  ")}…</p>
      ),
    },
    { title: "Reading clauses and checking every quote", done: "", body: null },
  ];

  return (
    <section className={`${card} rise p-6 sm:p-8`} role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="font-serif text-2xl">Reading your policy…</p>
        <span className="font-mono text-xs tabular-nums text-faint">{elapsed}s</span>
      </div>
      <ol className="mt-6 space-y-5">
        {steps.map((s, i) => {
          const state = at > i ? "done" : at === i ? "active" : "todo";
          return (
            <li key={s.title} className="flex gap-4">
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  state === "done" ? "bg-accent text-accent-ink" : state === "active" ? "border-2 border-accent" : "border-2 border-line"
                }`}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" /> : state === "active" ? <span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> : null}
              </span>
              <div className={`min-w-0 flex-1 ${state === "todo" ? "opacity-40" : ""}`}>
                <p className="font-medium">{s.title}</p>
                {state === "done" && s.done && <p className="text-sm text-muted">{s.done}</p>}
                {state === "active" && <div className="shimmer mt-2 h-2 w-2/3 rounded-full" />}
                {state === "done" && s.body}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
