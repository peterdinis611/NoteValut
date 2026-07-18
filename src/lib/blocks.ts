export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "bullet"
  | "numbered"
  | "todo"
  | "quote"
  | "code"
  | "divider"
  | "callout"
  | "pagelink"
  | "toggle"
  | "image"
  | "custom"
  | "table"
  | "video"
  | "link"
  | "pdf";

export type CalloutVariant = "info" | "tip" | "warning";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  calloutVariant?: CalloutVariant;
  pageId?: string;
  language?: string;
  url?: string;
  label?: string;
  /** Table cells: rows × columns */
  rows?: string[][];
  /** Text accent color id from TEXT_COLORS */
  color?: string;
  /** Highlight background id from HIGHLIGHT_COLORS */
  bgColor?: string;
  /** Image width as % of editor content (20–100) */
  width?: number;
  /** Image horizontal alignment */
  align?: "left" | "center" | "right";
  /** Nesting level for lists / todos (0–5) */
  indent?: number;
  /** Todo due date (ms epoch) */
  dueAt?: number;
  /** Bookmarked within the page */
  pinned?: boolean;
  /** Shared id for column layout */
  layoutGroupId?: string;
  columnIndex?: number;
  columnCount?: number;
};

export type SlashCommand = {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
  calloutVariant?: CalloutVariant;
};

export const COVER_GRADIENTS = [
  { id: "", label: "None" },
  { id: "from-teal-600/35 to-emerald-500/20", label: "Teal" },
  { id: "from-violet-600/40 to-indigo-600/25", label: "Violet" },
  { id: "from-blue-600/40 to-cyan-500/25", label: "Ocean" },
  { id: "from-amber-500/35 to-orange-600/25", label: "Sunset" },
  { id: "from-rose-600/35 to-pink-500/25", label: "Rose" },
  { id: "from-slate-600/40 to-zinc-500/25", label: "Slate" },
];

export function emptyTable(rows = 3, cols = 3): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

export function createBlock(
  type: BlockType,
  text = "",
  extras?: Partial<
    Pick<
      Block,
      | "checked"
      | "calloutVariant"
      | "pageId"
      | "language"
      | "url"
      | "label"
      | "rows"
      | "color"
      | "bgColor"
      | "width"
      | "align"
      | "indent"
      | "dueAt"
      | "pinned"
      | "layoutGroupId"
      | "columnIndex"
      | "columnCount"
    >
  >,
): Block {
  return {
    id: crypto.randomUUID(),
    type,
    text,
    ...extras,
    ...(type === "todo" && extras?.checked === undefined ? { checked: false } : {}),
    ...(type === "toggle" && extras?.checked === undefined ? { checked: true } : {}),
    ...(type === "callout" && !extras?.calloutVariant ? { calloutVariant: "info" as const } : {}),
    ...(type === "code" && !extras?.language ? { language: "auto" } : {}),
    ...(type === "custom" && !extras?.label ? { label: "Custom block" } : {}),
    ...(type === "table" && !extras?.rows ? { rows: emptyTable() } : {}),
  };
}

export function defaultBlocks(): Block[] {
  return [createBlock("paragraph", "")];
}

export function migrateContentToBlocks(content: string): Block[] {
  return markdownToBlocks(content);
}

export function blocksToPlainText(blocks: Block[]): string {
  return blocksToMarkdown(blocks);
}

export function notePreviewFromBlocks(blocks: Block[] | undefined, content: string, max = 80): string {
  const source = blocks?.length
    ? blocks
        .filter((b) => b.type !== "divider" && b.type !== "table" && (b.text.trim() || b.url))
        .map((b) => b.text || b.label || b.url || "")
        .join(" ")
    : content;

  const trimmed = source.trim();
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function countOpenTasks(blocks: Block[] | undefined): number {
  return blocks?.filter((b) => b.type === "todo" && !b.checked).length ?? 0;
}

export function countOverdueTasks(blocks: Block[] | undefined, now = Date.now()): number {
  return (
    blocks?.filter(
      (b) => b.type === "todo" && !b.checked && b.dueAt !== undefined && b.dueAt < now,
    ).length ?? 0
  );
}

export const MAX_INDENT = 5;

export function clampIndent(n: number | undefined): number {
  if (!n || n < 0) return 0;
  return Math.min(MAX_INDENT, Math.floor(n));
}

export function filterSlashCommands(
  commands: { label: string; type: string; keywords: string[] }[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.type.includes(q) ||
      cmd.keywords.some((k) => k.includes(q)),
  );
}

export function parseSlashInput(text: string): { isSlash: boolean; query: string } {
  if (!text.startsWith("/")) return { isSlash: false, query: "" };
  return { isSlash: true, query: text.slice(1) };
}

export const CALLOUT_STYLES: Record<CalloutVariant, { icon: string; class: string }> = {
  info: { icon: "ℹ️", class: "callout-info" },
  tip: { icon: "💡", class: "callout-tip" },
  warning: { icon: "⚠️", class: "callout-warning" },
};

/** Convert markdown string into NoteVault blocks. */
export function markdownToBlocks(md: string): Block[] {
  if (!md.trim()) return defaultBlocks();

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "auto";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push(createBlock("code", codeLines.join("\n"), { language: lang || "auto" }));
      i += 1;
      continue;
    }

    if (/^\|(.+\|)+$/.test(line) && i + 1 < lines.length && /^\|?\s*[-:| ]+\|/.test(lines[i + 1])) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|(.+\|)+$/.test(lines[i])) {
        if (/^\|?\s*[-:| ]+\|/.test(lines[i])) {
          i += 1;
          continue;
        }
        const cells = lines[i]
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
        rows.push(cells);
        i += 1;
      }
      blocks.push(createBlock("table", "", { rows: rows.length ? rows : emptyTable() }));
      continue;
    }

    if (line.startsWith("###### ")) blocks.push(createBlock("heading6", line.slice(7)));
    else if (line.startsWith("##### ")) blocks.push(createBlock("heading5", line.slice(6)));
    else if (line.startsWith("#### ")) blocks.push(createBlock("heading4", line.slice(5)));
    else if (line.startsWith("### ")) blocks.push(createBlock("heading3", line.slice(4)));
    else if (line.startsWith("## ")) blocks.push(createBlock("heading2", line.slice(3)));
    else if (line.startsWith("# ")) blocks.push(createBlock("heading1", line.slice(2)));
    else if (line.startsWith("- [ ] ")) blocks.push(createBlock("todo", line.slice(6), { checked: false }));
    else if (line.startsWith("- [x] ") || line.startsWith("- [X] "))
      blocks.push(createBlock("todo", line.slice(6), { checked: true }));
    else if (line.startsWith("- ") || line.startsWith("* "))
      blocks.push(createBlock("bullet", line.slice(2)));
    else if (/^\d+\.\s/.test(line))
      blocks.push(createBlock("numbered", line.replace(/^\d+\.\s/, "")));
    else if (line.startsWith("> ")) blocks.push(createBlock("quote", line.slice(2)));
    else if (line === "---" || line === "***") blocks.push(createBlock("divider", ""));
    else if (/^!\[([^\]]*)\]\(([^)]+)\)/.test(line)) {
      const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (m) blocks.push(createBlock("image", m[1], { url: m[2] }));
    } else if (/^\[video\]\(([^)]+)\)$/i.test(line.trim())) {
      const m = line.trim().match(/^\[video\]\(([^)]+)\)$/i);
      if (m) blocks.push(createBlock("video", "", { url: m[1] }));
    } else if (/^\[pdf(?::([^\]]*))?\]\(([^)]+)\)$/i.test(line.trim())) {
      const m = line.trim().match(/^\[pdf(?::([^\]]*))?\]\(([^)]+)\)$/i);
      if (m) blocks.push(createBlock("pdf", m[1] || "", { url: m[2] }));
    } else if (/^\[([^\]]+)\]\(([^)]+)\)$/.test(line.trim())) {
      const m = line.trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) blocks.push(createBlock("link", m[1], { url: m[2], label: m[1] }));
    } else if (line.trim()) blocks.push(createBlock("paragraph", line));

    i += 1;
  }

  return blocks.length ? blocks : defaultBlocks();
}

/** Serialize blocks back to markdown. */
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading1":
          return `# ${block.text}`;
        case "heading2":
          return `## ${block.text}`;
        case "heading3":
          return `### ${block.text}`;
        case "heading4":
          return `#### ${block.text}`;
        case "heading5":
          return `##### ${block.text}`;
        case "heading6":
          return `###### ${block.text}`;
        case "bullet":
          return `- ${block.text}`;
        case "numbered":
          return `1. ${block.text}`;
        case "todo":
          return `- [${block.checked ? "x" : " "}] ${block.text}`;
        case "quote":
          return `> ${block.text}`;
        case "callout":
          return `> [!${block.calloutVariant ?? "info"}]\n> ${block.text}`;
        case "pagelink":
          return `→ ${block.text}`;
        case "code": {
          const lang = block.language && block.language !== "auto" ? block.language : "";
          return `\`\`\`${lang}\n${block.text}\n\`\`\``;
        }
        case "toggle":
          return `<details>\n<summary>${block.text.split("\n")[0]}</summary>\n\n${block.text.split("\n").slice(1).join("\n")}\n</details>`;
        case "image":
          return `![${block.text || "image"}](${block.url ?? ""})`;
        case "video":
          return `[video](${block.url ?? ""})`;
        case "pdf":
          return block.text.trim()
            ? `[pdf:${block.text}](${block.url ?? ""})`
            : `[pdf](${block.url ?? ""})`;
        case "link":
          return `[${block.label || block.text || "link"}](${block.url ?? ""})`;
        case "table": {
          const rows = block.rows?.length ? block.rows : emptyTable();
          const cols = Math.max(...rows.map((r) => r.length), 1);
          const norm = rows.map((r) => [...r, ...Array(Math.max(0, cols - r.length)).fill("")]);
          const header = `| ${norm[0].join(" | ")} |`;
          const sep = `| ${norm[0].map(() => "---").join(" | ")} |`;
          const body = norm.slice(1).map((r) => `| ${r.join(" | ")} |`);
          return [header, sep, ...body].join("\n");
        }
        case "custom":
          return `<!-- custom: ${block.label ?? "Custom"} -->\n${block.text}`;
        case "divider":
          return "---";
        default:
          return block.text;
      }
    })
    .join("\n\n");
}

/** Markdown-style shortcuts when user types at line start then Space. */
export function matchMarkdownShortcut(
  text: string,
): { type: BlockType; rest: string; extras?: Partial<Block> } | null {
  if (text === "# ") return { type: "heading1", rest: "" };
  if (text === "## ") return { type: "heading2", rest: "" };
  if (text === "### ") return { type: "heading3", rest: "" };
  if (text === "#### ") return { type: "heading4", rest: "" };
  if (text === "##### ") return { type: "heading5", rest: "" };
  if (text === "###### ") return { type: "heading6", rest: "" };
  if (text === "- " || text === "* ") return { type: "bullet", rest: "" };
  if (text === "[] " || text === "[ ] ") return { type: "todo", rest: "", extras: { checked: false } };
  if (text === "> ") return { type: "quote", rest: "" };
  if (text === "``` ") return { type: "code", rest: "", extras: { language: "auto" } };
  if (/^\d+\.\s$/.test(text)) return { type: "numbered", rest: "" };
  return null;
}

export { youtubeEmbedUrl, resolveVideoSource } from "@/lib/video";
export type { VideoProvider, VideoSource } from "@/lib/video";

