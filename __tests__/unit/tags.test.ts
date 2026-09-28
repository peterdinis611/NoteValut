import { describe, expect, it } from "vitest";
import {
  addTagToList,
  normalizeTag,
  normalizeTags,
  removeTagFromList,
  tagKey,
} from "@/lib/tags";

describe("tags", () => {
  it("normalizes and lowercases keys", () => {
    expect(normalizeTag("  Work ")).toBe("Work");
    expect(normalizeTag("##inbox")).toBe("inbox");
    expect(tagKey("Work")).toBe("work");
  });

  it("returns empty for blank input", () => {
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag("   ")).toBe("");
  });

  it("adds and removes without duplicates", () => {
    const add1 = addTagToList([], "alpha");
    expect(add1.success).toBe(true);
    if (!add1.success) return;
    const add2 = addTagToList(add1.tags, "Alpha");
    expect(add2.success).toBe(true);
    if (!add2.success) return;
    expect(add2.tags).toEqual(["alpha"]);

    const removed = removeTagFromList(add2.tags, "alpha");
    expect(removed).toEqual([]);
  });

  it("normalizes a list of tags with dedupe", () => {
    const result = normalizeTags(["One", "two", "ONE"]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.tags).toEqual(["One", "two"]);
  });
});
