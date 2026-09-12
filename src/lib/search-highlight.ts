/** Highlight query tokens inside plain text for search UI. */

export function highlightMatches(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const q = query.trim();
  if (!q || !text) return [{ text, hit: false }];

  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/^[#@]/, "").trim())
    .filter((t) => t.length >= 2)
    .slice(0, 6);

  if (tokens.length === 0) return [{ text, hit: false }];

  const pattern = new RegExp(
    `(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );

  const parts: Array<{ text: string; hit: boolean }> = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push({ text: text.slice(last, idx), hit: false });
    parts.push({ text: match[0], hit: true });
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts.length ? parts : [{ text, hit: false }];
}

export type SearchFilters = {
  bareQuery: string;
  tags: string[];
  after?: string; // YYYY-MM-DD
  before?: string;
};

/** Parse `tag:foo after:2026-01-01 before:2026-12-31 rest of query`. */
export function parseSearchFilters(raw: string): SearchFilters {
  const tags: string[] = [];
  let after: string | undefined;
  let before: string | undefined;
  const rest: string[] = [];

  for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
    const tag = /^tag:(.+)$/i.exec(token);
    const a = /^after:(\d{4}-\d{2}-\d{2})$/i.exec(token);
    const b = /^before:(\d{4}-\d{2}-\d{2})$/i.exec(token);
    if (tag) tags.push(tag[1].toLowerCase());
    else if (a) after = a[1];
    else if (b) before = b[1];
    else rest.push(token);
  }

  return { bareQuery: rest.join(" "), tags, after, before };
}

export function noteMatchesFilters(
  note: { tags: string[]; updatedAt: number; dailyKey?: string },
  filters: SearchFilters,
): boolean {
  if (filters.tags.length) {
    const noteTags = note.tags.map((t) => t.toLowerCase());
    if (!filters.tags.every((t) => noteTags.includes(t))) return false;
  }
  const day =
    note.dailyKey ||
    (() => {
      const d = new Date(note.updatedAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    })();
  if (filters.after && day < filters.after) return false;
  if (filters.before && day > filters.before) return false;
  return true;
}
