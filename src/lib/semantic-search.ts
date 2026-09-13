import type { Doc } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";

export type SemanticHit = {
  note: Doc<"notes">;
  score: number;
};

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "with",
  "by",
  "from",
  "as",
  "it",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "we",
  "they",
  "my",
  "your",
  "our",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const n = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / n);
  return tf;
}

function noteText(note: Doc<"notes">): string {
  return [note.title, note.searchText, note.content, (note.tags ?? []).join(" ")]
    .filter(Boolean)
    .join("\n");
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  for (const [k, va] of a) {
    const vb = b.get(k);
    if (vb) dot += va * vb;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Client-side TF-IDF / bag-of-words cosine similarity over note text fields.
 */
export function semanticSearch(
  notes: Doc<"notes">[] | undefined,
  query: string,
  limit = 20,
): SemanticHit[] {
  const q = query.trim();
  if (!notes?.length || q.length < 2) return [];

  const qTokens = tokenize(q);
  if (!qTokens.length) return [];

  const corpus = notes.filter((n) => !isFolder(n) && !n.trashed);
  if (!corpus.length) return [];

  const docs = corpus.map((note) => {
    const tokens = tokenize(noteText(note));
    return { note, tokens, tf: termFreq(tokens) };
  });

  const df = new Map<string, number>();
  for (const doc of docs) {
    const seen = new Set(doc.tokens);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const N = docs.length;
  function idf(term: string) {
    const d = df.get(term) ?? 0;
    return Math.log((N + 1) / (d + 1)) + 1;
  }

  function tfidf(tf: Map<string, number>): Map<string, number> {
    const out = new Map<string, number>();
    for (const [t, f] of tf) out.set(t, f * idf(t));
    return out;
  }

  const qVec = tfidf(termFreq(qTokens));
  const scored: SemanticHit[] = [];

  for (const doc of docs) {
    const score = cosine(qVec, tfidf(doc.tf));
    if (score > 0.02) scored.push({ note: doc.note, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
