// DEVELOPMENT-ONLY fixture used to review UI states without an API key
// (open http://localhost:3001/?fixture). It is never loaded in production.
// Numbers are worked out by hand from the sample policy: 30 months insured clears the
// 24-month wait (§4.2), §5.2 caps knee replacement at ₹1,50,000, §6.1 adds 20% co-pay.

import { chunkPages } from "./chunk";
import type { Plan, Result } from "./client";
import { SAMPLE_PAGES, SAMPLE_TITLE } from "./sample-policy";
import type { PolicyIndex, RetrievedChunk } from "./types";

export const FIXTURE_SCENARIO =
  "My father needs a knee replacement. He was 63 when we bought the policy 30 months ago. Estimated bill ₹2,80,000 at a network hospital, room rent ₹4,000/day. It's due to osteoarthritis, not an accident.";

export function loadFixture() {
  const chunks = chunkPages(SAMPLE_PAGES, SAMPLE_TITLE);
  const index: PolicyIndex = { title: SAMPLE_TITLE, pages: SAMPLE_PAGES.length, chunks: chunks.map((c) => ({ ...c, embedding: [] })) };

  const plan: Plan = {
    modelName: "fixture (no model called)",
    triage: { status: "ok", userMessage: "", urgency: "none", language: "English" },
    droppedFacts: [],
    facts: {
      treatment: "knee replacement",
      isAccident: false,
      monthsSincePolicyStart: 30,
      ageAtPolicyEntry: 63,
      preExistingCondition: null,
      billAmount: 280000,
      roomRentPerDay: 4000,
      networkHospital: true,
      hospitalisationHours: null,
    },
    queries: [
      "joint replacement knee waiting period",
      "knee replacement sub-limit per joint",
      "co-payment age at entry 61 years",
      "room rent limit per day normal room",
      "order of applying co-payment sub-limit",
    ].map((text) => ({ text, embedding: [] })),
  };

  const ranks: [string, number | null, number | null][] = [
    ["p3-c6", 1, 2], ["p4-c2", 2, 1], ["p4-c5", 3, 4], ["p2-c2", 5, 3], ["p4-c8", 4, 6],
    ["p2-c3", 7, 5], ["p3-c7", 6, 9], ["p4-c6", 8, null], ["p2-c1", null, 7], ["p3-c5", 9, 10],
  ];
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const retrieved: RetrievedChunk[] = ranks.map(([id, b, v]) => ({
    ...byId.get(id)!,
    bm25Rank: b,
    vectorRank: v,
    rrfScore: (b ? 1 / (60 + b) : 0) + (v ? 1 / (60 + v) : 0),
  }));

  const result: Result = {
    modelName: "fixture (no model called)",
    guardNotes: [],
    answer: {
      verdict: "partially_covered",
      confidence: "high",
      headline: "Your father's knee replacement is covered, but the policy caps it at ₹1.5 lakh and takes 20% off, so expect to pay about ₹1.6 lakh yourself.",
      findings: [
        {
          point: "The 24-month waiting period for knee replacement is over. At 30 months, the surgery itself is admissible.",
          impact: "helps",
          citations: [{ chunkId: "p3-c6", quote: "joint replacement surgery including knee and hip replacement" }],
        },
        {
          point: "Knee replacement has its own cap of ₹1,50,000 per joint, implant included, no matter how big the bill is.",
          impact: "hurts",
          citations: [{ chunkId: "p4-c2", quote: "Knee or hip replacement surgery is payable up to Rs 1,50,000 per joint, including the cost of the implant." }],
        },
        {
          point: "Because your father was 63 when the policy started, you pay 20% of every claim, applied after the cap.",
          impact: "hurts",
          citations: [
            { chunkId: "p4-c5", quote: "If the Insured Person was aged 61 years or above at the time of entering the Policy, a co-payment of 20% will apply to every admissible claim." },
            { chunkId: "p4-c8", quote: "Co-payment is applied on the admissible amount after applying sub-limits and proportionate deduction." },
          ],
        },
        {
          point: "The ₹4,000/day room is within the ₹5,000/day limit, so no proportionate deduction applies to other charges.",
          impact: "helps",
          citations: [{ chunkId: "p2-c2", quote: "For a Sum Insured of Rs 5,00,000 this means Rs 5,000 per day for a normal room and Rs 10,000 per day for ICU." }],
        },
      ],
      costRules: {
        excludedEntirely: false,
        sumInsured: 500000,
        subLimit: 150000,
        roomRentCapPerDay: 5000,
        proportionateDeduction: true,
        copays: [{ percent: 20, reason: "age 61+ at entry" }],
      },
      missingInfo: ["Was osteoarthritis diagnosed before the policy started? If so, the 36-month pre-existing disease wait applies instead."],
      nextSteps: [
        "Inform the insurer at least 48 hours before the planned admission.",
        "Ask the hospital for a package price; anything above ₹1,50,000 is yours to pay.",
        "Keep the room at or below ₹5,000/day to avoid proportionate deduction.",
      ],
    },
    grounding: [
      { chunkId: "p3-c6", quote: "joint replacement surgery including knee and hip replacement", status: "verified" },
      { chunkId: "p4-c2", quote: "Knee or hip replacement surgery is payable up to Rs 1,50,000 per joint, including the cost of the implant.", status: "verified" },
      { chunkId: "p4-c5", quote: "If the Insured Person was aged 61 years or above at the time of entering the Policy, a co-payment of 20% will apply to every admissible claim.", status: "verified" },
      { chunkId: "p4-c8", quote: "Co-payment is applied on the admissible amount after applying sub-limits and proportionate deduction.", status: "verified" },
      { chunkId: "p2-c2", quote: "For a Sum Insured of Rs 5,00,000 this means Rs 5,000 per day for a normal room and Rs 10,000 per day for ICU.", status: "verified" },
    ],
    estimate: {
      bill: 280000,
      payable: 120000,
      outOfPocket: 160000,
      steps: [
        { label: "Hospital bill", amountAfter: 280000 },
        { label: "Sub-limit for this treatment", amountAfter: 150000 },
        { label: "20% co-payment — age 61+ at entry", amountAfter: 120000 },
      ],
      caveat:
        "Estimate only. Proportionate deduction is applied to the whole bill, so it is a worst case (insurers exclude pharmacy, implants and diagnostics from it). Non-medical items (gloves, admission kits) are usually also deducted.",
    },
  };

  return { index, plan, retrieved, result, scenario: FIXTURE_SCENARIO };
}
