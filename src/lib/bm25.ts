// BM25: the keyword-search algorithm behind Elasticsearch and Lucene, in ~50 lines.
//
// score(doc, query) = Σ over query terms t of
//     IDF(t) * tf(t,doc) * (k1 + 1) / (tf(t,doc) + k1 * (1 - b + b * |doc| / avgDocLen))
//
// - IDF rewards rare words ("cataract") over common ones ("policy").
// - tf saturates (k1): a word appearing 10x isn't 10x more relevant than 1x.
// - b normalises for length so long clauses don't win just by being long.
//
// Why keep keyword search when we have embeddings? Embeddings blur exact terms.
// "Section 4.2", "co-payment", "PED" or a drug name are precise tokens that
// vector search often ranks below vaguely-similar text. Hybrid = both strengths.

const STOP = new Set(
  "a an and are as at be by for from has have if in into is it its of on or such that the their then there these this to was will with which shall any all under per our we you your not no".split(" "),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, " ")
    .split(/[\s-]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t)); // naive plural stemming
}

export class BM25 {
  private docs: string[][];
  private df = new Map<string, number>();
  private avgLen: number;

  constructor(texts: string[], private k1 = 1.2, private b = 0.75) {
    this.docs = texts.map(tokenize);
    for (const d of this.docs) for (const t of new Set(d)) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    this.avgLen = this.docs.reduce((s, d) => s + d.length, 0) / Math.max(1, this.docs.length);
  }

  private idf(t: string) {
    const n = this.docs.length;
    const df = this.df.get(t) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  /** Returns doc indices sorted by score (only docs that match at least one term). */
  search(query: string): { index: number; score: number }[] {
    const q = tokenize(query);
    const results: { index: number; score: number }[] = [];
    this.docs.forEach((doc, index) => {
      let score = 0;
      for (const t of q) {
        const tf = doc.filter((w) => w === t).length;
        if (!tf) continue;
        score += (this.idf(t) * tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + (this.b * doc.length) / this.avgLen));
      }
      if (score > 0) results.push({ index, score });
    });
    return results.sort((a, b) => b.score - a.score);
  }
}
