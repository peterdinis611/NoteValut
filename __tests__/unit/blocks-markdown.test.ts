import { describe, expect, it } from "vitest";
import {
  blocksToMarkdown,
  createBlock,
  markdownToBlocks,
} from "@/lib/blocks";

describe("markdownToBlocks", () => {
  it("parses headings, lists, todos, and paragraphs", () => {
    const md = `# Title
## Section
- bullet
- [ ] open
- [x] done
1. first
Plain line`;
    const blocks = markdownToBlocks(md);
    expect(blocks.map((b) => b.type)).toEqual([
      "heading1",
      "heading2",
      "bullet",
      "todo",
      "todo",
      "numbered",
      "paragraph",
    ]);
    expect(blocks.find((b) => b.type === "todo" && b.checked)?.text).toBe("done");
  });

  it("parses fenced code blocks", () => {
    const md = "```ts\nconst x = 1;\n```";
    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.type).toBe("code");
    expect(blocks[0]!.language).toBe("ts");
    expect(blocks[0]!.text).toContain("const x");
  });

  it("returns default block for empty input", () => {
    const blocks = markdownToBlocks("   ");
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0]!.type).toBe("paragraph");
  });
});

describe("blocksToMarkdown", () => {
  it("round-trips common block types", () => {
    const blocks = [
      createBlock("heading1", "Hello"),
      createBlock("paragraph", "World"),
      createBlock("todo", "Ship it", { checked: false }),
      createBlock("bullet", "One"),
    ];
    const md = blocksToMarkdown(blocks);
    expect(md).toContain("# Hello");
    expect(md).toContain("World");
    expect(md).toContain("- [ ] Ship it");
    expect(md).toContain("- One");

    const again = markdownToBlocks(md);
    expect(again.map((b) => b.type)).toEqual(["heading1", "paragraph", "todo", "bullet"]);
  });
});
