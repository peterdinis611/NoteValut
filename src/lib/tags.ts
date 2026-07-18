import { firstIssue, parseTags, TagSchema } from "@/lib/validation";
import * as v from "valibot";

/** Case-insensitive identity key for a tag. */
export function tagKey(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * Trim, strip leading `#`, collapse internal whitespace.
 * Returns empty string if nothing left.
 */
export function normalizeTag(input: string): string {
  return input
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type NormalizeTagsResult =
  | { success: true; tags: string[] }
  | { success: false; error: string };

/**
 * Normalize + validate a tag list.
 * Case-insensitive dedupe; keeps first occurrence casing.
 */
export function normalizeTags(input: unknown): NormalizeTagsResult {
  if (!Array.isArray(input)) {
    return { success: false, error: "Tags must be a list" };
  }

  const cleaned: string[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (typeof raw !== "string") {
      return { success: false, error: "Each tag must be a string" };
    }
    const tag = normalizeTag(raw);
    if (!tag) continue;

    const parsed = v.safeParse(TagSchema, tag);
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed) || "Invalid tag" };
    }

    const key = tagKey(parsed.output);
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(parsed.output);
  }

  if (cleaned.length > 24) {
    return { success: false, error: "Too many tags (max 24)" };
  }

  const checked = parseTags(cleaned);
  if (!checked.success) {
    return { success: false, error: firstIssue(checked) || "Invalid tags" };
  }

  return { success: true, tags: checked.output };
}

/** Merge a tag into an existing list (case-insensitive). */
export function addTagToList(tags: string[], raw: string): NormalizeTagsResult {
  return normalizeTags([...tags, normalizeTag(raw)]);
}

/** Remove a tag from a list (case-insensitive). */
export function removeTagFromList(tags: string[], raw: string): string[] {
  const key = tagKey(normalizeTag(raw));
  return tags.filter((t) => tagKey(t) !== key);
}

/** Rename one tag key across a list. */
export function renameTagInList(
  tags: string[],
  from: string,
  to: string,
): NormalizeTagsResult {
  const fromKey = tagKey(normalizeTag(from));
  const next = tags.map((t) => (tagKey(t) === fromKey ? normalizeTag(to) : t));
  return normalizeTags(next);
}

export { parseTags, firstIssue };
