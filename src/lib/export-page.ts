import { blocksToMarkdown, type Block } from "@/lib/blocks";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>");
}

function blockToHtml(block: Block): string {
  const t = inlineToHtml(block.text || "");
  switch (block.type) {
    case "heading1":
      return `<h1>${t}</h1>`;
    case "heading2":
      return `<h2>${t}</h2>`;
    case "heading3":
      return `<h3>${t}</h3>`;
    case "heading4":
      return `<h4>${t}</h4>`;
    case "heading5":
      return `<h5>${t}</h5>`;
    case "heading6":
      return `<h6>${t}</h6>`;
    case "bullet":
      return `<li>${t}</li>`;
    case "numbered":
      return `<li>${t}</li>`;
    case "todo":
      return `<p class="todo">${block.checked ? "☑" : "☐"} ${t}</p>`;
    case "quote":
    case "callout":
      return `<blockquote>${t}</blockquote>`;
    case "code":
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    case "divider":
      return `<hr/>`;
    case "image":
      return block.url
        ? `<figure><img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.text || "")}"/><figcaption>${t}</figcaption></figure>`
        : "";
    case "table":
      if (!block.rows?.length) return "";
      return `<table>${block.rows
        .map(
          (row) =>
            `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
        )
        .join("")}</table>`;
    case "pagelink":
      return `<p class="link">→ ${t}</p>`;
    default:
      return t ? `<p>${t}</p>` : "";
  }
}

function blocksToPrintHtml(blocks: Block[]): string {
  const parts: string[] = [];
  let listBuf: string[] = [];
  let listTag: "ul" | "ol" | null = null;

  function flushList() {
    if (listTag && listBuf.length) {
      parts.push(`<${listTag}>${listBuf.join("")}</${listTag}>`);
    }
    listBuf = [];
    listTag = null;
  }

  for (const b of blocks) {
    if (b.type === "bullet") {
      if (listTag && listTag !== "ul") flushList();
      listTag = "ul";
      listBuf.push(blockToHtml(b));
      continue;
    }
    if (b.type === "numbered") {
      if (listTag && listTag !== "ol") flushList();
      listTag = "ol";
      listBuf.push(blockToHtml(b));
      continue;
    }
    flushList();
    const html = blockToHtml(b);
    if (html) parts.push(html);
  }
  flushList();
  return parts.join("\n");
}

/** Download page as Markdown file. */
export function downloadPageMarkdown(title: string, blocks: Block[]) {
  const md = `# ${title || "Untitled"}\n\n${blocksToMarkdown(blocks)}`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(title || "untitled").replace(/[^\w\-]+/g, "-").toLowerCase() || "untitled"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open a print dialog so the user can “Save as PDF”.
 * Uses a temporary window with print-friendly HTML.
 */
export function exportPagePdf(title: string, icon: string, blocks: Block[]) {
  const body = blocksToPrintHtml(blocks);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title || "Untitled")}</title>
  <style>
    @page { margin: 1.6cm; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #111;
      line-height: 1.55;
      max-width: 42rem;
      margin: 0 auto;
      padding: 1.5rem;
    }
    h1,h2,h3,h4,h5,h6 { font-family: system-ui, sans-serif; line-height: 1.25; }
    h1.doc-title { font-size: 1.85rem; margin: 0 0 1.25rem; }
    h1 { font-size: 1.5rem; } h2 { font-size: 1.25rem; } h3 { font-size: 1.1rem; }
    pre { background: #f4f4f5; padding: 0.75rem 1rem; border-radius: 0.4rem; overflow: auto; font-size: 0.85rem; }
    code { font-family: ui-monospace, monospace; font-size: 0.9em; }
    blockquote { border-left: 3px solid #94a3b8; margin: 0.75rem 0; padding: 0.25rem 0 0.25rem 0.85rem; color: #334155; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
    td { border: 1px solid #cbd5e1; padding: 0.35rem 0.5rem; }
    hr { border: none; border-top: 1px solid #cbd5e1; margin: 1.25rem 0; }
    .todo { font-family: system-ui, sans-serif; }
    .link { color: #0f766e; }
    mark { background: #fde68a; }
  </style>
</head>
<body>
  <h1 class="doc-title">${escapeHtml(icon ? `${icon} ` : "")}${escapeHtml(title || "Untitled")}</h1>
  ${body}
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 120);
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) throw new Error("Pop-up blocked — allow pop-ups to export PDF");
  win.document.open();
  win.document.write(html);
  win.document.close();
}
