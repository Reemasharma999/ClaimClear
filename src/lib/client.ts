// Client-side types and helpers shared by the UI components.
import type { Answer, CitationCheck, Estimate, Facts, Triage } from "./pipeline";

export type Plan = { triage: Triage; facts: Facts; queries: { text: string; embedding: number[] }[]; droppedFacts: string[]; modelName: string; ref?: string };
export type Result = { answer: Answer; grounding: CitationCheck[]; estimate: Estimate; guardNotes: string[]; modelName: string; ref?: string };
export type Stage = "idle" | "planning" | "retrieving" | "answering" | "done";

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export async function post<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(70_000), // server gives up at ~55s; don't leave the user waiting forever
    });
  } catch (e) {
    const name = (e as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new Error("This is taking longer than expected. Please try again.");
    throw new Error(typeof navigator !== "undefined" && !navigator.onLine ? "You seem to be offline. Check your connection and try again." : "Couldn't reach ClaimClear. Check your connection and try again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json.error ?? `Request failed (${res.status}).`) + (json.ref ? ` (ref ${json.ref})` : ""));
  return json as T;
}

/** "4.2 Specific Waiting Period" → "§4.2"; falls back to the chunk id. */
export function clauseLabel(section: string | undefined, id: string) {
  const n = section?.match(/^(\d{1,2}(?:\.\d{1,2}){0,3})/)?.[1];
  return n ? `§${n}` : id;
}

// "__" is the placeholder the detail helpers insert. If the user typed next to it
// instead of over it ("19__ months"), the value is there: drop the marker.
// Also unwraps markdown-style _word_ emphasis people type by habit.
export function cleanBlanks(s: string) {
  return s
    .replace(/([\p{L}\p{N}])_{2,}|_{2,}(?=[\p{L}\p{N}])/gu, "$1")
    .replace(/(^|\s)_([^_\s][^_]*?)_(?=[\s.,;!?]|$)/gu, "$1$2");
}

/** Blanks still left empty after cleaning, with a little surrounding text so the user can find them. */
export function unfilledBlanks(s: string) {
  const text = cleanBlanks(s);
  return [...text.matchAll(/_{2,}/g)].map((m) => {
    const start = Math.max(0, m.index - 22);
    return (start > 0 ? "…" : "") + text.slice(start, m.index + m[0].length + 14).trim() + "…";
  });
}

// The details that decide most claims. Used for the completeness meter and the
// "add a detail" helpers, so users learn what matters without reading a form.
export const DETAILS = [
  { key: "treatment", label: "Treatment", test: /surgery|replacement|treatment|admitted|hospital|procedure|operation|delivery|fever|dengue|cataract|fracture|broke/i, stem: " The treatment is __." },
  { key: "age", label: "Policy age", test: /(\d+|one|two|three|four|five|six)\s*(months?|years?|yrs?)\s*(old|ago)|policy\s+(started|is|was).*\d/i, stem: " The policy is __ months old." },
  { key: "entry", label: "Age at purchase", test: /\b(was|aged?|at entry|when (we|i) bought)\b[^.]*\b\d{2}\b|\b\d{2}\s*(at entry|when)/i, stem: " I was __ years old when we bought the policy." },
  { key: "bill", label: "Estimated bill", test: /₹|\brs\.?\s?\d|\binr\b|lakh|\bbill\b/i, stem: " The estimated bill is ₹__." },
  { key: "room", label: "Room rent", test: /room/i, stem: " Room rent is ₹__ per day." },
  { key: "network", label: "Network hospital?", test: /network/i, stem: " It is a network hospital." },
  { key: "cause", label: "Accident or illness?", test: /accident|illness|injur|disease|pre-?existing|diagnos/i, stem: " This is due to an illness, not an accident." },
] as const;
