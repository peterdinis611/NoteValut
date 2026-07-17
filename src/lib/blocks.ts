export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bullet"
  | "todo"
  | "quote"
  | "code"
  | "divider"
  | "callout"
  | "pagelink";

export type CalloutVariant = "info" | "tip" | "warning";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  calloutVariant?: CalloutVariant;
  pageId?: string;
};

export type SlashCommand = {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
  calloutVariant?: CalloutVariant;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  { type: "paragraph", label: "Text", description: "Plain text block", icon: "¶", keywords: ["text", "paragraph"] },
  { type: "heading1", label: "Title", description: "Large heading", icon: "H1", keywords: ["h1", "title"] },
  { type: "heading2", label: "Section", description: "Section heading", icon: "H2", keywords: ["h2", "section"] },
  { type: "heading3", label: "Subsection", description: "Small heading", icon: "H3", keywords: ["h3"] },
  { type: "bullet", label: "List", description: "Bulleted list item", icon: "•", keywords: ["bullet", "list"] },
  { type: "todo", label: "Task", description: "Checkbox task", icon: "☐", keywords: ["todo", "task"] },
  { type: "quote", label: "Quote", description: "Highlighted quote", icon: "❝", keywords: ["quote"] },
  { type: "code", label: "Code", description: "Code snippet", icon: "</>", keywords: ["code"] },
  { type: "callout", label: "Info box", description: "Info callout", icon: "ℹ", keywords: ["callout", "info"], calloutVariant: "info" },
  { type: "callout", label: "Tip box", description: "Helpful tip", icon: "💡", keywords: ["tip", "hint"], calloutVariant: "tip" },
  { type: "callout", label: "Alert box", description: "Important warning", icon: "⚠", keywords: ["warning", "alert"], calloutVariant: "warning" },
  { type: "pagelink", label: "Vault link", description: "Link to another entry", icon: "🔗", keywords: ["link", "page", "entry"] },
  { type: "divider", label: "Divider", description: "Visual separator", icon: "—", keywords: ["divider", "line"] },
];

export const COVER_GRADIENTS = [
  { id: "", label: "None" },
  { id: "from-teal-600/35 to-emerald-500/20", label: "Teal" },
  { id: "from-violet-600/40 to-indigo-600/25", label: "Violet" },
  { id: "from-blue-600/40 to-cyan-500/25", label: "Ocean" },
  { id: "from-amber-500/35 to-orange-600/25", label: "Sunset" },
  { id: "from-rose-600/35 to-pink-500/25", label: "Rose" },
  { id: "from-slate-600/40 to-zinc-500/25", label: "Slate" },
];

export function createBlock(
  type: BlockType,
  text = "",
  extras?: Partial<Pick<Block, "checked" | "calloutVariant" | "pageId">>,
): Block {
  return {
    id: crypto.randomUUID(),
    type,
    text,
    ...extras,
    ...(type === "todo" && extras?.checked === undefined ? { checked: false } : {}),
    ...(type === "callout" && !extras?.calloutVariant ? { calloutVariant: "info" as const } : {}),
  };
}

export function defaultBlocks(): Block[] {
  return [createBlock("paragraph", "")];
}

export function migrateContentToBlocks(content: string): Block[] {
  if (!content.trim()) return defaultBlocks();

  const lines = content.split("\n");
  const blocks: Block[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) blocks.push(createBlock("heading3", line.slice(4)));
    else if (line.startsWith("## ")) blocks.push(createBlock("heading2", line.slice(3)));
    else if (line.startsWith("# ")) blocks.push(createBlock("heading1", line.slice(2)));
    else if (line.startsWith("- [ ] ")) blocks.push(createBlock("todo", line.slice(6), { checked: false }));
    else if (line.startsWith("- [x] ")) blocks.push(createBlock("todo", line.slice(6), { checked: true }));
    else if (line.startsWith("- ")) blocks.push(createBlock("bullet", line.slice(2)));
    else if (line.startsWith("> ")) blocks.push(createBlock("quote", line.slice(2)));
    else if (line === "---") blocks.push(createBlock("divider", ""));
    else blocks.push(createBlock("paragraph", line));
  }

  return blocks.length ? blocks : defaultBlocks();
}

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading1":
          return `# ${block.text}`;
        case "heading2":
          return `## ${block.text}`;
        case "heading3":
          return `### ${block.text}`;
        case "bullet":
          return `- ${block.text}`;
        case "todo":
          return `- [${block.checked ? "x" : " "}] ${block.text}`;
        case "quote":
          return `> ${block.text}`;
        case "callout":
          return `[${block.calloutVariant ?? "info"}] ${block.text}`;
        case "pagelink":
          return `→ ${block.text}`;
        case "code":
          return block.text;
        case "divider":
          return "---";
        default:
          return block.text;
      }
    })
    .join("\n");
}

export function notePreviewFromBlocks(blocks: Block[] | undefined, content: string, max = 80): string {
  const source = blocks?.length
    ? blocks
        .filter((b) => b.type !== "divider" && b.text.trim())
        .map((b) => b.text)
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

export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
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
