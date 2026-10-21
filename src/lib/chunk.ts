import type { Chunk, Page } from "./types";

// Policy wordings are organised as numbered clauses ("4.2 Specific Waiting Period")
// or ALL-CAPS section titles ("EXCLUSIONS"). We split on those so a chunk never
// mixes two unrelated clauses — a waiting-period rule glued to an exclusion is
// exactly the kind of chunk that makes a RAG system give a wrong answer.
const HEADING =
  /^(?:(?:section|clause|part)\s+[\dA-Z]+[.:)]?\s+.+|\d{1,2}(?:\.\d{1,2}){0,3}[.)]?\s+[A-Z][^.]{2,80}|[A-Z][A-Z &/,()-]{4,60})$/i;

const TARGET_CHARS = 900; // ~200 tokens: small enough to be precise, big enough to hold a full clause
const MAX_CHARS = 1400;

function isHeading(line: string) {
  const l = line.trim();
  if (l.length < 4 || l.length > 90) return false;
  if (/[.;:,]$/.test(l) && !/^\d/.test(l)) return false; // sentences end with punctuation
  return HEADING.test(l);
}

/**
 * Heading-aware chunking with "contextual chunk headers".
 *
 * Anthropic's Contextual Retrieval prepends an LLM-written summary to each chunk.
 * That costs one LLM call per chunk, which a free-tier API can't afford at upload
 * time. We get most of the benefit for free by prepending the document title and
 * the clause heading the chunk lives under — the same "where am I in the document"
 * signal, generated deterministically.
 */
export function chunkPages(pages: Page[], title: string): Chunk[] {
  const chunks: Chunk[] = [];
  let section = "Preamble";

  for (const { page, text } of pages) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      // Some PDFs come out as one giant line per page; fall back to sentence splits.
      .flatMap((l) => (l.length > 400 ? l.split(/(?<=[.;])\s+(?=[A-Z0-9(])/) : [l]))
      .filter(Boolean);
    let buf: string[] = [];
    let n = 0;

    const flush = () => {
      const body = buf.join("\n").trim();
      buf = [];
      if (body.length < 40) return; // drop page furniture (page numbers, footers)
      chunks.push({
        id: `p${page}-c${++n}`,
        page,
        section,
        text: body,
        indexText: `${title} > ${section} (page ${page})\n${body}`,
      });
    };

    for (const line of lines) {
      if (isHeading(line)) {
        flush();
        section = line;
        buf.push(line);
        continue;
      }
      const size = buf.join("\n").length;
      if (size + line.length > MAX_CHARS || (size > TARGET_CHARS && /[.;:]$/.test(buf.at(-1) ?? ""))) {
        flush();
      }
      buf.push(line);
    }
    flush();
  }
  return chunks;
}

/** Section number at the start of a heading, e.g. "4.2" — used by the eval harness. */
export function sectionNumber(section: string) {
  return section.match(/^(\d{1,2}(?:\.\d{1,2}){0,3})/)?.[1] ?? null;
}
