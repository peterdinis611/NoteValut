import { describe, expect, it } from "vitest";
import {
  addTagToList,
  normalizeTag,
  normalizeTags,
  removeTagFromList,
  renameTagInList,
  tagKey,
} from "@/lib/tags";

describe("tagKey / normalizeTag", () => {
  it("lowercases keys", () => {
    expect(tagKey("  Work ")).toBe("work");
  });

  it("strips leading hashes and collapses whitespace", () => {
    expect(normalizeTag("  ##team   planning  ")).toBe("team planning");
    expect(normalizeTag("###")).toBe("");
  });
});

describe("normalizeTags", () => {
  it("rejects non-arrays", () => {
    expect(normalizeTags("work")).toEqual({
      success: false,
      error: "Tags must be a list",
    });
  });

  it("rejects non-string entries", () => {
    expect(normalizeTags(["ok", 1 as unknown as string])).toEqual({
      success: false,
      error: "Each tag must be a string",
    });
  });

  it("dedupes case-insensitively and keeps first casing", () => {
    const result = normalizeTags(["Work", "work", "planning"]);
    expect(result).toEqual({ success: true, tags: ["Work", "planning"] });
  });

  it("skips empty tokens after normalize", () => {
    const result = normalizeTags(["", "  ", "#", "ok"]);
    expect(result).toEqual({ success: true, tags: ["ok"] });
  });

  it("rejects invalid characters", () => {
    const result = normalizeTags(["good!", "ok"]);
    expect(result.success).toBe(false);
  });

  it("rejects more than 24 tags", () => {
    const tags = Array.from({ length: 25 }, (_, i) => `tag${i}`);
    const result = normalizeTags(tags);
    expect(result).toEqual({
      success: false,
      error: "Too many tags (max 24)",
    });
  });
});

describe("add / remove / rename", () => {
  it("adds a tag", () => {
    expect(addTagToList(["a"], "B")).toEqual({ success: true, tags: ["a", "B"] });
  });

  it("removes by case-insensitive key", () => {
    expect(removeTagFromList(["Alpha", "Beta"], "alpha")).toEqual(["Beta"]);
  });

  it("renames a tag key", () => {
    expect(renameTagInList(["old", "keep"], "OLD", "new")).toEqual({
      success: true,
      tags: ["new", "keep"],
    });
  });
});
