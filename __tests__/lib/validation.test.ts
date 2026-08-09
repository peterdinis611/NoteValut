import { describe, expect, it } from "vitest";
import { createBlock } from "@/lib/blocks";
import {
  firstIssue,
  parseBlocks,
  parseCoverImage,
  parseCustomBlock,
  parseTags,
  parseTemplateName,
} from "@/lib/validation";

describe("parseTemplateName", () => {
  it("trims and accepts valid names", () => {
    const result = parseTemplateName("  Checklist  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBe("Checklist");
  });

  it("rejects empty and oversized names", () => {
    expect(parseTemplateName("").success).toBe(false);
    expect(parseTemplateName("x".repeat(61)).success).toBe(false);
  });
});

describe("parseBlocks", () => {
  it("accepts a non-empty block list", () => {
    const result = parseBlocks([createBlock("paragraph", "Hi")]);
    expect(result.success).toBe(true);
  });

  it("rejects an empty list", () => {
    expect(parseBlocks([]).success).toBe(false);
  });

  it("rejects unknown block types", () => {
    const result = parseBlocks([
      { id: "1", type: "magic", text: "" },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("parseTags", () => {
  it("accepts valid tags", () => {
    const result = parseTags(["work", "planning"]);
    expect(result.success).toBe(true);
  });

  it("rejects tags with punctuation", () => {
    expect(parseTags(["nope!"]).success).toBe(false);
  });
});

describe("parseCoverImage / parseCustomBlock / firstIssue", () => {
  it("requires a valid cover URL", () => {
    expect(parseCoverImage("not-a-url").success).toBe(false);
    expect(parseCoverImage("https://example.com/a.png").success).toBe(true);
  });

  it("validates custom block label and body", () => {
    expect(parseCustomBlock({ label: "", body: "x" }).success).toBe(false);
    expect(parseCustomBlock({ label: "Snippet", body: "hello" }).success).toBe(true);
  });

  it("reads the first issue message", () => {
    const result = parseTemplateName("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssue(result)).toMatch(/required|too long|invalid/i);
    }
  });
});
