import { describe, expect, it } from "vitest";
import { parseVaultMarkdown, renderVaultMarkdownHtml } from "@/lib/tanstack-markdown";

describe("TanStack Markdown", () => {
  it("parses headings and lists into an AST", () => {
    const doc = parseVaultMarkdown(`# Ship

- one
- two

**bold** text`);
    expect(doc.type).toBe("root");
    expect(doc.children[0]).toMatchObject({ type: "heading", depth: 1 });
    expect(doc.children.some((n) => n.type === "list")).toBe(true);
  });

  it("renders safe HTML and escapes raw script tags", () => {
    const html = renderVaultMarkdownHtml(`Hello **world**

<script>alert(1)</script>

[bad](javascript:alert(1))`);
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("javascript:alert");
  });

  it("highlights fenced code via TanStack Highlight bridge", () => {
    const html = renderVaultMarkdownHtml("```ts\nconst x: number = 1;\n```");
    expect(html).toMatch(/<pre|<code/);
    expect(html).toContain("const");
  });
});
