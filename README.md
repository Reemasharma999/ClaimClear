# ClaimClear: will your health insurance actually pay?

**Live demo:** _add your Render URL_ · **How it works + eval results:** `/how-it-works` · **Learn the concepts:** [LEARN.md](LEARN.md) · **Deploy it:** [DEPLOY.md](DEPLOY.md)

In FY25, Indian insurers repudiated **8% of 3.26 crore health claims** and disallowed **₹26,000+ crore**, mostly over waiting periods, sub-limits, room-rent caps and co-pays buried in policy wording. Policyholders' biggest complaint: not knowing *why*.

ClaimClear reads your policy PDF and, for a described treatment, returns:
- a **verdict** (covered / partly / not covered / need more info),
- **clause-by-clause reasons**, each with a verbatim quote that is **string-verified** against the policy,
- an **out-of-pocket estimate** computed in code from the rules the model extracted,
- a **grievance letter** citing only IRDAI rules we could source.

## Architecture

```
Browser                                   Server (Next.js route handlers)
───────                                   ──────────────────────────────
PDF → text (pdf.js) ──pages──────────────▶ /api/index   chunk by clause + contextual headers → Gemini embeddings
index (chunks + vectors) ◀────────────────
scenario ────────────────────────────────▶ /api/plan    facts (Zod schema) + 3-6 decomposed queries → query embeddings
hybrid search: BM25 + cosine, RRF  ◀──────
top-10 clauses ──────────────────────────▶ /api/answer  grounded verdict + quotes → citation verification → cost calc
```

| Concept | File |
|---|---|
| Structure-aware chunking + contextual headers | `src/lib/chunk.ts` |
| BM25 from scratch | `src/lib/bm25.ts` |
| Hybrid retrieval + Reciprocal Rank Fusion | `src/lib/retrieve.ts` |
| Query decomposition, grounded answer, citation checks, cost calc | `src/lib/pipeline.ts` |
| Provider fallback (Gemini → Groq), asymmetric embeddings | `src/lib/models.ts` |
| Golden set + eval harness (recall@10 by retriever, accuracy, grounding) | `evals/`, `scripts/eval.ts` |

## Evaluation

`npm run eval` runs 18 hand-labelled scenarios and writes [evals/REPORT.md](evals/REPORT.md).

## Run locally

```bash
cp .env.example .env.local   # add a free Gemini key from https://aistudio.google.com/apikey
npm install
npm run dev
```

Hosting: Render (free web service, auto-deploys from `main` via [render.yaml](render.yaml)). Stack: Next.js 15, Vercel AI SDK 7, Gemini 3.5 Flash + gemini-embedding-001 (free tier), optional Groq fallback, Tailwind 4. No database.

_Not legal or insurance advice. The sample policy is fictional._
