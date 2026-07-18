import type { Block } from "@/lib/blocks";
import { stripInlineMarks } from "@/lib/inline-format";

/** Flatten block content for full-text search indexing. */
export function blocksToSearchText(blocks: Block[] | undefined): string {
  if (!blocks?.length) return "";
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.text) parts.push(stripInlineMarks(b.text));
    if (b.label) parts.push(b.label);
    if (b.url) parts.push(b.url);
    if (b.rows) {
      for (const row of b.rows) {
        for (const cell of row) {
          if (cell) parts.push(cell);
        }
      }
    }
  }
  return parts.join("\n");
}

export function snippetAround(
  haystack: string,
  query: string,
  radius = 48,
): string | null {
  const h = haystack.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const idx = h.indexOf(q);
  if (idx < 0) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(haystack.length, idx + q.length + radius);
  let snip = haystack.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snip = `…${snip}`;
  if (end < haystack.length) snip = `${snip}…`;
  return snip;
}
