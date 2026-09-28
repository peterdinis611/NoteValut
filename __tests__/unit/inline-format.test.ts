import { describe, expect, it } from "vitest";
import { parseInlineSegments, stripInlineMarks, wrapSelection } from "@/lib/inline-format";

describe("wrapSelection", () => {
  it("wraps selection in bold markers", () => {
    const result = wrapSelection("hello world", 6, 11, "bold");
    expect(result.text).toBe("hello **world**");
    expect(result.selectionStart).toBe(6);
    expect(result.selectionEnd).toBe(15);
  });

  it("unwraps when already bold", () => {
    const result = wrapSelection("hello **world**", 6, 15, "bold");
    expect(result.text).toBe("hello world");
  });

  it("inserts empty markers at caret", () => {
    const result = wrapSelection("ab", 1, 1, "code");
    expect(result.text).toBe("a``b");
    expect(result.selectionStart).toBe(2);
  });
});

describe("parseInlineSegments", () => {
  it("splits bold italic code and highlight", () => {
    const segs = parseInlineSegments("a **b** *c* `d` ==e==");
    expect(segs).toEqual([
      { type: "text", value: "a " },
      { type: "bold", value: "b" },
      { type: "text", value: " " },
      { type: "italic", value: "c" },
      { type: "text", value: " " },
      { type: "code", value: "d" },
      { type: "text", value: " " },
      { type: "highlight", value: "e" },
    ]);
  });
});

describe("stripInlineMarks", () => {
  it("removes markdown markers", () => {
    expect(stripInlineMarks("**Hello** *world* `x`")).toBe("Hello world x");
  });
});
