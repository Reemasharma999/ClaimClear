"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Appeal } from "@/components/Appeal";
import { ClarifyCard, PrivacyNotice, UrgencyBanner } from "@/components/Notices";
import { ClauseDrawer } from "@/components/ClauseDrawer";
import { Hero } from "@/components/Hero";
import { PolicyStep } from "@/components/PolicyStep";
import { Progress } from "@/components/Progress";
import { ScenarioStep, type ScenarioHandle } from "@/components/ScenarioStep";
import { TopBar } from "@/components/ui";
import { UnderTheHood } from "@/components/UnderTheHood";
import { Findings, MissingInfo, NextSteps, Receipt, VerdictHero } from "@/components/Verdict";
import { cleanBlanks, post, unfilledBlanks, type Plan, type Result, type Stage } from "@/lib/client";
import { looksLikeHealthPolicy, redactPII } from "@/lib/guardrails";
import { hybridSearch, type RetrievalMode } from "@/lib/retrieve";
import type { Chunk, PolicyIndex, RetrievedChunk } from "@/lib/types";

export default function Home() {
  const [index, setIndex] = useState<PolicyIndex | null>(null);
  const [indexing, setIndexing] = useState<string | null>(null);
  const [scenario, setScenario] = useState("");
  const [mode, setMode] = useState<RetrievalMode>("hybrid");
  const [stage, setStage] = useState<Stage>("idle");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [retrieved, setRetrieved] = useState<RetrievedChunk[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ msg: string; retry?: () => void } | null>(null);
  const [openChunk, setOpenChunk] = useState<{ id: string; quote?: string } | null>(null);
  const [redacted, setRedacted] = useState<string[]>([]);
  const scenarioRef = useRef<ScenarioHandle>(null);
  const busyRef = useRef(false);

  const scrollTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));

  // Dev-only: /?fixture loads a hand-computed result so UI states can be reviewed without an API key.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !new URLSearchParams(location.search).has("fixture")) return;
    import("@/lib/fixture").then(({ loadFixture }) => {
      const f = loadFixture();
      setIndex(f.index);
      setScenario(f.scenario);
      setPlan(f.plan);
      setRetrieved(f.retrieved);
      setResult(f.result);
      setStage("done");
      scrollTo("result");
    });
  }, []);

  async function loadSample() {
    setError(null);
    setIndexing("Indexing the sample policy: reading 6 pages, splitting into clauses, embedding…");
    try {
      setIndex(await post<PolicyIndex>("/api/index", { sample: true }));
      scrollTo("situation");
    } catch (e) {
      setError({ msg: (e as Error).message, retry: loadSample });
    } finally {
      setIndexing(null);
    }
  }

  async function uploadPdf(file: File) {
    setError(null);
    try {
      // Fail fast in the browser: every check here costs nothing and saves an API call.
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error("Please choose a PDF file.");
      if (file.size > 25 * 1024 * 1024) throw new Error("This PDF is over 25 MB. Policy wordings are usually under 5 MB; please upload the wording, not a scanned bundle.");
      setIndexing(`Reading “${file.name}” in your browser…`);
      const { extractText, getDocumentProxy } = await import("unpdf");
      let pdf;
      try {
        pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      } catch (e) {
        throw new Error(/password/i.test(String((e as Error)?.name) + (e as Error)?.message)
          ? "This PDF is password-protected. Open it, save an unprotected copy (Print → Save as PDF), and upload that."
          : "We couldn't open this PDF. It may be damaged. Try downloading it again from your insurer.");
      }
      const { text } = await extractText(pdf, { mergePages: false });
      const all = text.map((t, i) => ({ page: i + 1, text: redactPII(t.slice(0, 20000)).text })).filter((p) => p.text.trim());
      if (!all.length) throw new Error("This PDF has no selectable text (it's probably a scan). Download the policy wording PDF from your insurer's website and try again.");
      if (looksLikeHealthPolicy(all.map((p) => p.text).join("\n")).verdict === "no") {
        throw new Error("This doesn't look like a health insurance policy wording. ClaimClear only reads health policies. Please upload the policy wording PDF from your insurer.");
      }
      const pages = all.slice(0, 120);
      setIndexing(`Found ${all.length} pages. Splitting into clauses and building your private search index…`);
      const idx = await post<PolicyIndex>("/api/index", { title: file.name.replace(/\.pdf$/i, "").slice(0, 200), pages });
      if (all.length > pages.length) idx.warnings = [`Only the first ${pages.length} of ${all.length} pages were read. Clauses after page ${pages.length} won't be considered.`, ...(idx.warnings ?? [])];
      setIndex(idx);
      scrollTo("situation");
    } catch (e) {
      setError({ msg: (e as Error).message });
    } finally {
      setIndexing(null);
    }
  }

  const check = useCallback(async () => {
    if (busyRef.current) return; // no double submits (Ctrl+Enter spam, double clicks)
    const cleaned = cleanBlanks(scenario);
    if (!index || cleaned.trim().length < 10 || unfilledBlanks(cleaned).length) return;
    if (cleaned !== scenario) setScenario(cleaned);
    // PII never leaves the browser: ID numbers don't affect a claim decision.
    const { text, redactions } = redactPII(cleaned);
    setRedacted(redactions);
    busyRef.current = true;
    setError(null);
    setResult(null);
    setPlan(null);
    setRetrieved([]);
    scrollTo("result");
    try {
      setStage("planning");
      const p = await post<Plan>("/api/plan", { scenario: text });
      setPlan(p);
      if (p.triage.status !== "ok") {
        setStage("idle"); // fail fast: no retrieval, no second model call
        return;
      }

      setStage("retrieving"); // runs in the browser: the policy index never leaves this tab
      const hits = hybridSearch(index.chunks, p.queries, 10, mode);
      setRetrieved(hits);

      setStage("answering");
      const chunks = hits.map(({ id, page, section, text, indexText }) => ({ id, page, section, text, indexText }));
      setResult(await post<Result>("/api/answer", { scenario: text, facts: p.facts, chunks, language: p.triage.language }));
      setStage("done");
    } catch (e) {
      setError({ msg: (e as Error).message, retry: () => check() });
      setStage("idle");
    } finally {
      busyRef.current = false;
    }
  }, [index, scenario, mode]);

  function reset() {
    setResult(null);
    setPlan(null);
    setRetrieved([]);
    setStage("idle");
    setScenario("");
    scrollTo("check");
  }

  const chunkById = useMemo(() => new Map<string, Chunk>(index?.chunks.map((c) => [c.id, c]) ?? []), [index]);
  const busy = stage === "planning" || stage === "retrieving" || stage === "answering";
  const opened = openChunk ? chunkById.get(openChunk.id) : undefined;

  return (
    <>
      <TopBar
        right={
          <>
            {result && (
              <button onClick={reset} className="hidden items-center gap-1.5 hover:text-ink sm:inline-flex">
                <RotateCcw className="h-3.5 w-3.5" /> New check
              </button>
            )}
            <Link href="/how-it-works" className="hover:text-ink">
              How it works
            </Link>
          </>
        }
      />

      <main>
        <Hero />

        <div id="check" className="mx-auto max-w-3xl scroll-mt-20 space-y-4 px-4 sm:px-6">
          <PolicyStep index={index} indexing={indexing} onSample={loadSample} onUpload={uploadPdf} onReset={() => { setIndex(null); reset(); }} />
          <ScenarioStep
            ref={scenarioRef}
            scenario={scenario}
            setScenario={setScenario}
            mode={mode}
            setMode={setMode}
            disabled={!index}
            busy={busy}
            hasResult={!!result}
            onSubmit={check}
          />
        </div>

        {error && (
          <div className="mx-auto mt-4 max-w-3xl px-4 sm:px-6" role="alert">
            <div className="rise flex items-start gap-3 rounded-2xl border border-bad/30 bg-bad-bg p-4 text-sm text-bad">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1">{error.msg}</p>
              {error.retry && (
                <button onClick={error.retry} className="shrink-0 font-semibold underline underline-offset-4">
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        <div id="result" className="mx-auto max-w-6xl scroll-mt-20 space-y-4 px-4 pt-10 sm:px-6">
          {plan && plan.triage.urgency !== "none" && (
            <div className="mx-auto max-w-3xl">
              <UrgencyBanner urgency={plan.triage.urgency} />
            </div>
          )}
          {plan && (redacted.length > 0 || plan.droppedFacts?.length > 0) && (
            <div className="mx-auto max-w-3xl">
              <PrivacyNotice redactions={redacted} droppedFacts={plan.droppedFacts ?? []} />
            </div>
          )}
          {plan && plan.triage.status !== "ok" && !busy && (
            <ClarifyCard plan={plan} onEdit={() => document.getElementById("situation")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
          )}
          {busy && (
            <div className="mx-auto max-w-3xl">
              <Progress stage={stage} plan={plan} retrieved={retrieved} totalClauses={index?.chunks.length ?? 0} />
            </div>
          )}

          {result && (
            <div className="space-y-5">
              <VerdictHero result={result} />
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="lg:sticky lg:top-20 lg:order-2">
                  <Receipt result={result} onAddBill={() => scenarioRef.current?.addLine("The estimated bill is ₹")} />
                </div>
                <div className="min-w-0 space-y-5 lg:order-1">
                  <Findings result={result} chunks={chunkById} onCite={(id, quote) => setOpenChunk({ id, quote })} />
                  <MissingInfo questions={result.answer.missingInfo} onAnswer={(q) => scenarioRef.current?.addLine(`About "${q.replace(/\?$/, "")}":`)} />
                  <NextSteps steps={result.answer.nextSteps} />
                  <Appeal answer={result.answer} scenario={scenario} />
                </div>
              </div>
              {plan && <UnderTheHood plan={plan} retrieved={retrieved} mode={mode} answerModel={result.modelName} onOpen={(id) => setOpenChunk({ id })} />}
            </div>
          )}
        </div>

        <footer className="mx-auto mt-24 max-w-6xl border-t border-line px-4 py-10 text-xs leading-relaxed text-faint sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <p className="max-w-xl">
              ClaimClear is an information tool, not legal or insurance advice. Your insurer makes the final decision, so always confirm with
              them. Statistics: IRDAI Annual Report 2024-25; Rajya Sabha answer, Feb 2025. The sample policy is fictional.
            </p>
            <p>
              Built by <a href="https://portfolio-rs-blush.vercel.app" className="underline underline-offset-4 hover:text-ink">Reema Sharma</a> ·{" "}
              <Link href="/how-it-works" className="underline underline-offset-4 hover:text-ink">How it works</Link>
            </p>
          </div>
        </footer>
      </main>

      {openChunk && opened && <ClauseDrawer chunk={opened} quote={openChunk.quote} onClose={() => setOpenChunk(null)} />}
    </>
  );
}
