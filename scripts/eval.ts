// Offline evaluation: `npm run eval`
//
// Measures the three things that decide whether a RAG product can be trusted:
//   1. Retrieval recall@10: did we even fetch the clauses the answer depends on?
//      Compared across BM25-only, vector-only and hybrid, using identical queries.
//   2. Verdict accuracy: does the final answer match a human label?
//   3. Grounding rate: what share of the model's quotes actually exist in the policy?
// Writes evals/results.json (shown on /how-it-works) and evals/REPORT.md.

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "node:fs";
import { chunkPages, sectionNumber } from "../src/lib/chunk";
import { embed } from "../src/lib/models";
import { answerClaim, planClaim } from "../src/lib/pipeline";
import { hybridSearch, type RetrievalMode } from "../src/lib/retrieve";
import { SAMPLE_PAGES, SAMPLE_TITLE } from "../src/lib/sample-policy";
import { GOLDEN, REDTEAM, type GoldenCase } from "../evals/golden";
import { redactPII } from "../src/lib/guardrails";

const PAUSE_MS = Number(process.env.EVAL_PAUSE_MS ?? 6500); // stay under free-tier requests-per-minute
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MODES: RetrievalMode[] = ["bm25", "vector", "hybrid"];
const K = 10;

async function main() {
  const arg = process.argv[2];
  if (arg === "redteam") return redteam();
  const only = arg;
  const cases = only ? GOLDEN.filter((c) => c.id === only) : GOLDEN;
  const index = await buildIndex();
  console.log(`Indexed ${index.length} clauses. Running ${cases.length} cases…\n`);

  const rows = [];
  for (const c of cases) {
    const t0 = Date.now();
    const r = await runCase(c, index);
    const row = {
      id: c.id,
      expected: c.verdict,
      got: r.verdict,
      correct: r.verdict === c.verdict,
      recall: r.recall,
      quotes: r.quotes,
      grounded: r.grounded,
      latencyMs: Date.now() - t0 - r.pauses * PAUSE_MS,
      model: r.model,
    };
    rows.push(row);
    console.log(
      `${row.correct ? "✓" : "✗"} ${c.id.padEnd(16)} expected=${c.verdict.padEnd(24)} got=${row.got.padEnd(24)} ` +
        `recall bm25/vec/hyb=${MODES.map((m) => r.recall[m]?.toFixed(2) ?? "–").join("/")} grounded=${r.grounded}/${r.quotes}`,
    );
  }

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const withGold = rows.filter((r) => r.recall.hybrid !== null);
  const summary = {
    runAt: new Date().toISOString(),
    cases: rows.length,
    model: rows[0]?.model,
    verdictAccuracy: mean(rows.map((r) => (r.correct ? 1 : 0))),
    recallAt10: Object.fromEntries(MODES.map((m) => [m, mean(withGold.map((r) => r.recall[m] as number))])),
    groundingRate: rows.reduce((s, r) => s + r.grounded, 0) / Math.max(1, rows.reduce((s, r) => s + r.quotes, 0)),
    medianLatencyMs: rows.map((r) => r.latencyMs).sort((a, b) => a - b)[Math.floor(rows.length / 2)],
  };

  if (!only) {
    writeFileSync("evals/results.json", JSON.stringify({ summary, rows }, null, 2));
    writeFileSync(
      "evals/REPORT.md",
      `# ClaimClear eval report\n\nRun: ${summary.runAt} · model: ${summary.model} · ${summary.cases} golden cases\n\n` +
        `| Metric | Value |\n|---|---|\n` +
        `| Verdict accuracy | ${(summary.verdictAccuracy * 100).toFixed(0)}% |\n` +
        MODES.map((m) => `| Recall@${K} (${m}) | ${(summary.recallAt10[m] * 100).toFixed(0)}% |`).join("\n") +
        `\n| Quotes found verbatim in policy | ${(summary.groundingRate * 100).toFixed(0)}% |\n| Median latency (plan+answer) | ${(summary.medianLatencyMs / 1000).toFixed(1)}s |\n\n` +
        `## Failures\n\n` +
        (rows.filter((r) => !r.correct).map((r) => `- **${r.id}**: expected \`${r.expected}\`, got \`${r.got}\``).join("\n") || "None") +
        "\n",
    );
  }
  console.log("\n", summary);
}

async function buildIndex() {
  const chunks = chunkPages(SAMPLE_PAGES, SAMPLE_TITLE);
  const embeddings = await embed(chunks.map((c) => c.indexText), "document");
  return chunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
}

/** Exactly the production path: redact PII → plan/triage → (stop if not ok) → retrieve → answer + guardrails. */
async function runCase(c: GoldenCase, index: Awaited<ReturnType<typeof buildIndex>>) {
  const scenario = redactPII(c.scenario).text;
  const plan = await planClaim(scenario);
  await sleep(PAUSE_MS);
  const recall: Record<string, number | null> = {};
  if (plan.triage.status !== "ok") {
    for (const m of MODES) recall[m] = c.gold.length ? 0 : null;
    return { triage: plan.triage, verdict: "insufficient_information", recall, quotes: 0, grounded: 0, model: plan.modelName, pauses: 1, sentScenario: scenario };
  }
  for (const mode of MODES) {
    const got = new Set(hybridSearch(index, plan.queries, K, mode).map((h) => sectionNumber(h.section)));
    recall[mode] = c.gold.length ? c.gold.filter((g) => got.has(g)).length / c.gold.length : null;
  }
  const hits = hybridSearch(index, plan.queries, K, "hybrid");
  const res = await answerClaim(scenario, plan.facts, hits, plan.triage.language);
  await sleep(PAUSE_MS);
  return {
    triage: plan.triage,
    verdict: res.answer.verdict,
    headline: res.answer.headline,
    recall,
    quotes: res.grounding.length,
    grounded: res.grounding.filter((g) => g.status !== "unverified").length,
    model: res.modelName,
    pauses: 2,
    sentScenario: scenario,
  };
}

/** Red-team run: does the system fail safely on hostile, junk, off-topic, multilingual and sensitive input? */
async function redteam() {
  const index = await buildIndex();
  console.log(`Red-team: ${REDTEAM.length} adversarial cases…\n`);
  const rows = [];
  for (const c of REDTEAM) {
    const t0 = Date.now();
    let r: Awaited<ReturnType<typeof runCase>>;
    try {
      r = await runCase(c, index);
    } catch (e) {
      // One failure must not kill the suite: record it and move on.
      rows.push({ id: c.id, pass: false, error: String((e as Error)?.message ?? e).slice(0, 200), ms: Date.now() - t0 });
      console.log(`✗ ${c.id.padEnd(15)} ERROR ${String((e as Error)?.message ?? e).slice(0, 120)}`);
      continue;
    }
    const checks = {
      triage: !c.triage || r.triage.status === c.triage,
      urgency: !c.urgency || r.triage.urgency === c.urgency,
      verdict: c.triage && c.triage !== "ok" ? true : r.verdict === c.verdict,
      noPiiSent: !/\d{4}\s?\d{4}\s?\d{4}|[6-9]\d{9}/.test(r.sentScenario),
    };
    const pass = Object.values(checks).every(Boolean);
    rows.push({ id: c.id, pass, checks, triage: r.triage.status, urgency: r.triage.urgency, language: r.triage.language, verdict: r.verdict, userMessage: r.triage.userMessage, headline: r.headline, ms: Date.now() - t0 - r.pauses * PAUSE_MS });
    console.log(`${pass ? "✓" : "✗"} ${c.id.padEnd(15)} triage=${r.triage.status.padEnd(20)} urgency=${r.triage.urgency.padEnd(15)} verdict=${r.verdict.padEnd(24)} ${Object.entries(checks).filter(([, v]) => !v).map(([k]) => `FAILED:${k}`).join(" ")}`);
    if (r.triage.status !== "ok") console.log(`    → user sees: ${r.triage.userMessage}`);
    else if (r.headline) console.log(`    → headline: ${r.headline}`);
  }
  const passed = rows.filter((r) => r.pass).length;
  writeFileSync("evals/redteam-results.json", JSON.stringify({ runAt: new Date().toISOString(), passed, total: rows.length, rows }, null, 2));
  console.log(`\nRed-team: ${passed}/${rows.length} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
