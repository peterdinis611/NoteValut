/** Shared tag helpers for Convex (mirrors src/lib/tags.ts rules). */

const TAG_RE = /^[\p{L}\p{N}][\p{L}\p{N}\s_-]*$/u;
const MAX_TAG_LEN = 32;
const MAX_TAGS = 24;

export function tagKey(tag: string): string {
  return tag.trim().toLowerCase();
}

export function normalizeTag(input: string): string {
  return input
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidTag(tag: string): boolean {
  return (
    tag.length >= 1 &&
    tag.length <= MAX_TAG_LEN &&
    TAG_RE.test(tag)
  );
}

/** Normalize, validate, dedupe. Throws on invalid input. */
export function assertTags(input: unknown): string[] {
  if (!Array.isArray(input)) {
    throw new Error("Tags must be a list");
  }

  const cleaned: string[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (typeof raw !== "string") {
      throw new Error("Each tag must be a string");
    }
    const tag = normalizeTag(raw);
    if (!tag) continue;
    if (!isValidTag(tag)) {
      throw new Error(
        `Invalid tag “${tag.slice(0, 24)}” — use letters, numbers, spaces, - or _`,
      );
    }
    const key = tagKey(tag);
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(tag);
  }

  if (cleaned.length > MAX_TAGS) {
    throw new Error(`Too many tags (max ${MAX_TAGS})`);
  }

  return cleaned;
}

export function mergeTag(tags: string[], raw: string): string[] {
  return assertTags([...tags, normalizeTag(raw)]);
}

export function removeTag(tags: string[], raw: string): string[] {
  const key = tagKey(normalizeTag(raw));
  return tags.filter((t) => tagKey(t) !== key);
}

export function renameTag(tags: string[], from: string, to: string): string[] {
  const fromKey = tagKey(normalizeTag(from));
  const nextName = normalizeTag(to);
  if (!nextName) throw new Error("New tag name is empty");
  const next = tags.map((t) => (tagKey(t) === fromKey ? nextName : t));
  return assertTags(next);
}
