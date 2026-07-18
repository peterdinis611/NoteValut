import {
  createBlock,
  markdownToBlocks,
  type Block,
} from "@/lib/blocks";

export type ImportedNoteDraft = {
  id: string;
  title: string;
  content: string;
  blocks: Block[];
  icon: string;
  tags: string[];
  parentId: string | null;
  kind: "page";
  pinned: boolean;
  archived: boolean;
  updatedAt: number;
};

type Frontmatter = {
  title?: string;
  tags?: string[];
  icon?: string;
};

function newImportId() {
  return crypto.randomUUID();
}

/** Strip YAML frontmatter (Obsidian / some Notion exports). */
export function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const yaml = match[1];
  const body = match[2];
  const meta: Frontmatter = {};

  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key === "title") meta.title = value;
    else if (key === "icon" || key === "emoji") meta.icon = value;
    else if (key === "tags" || key === "tag") {
      if (value.startsWith("[") && value.endsWith("]")) {
        meta.tags = value
          .slice(1, -1)
          .split(",")
          .map((t) => t.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (value) {
        meta.tags = value.split(/[,\s]+/).filter(Boolean);
      }
    }
  }

  return { meta, body };
}

/** Convert Obsidian wikilinks to markdown-ish text; keep display names. */
export function convertWikilinks(md: string): string {
  return md
    .replace(/!\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_m, path: string, alias?: string) => {
      const name = (alias || path).trim();
      return `![${name}](${path.trim()})`;
    })
    .replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_m, path: string, alias?: string) => {
      const name = (alias || path).trim();
      return `[${name}](${path.trim()})`;
    });
}

/** Notion-ish callouts: > [!NOTE] title */
export function normalizeNotionMarkdown(md: string): string {
  return md
    .replace(/^> \[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/gim, (_m, kind: string) => {
      const map: Record<string, string> = {
        NOTE: "> [!info] ",
        TIP: "> [!tip] ",
        WARNING: "> [!warning] ",
        IMPORTANT: "> [!warning] ",
        CAUTION: "> [!warning] ",
      };
      return map[kind.toUpperCase()] ?? "> [!info] ";
    })
    .replace(/\n?\s*<aside>\s*/gi, "\n> ")
    .replace(/\s*<\/aside>\s*/gi, "\n");
}

function titleFromFilename(name: string): string {
  return name
    .replace(/\.(md|markdown|txt)$/i, "")
    .replace(/^\d{8,14}[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Untitled";
}

function titleFromBody(body: string, fallback: string): string {
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return fallback;
}

function stripLeadingH1(body: string): string {
  return body.replace(/^#\s+.+\r?\n+/, "");
}

export function markdownFileToDraft(
  filename: string,
  raw: string,
  source: "markdown" | "obsidian" | "notion" = "markdown",
): ImportedNoteDraft {
  let text = raw.replace(/^\uFEFF/, "");
  const { meta, body: afterFm } = parseFrontmatter(text);
  text = afterFm;

  if (source === "obsidian") text = convertWikilinks(text);
  if (source === "notion") text = normalizeNotionMarkdown(convertWikilinks(text));

  const fromFile = titleFromFilename(filename);
  const title = meta.title?.trim() || titleFromBody(text, fromFile);
  const body = stripLeadingH1(text);
  let blocks = markdownToBlocks(body);
  if (!blocks.length) blocks = [createBlock("paragraph", "")];

  const tags = meta.tags ?? [];
  const icon = meta.icon?.trim() || "📝";

  return {
    id: newImportId(),
    title,
    content: body,
    blocks,
    icon,
    tags,
    parentId: null,
    kind: "page",
    pinned: false,
    archived: false,
    updatedAt: Date.now(),
  };
}

export function detectImportSource(
  filenames: string[],
): "markdown" | "obsidian" | "notion" {
  const joined = filenames.join(" ").toLowerCase();
  if (joined.includes("obsidian") || filenames.some((f) => f.includes(".obsidian"))) {
    return "obsidian";
  }
  if (joined.includes("notion")) return "notion";
  // Heuristic: many exports with UUID-ish names → Notion
  const uuidish = filenames.filter((f) =>
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(f),
  ).length;
  if (uuidish >= 2) return "notion";
  return "markdown";
}

export async function importMarkdownFiles(
  files: FileList | File[],
  sourceHint?: "markdown" | "obsidian" | "notion",
): Promise<ImportedNoteDraft[]> {
  const list = [...files].filter((f) =>
    /\.(md|markdown|txt)$/i.test(f.name) || f.type === "text/markdown" || f.type === "text/plain",
  );
  if (!list.length) throw new Error("No Markdown files found");

  const source = sourceHint ?? detectImportSource(list.map((f) => f.name));
  const drafts: ImportedNoteDraft[] = [];

  for (const file of list) {
    const raw = await file.text();
    drafts.push(markdownFileToDraft(file.name, raw, source));
  }

  return drafts;
}
