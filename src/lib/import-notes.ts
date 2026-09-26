import { createBlock, markdownToBlocks, type Block } from "@/lib/blocks";
import { normalizeTags } from "@/lib/tags";

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
  /** Relative paths inside ZIP that need upload remap */
  pendingAssets?: Array<{ path: string; blockId: string }>;
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

/** Extract wikilink targets before converting (for later remapping). */
export function extractWikilinkTargets(md: string): string[] {
  const targets: string[] = [];
  for (const m of md.matchAll(/!?\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)) {
    const t = m[1]?.trim();
    if (t) targets.push(t);
  }
  return targets;
}

/** Convert Obsidian wikilinks to markdown links; keep display names. */
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
  return (
    name
      .replace(/\.(md|markdown|txt)$/i, "")
      .replace(/^\d{8,14}[-_]?/, "")
      .replace(/[-_]+/g, " ")
      .trim() || "Untitled"
  );
}

function titleFromBody(body: string, fallback: string): string {
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return fallback;
}

function stripLeadingH1(body: string): string {
  return body.replace(/^#\s+.+\r?\n+/, "");
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*\/\s*/g, " ")
    .replace(/\.md$/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remap markdown/image links that point at other imported notes into live pagelink blocks.
 * Also rewrites image block URLs when `assetUrlByPath` has a match.
 */
export function remapImportLinks(
  drafts: ImportedNoteDraft[],
  assetUrlByPath?: Map<string, string>,
): ImportedNoteDraft[] {
  const byTitle = new Map<string, string>();
  for (const d of drafts) {
    byTitle.set(normalizeTitleKey(d.title), d.id);
    const leaf = d.title.split(" / ").pop();
    if (leaf) byTitle.set(normalizeTitleKey(leaf), d.id);
  }

  return drafts.map((draft) => {
    const nextBlocks: Block[] = [];
    for (const block of draft.blocks) {
      if (block.type === "image" && block.url && assetUrlByPath) {
        const mapped =
          assetUrlByPath.get(block.url) ||
          assetUrlByPath.get(block.url.replace(/^\.\//, "")) ||
          [...assetUrlByPath.entries()].find(([p]) => p.endsWith(block.url!))?.[1];
        if (mapped) {
          nextBlocks.push({ ...block, url: mapped });
          continue;
        }
      }

      // Paragraph (etc.) that is only a markdown link to another note → pagelink
      const onlyLink = block.text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (onlyLink && ["paragraph", "bullet", "numbered", "quote"].includes(block.type)) {
        const href = onlyLink[2]!.trim();
        if (!/^https?:\/\//i.test(href) && !href.startsWith("data:")) {
          const key = normalizeTitleKey(href.replace(/\.md$/i, ""));
          const targetId = byTitle.get(key);
          if (targetId && targetId !== draft.id) {
            nextBlocks.push(
              createBlock("pagelink", onlyLink[1]!.trim() || href, { pageId: targetId }),
            );
            continue;
          }
        }
      }

      // Inline [text](Note Title) → keep text, append pagelink if resolvable
      if (block.text.includes("](") && !/^https?:\/\//i.test(block.text)) {
        const links = [...block.text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
        let text = block.text;
        const extra: Block[] = [];
        for (const m of links) {
          const href = m[2]!.trim();
          if (/^https?:\/\//i.test(href) || href.startsWith("data:")) continue;
          const key = normalizeTitleKey(href.replace(/\.md$/i, ""));
          const targetId = byTitle.get(key);
          if (targetId && targetId !== draft.id) {
            text = text.replace(m[0], m[1]!);
            extra.push(createBlock("pagelink", m[1]!.trim() || href, { pageId: targetId }));
          }
        }
        nextBlocks.push({ ...block, text });
        nextBlocks.push(...extra);
        continue;
      }

      nextBlocks.push(block);
    }
    return { ...draft, blocks: nextBlocks.length ? nextBlocks : draft.blocks };
  });
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

  const tagsResult = normalizeTags(meta.tags ?? []);
  const tags = tagsResult.success ? tagsResult.tags : [];
  const icon = meta.icon?.trim() || "📝";

  const pendingAssets: Array<{ path: string; blockId: string }> = [];
  for (const b of blocks) {
    if ((b.type === "image" || b.type === "file" || b.type === "pdf") && b.url) {
      if (!/^https?:\/\//i.test(b.url) && !b.url.startsWith("data:")) {
        pendingAssets.push({ path: b.url, blockId: b.id });
      }
    }
  }

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
    pendingAssets: pendingAssets.length ? pendingAssets : undefined,
  };
}

export function detectImportSource(filenames: string[]): "markdown" | "obsidian" | "notion" {
  const joined = filenames.join(" ").toLowerCase();
  if (joined.includes("obsidian") || filenames.some((f) => f.includes(".obsidian"))) {
    return "obsidian";
  }
  if (joined.includes("notion")) return "notion";
  const uuidish = filenames.filter((f) => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(f)).length;
  if (uuidish >= 2) return "notion";
  return "markdown";
}

export async function importMarkdownFiles(
  files: FileList | File[],
  sourceHint?: "markdown" | "obsidian" | "notion",
): Promise<ImportedNoteDraft[]> {
  const list = [...files].filter(
    (f) =>
      /\.(md|markdown|txt)$/i.test(f.name) || f.type === "text/markdown" || f.type === "text/plain",
  );
  if (!list.length) throw new Error("No Markdown files found");

  const source = sourceHint ?? detectImportSource(list.map((f) => f.name));
  const drafts: ImportedNoteDraft[] = [];

  for (const file of list) {
    const raw = await file.text();
    drafts.push(markdownFileToDraft(file.name, raw, source));
  }

  return remapImportLinks(drafts);
}

export type ZipImportResult = {
  drafts: ImportedNoteDraft[];
  /** Binary assets keyed by zip-relative path */
  assets: Map<string, Blob>;
};

/**
 * Import a ZIP vault export with attachment extraction + wikilink remap.
 */
export async function importZipVault(file: File): Promise<ZipImportResult> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const allNames = Object.keys(zip.files).filter(
    (n) => !zip.files[n].dir && !n.startsWith("__MACOSX"),
  );
  const mdNames = allNames.filter((n) => /\.(md|markdown|txt)$/i.test(n));
  if (!mdNames.length) throw new Error("No Markdown files found in ZIP");

  const source = detectImportSource(allNames);
  const drafts: ImportedNoteDraft[] = [];
  const assets = new Map<string, Blob>();

  for (const path of allNames) {
    if (/\.(md|markdown|txt)$/i.test(path)) continue;
    if (!/\.(png|jpe?g|gif|webp|svg|pdf|mp4|webm|mov)$/i.test(path)) continue;
    const entry = zip.files[path];
    const blob = await entry.async("blob");
    assets.set(path, blob);
    const base = path.split("/").pop();
    if (base) assets.set(base, blob);
  }

  for (const path of mdNames.sort()) {
    const entry = zip.files[path];
    const raw = await entry.async("text");
    const base = path.split("/").pop() || path;
    const folderParts = path
      .split("/")
      .slice(0, -1)
      .filter((p) => p && p !== "." && !p.startsWith("__"));
    const draft = markdownFileToDraft(base, raw, source);
    if (folderParts.length) {
      draft.title = `${folderParts.join(" / ")} / ${draft.title}`;
    }
    drafts.push(draft);
  }

  return { drafts: remapImportLinks(drafts), assets };
}
