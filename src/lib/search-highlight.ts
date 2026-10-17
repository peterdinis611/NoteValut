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
  status?: string;
  /** Folder / collection id */
  folderId?: string;
  /** `me` or Clerk user id */
  assignee?: string;
  after?: string; // YYYY-MM-DD
  before?: string;
};

/** Serialize filters back into the query string (bare + tokens). */
export function formatSearchFilters(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.bareQuery.trim()) parts.push(filters.bareQuery.trim());
  for (const t of filters.tags) parts.push(`tag:${t}`);
  if (filters.status) parts.push(`status:${filters.status}`);
  if (filters.folderId) parts.push(`folder:${filters.folderId}`);
  if (filters.assignee) parts.push(`assignee:${filters.assignee}`);
  if (filters.after) parts.push(`after:${filters.after}`);
  if (filters.before) parts.push(`before:${filters.before}`);
  return parts.join(" ");
}

/**
 * Parse `tag:foo status:Todo folder:xyz assignee:me after:2026-01-01 rest`.
 * Also accepts `#tag` as a tag token when alone.
 */
export function parseSearchFilters(raw: string): SearchFilters {
  const tags: string[] = [];
  let status: string | undefined;
  let folderId: string | undefined;
  let assignee: string | undefined;
  let after: string | undefined;
  let before: string | undefined;
  const rest: string[] = [];

  for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
    const tag = /^tag:(.+)$/i.exec(token) || /^#(.+)$/.exec(token);
    const st = /^status:(.+)$/i.exec(token);
    const folder = /^(?:folder|in|parent):(.+)$/i.exec(token);
    const asg = /^assignee:(.+)$/i.exec(token);
    const a = /^after:(\d{4}-\d{2}-\d{2})$/i.exec(token);
    const b = /^before:(\d{4}-\d{2}-\d{2})$/i.exec(token);
    if (tag) tags.push(tag[1].toLowerCase());
    else if (st) status = st[1];
    else if (folder) folderId = folder[1];
    else if (asg) assignee = asg[1];
    else if (a) after = a[1];
    else if (b) before = b[1];
    else rest.push(token);
  }

  return {
    bareQuery: rest.join(" "),
    tags,
    status,
    folderId,
    assignee,
    after,
    before,
  };
}

export function noteMatchesFilters(
  note: {
    tags: string[];
    updatedAt: number;
    dailyKey?: string;
    status?: string | null;
    parentId?: string | null;
    properties?: Record<string, unknown> | null;
  },
  filters: SearchFilters,
  opts?: { ownerId?: string },
): boolean {
  if (filters.tags.length) {
    const noteTags = note.tags.map((t) => t.toLowerCase());
    if (!filters.tags.every((t) => noteTags.includes(t))) return false;
  }
  if (filters.status) {
    const want = filters.status.toLowerCase();
    const have = (note.status || "").toLowerCase();
    if (want === "none" || want === "empty") {
      if (have) return false;
    } else if (have !== want) {
      return false;
    }
  }
  if (filters.folderId && String(note.parentId ?? "") !== filters.folderId) {
    return false;
  }
  if (filters.assignee) {
    const raw = note.properties?.assignee;
    const have = raw == null ? "" : String(raw);
    const want =
      filters.assignee === "me" && opts?.ownerId ? opts.ownerId : filters.assignee;
    if (have !== want) return false;
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

export function hasActiveFacets(filters: SearchFilters): boolean {
  return Boolean(
    filters.tags.length ||
      filters.status ||
      filters.folderId ||
      filters.assignee ||
      filters.after ||
      filters.before,
  );
}
