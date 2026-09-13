import type { JSONContent } from "@tiptap/core";
import {
  clampIndent,
  createBlock,
  defaultBlocks,
  emptyTable,
  type Block,
  type BlockType,
} from "@/lib/blocks";
import { parseInlineSegments } from "@/lib/inline-format";
import { StarterKit } from "../extensions";
import { getExtensionForType } from "../create-extension";

const LIST_TYPES = new Set<BlockType>(["bullet", "numbered", "todo"]);

export function isVaultAtomType(type: BlockType): boolean {
  return type !== "divider" && !!getExtensionForType(StarterKit, type)?.atom;
}

export function blocksToTiptapDoc(blocks: Block[]): JSONContent {
  const source = blocks.length ? blocks : defaultBlocks();
  const content: JSONContent[] = [];
  let i = 0;
  while (i < source.length) {
    const block = source[i]!;
    if (LIST_TYPES.has(block.type)) {
      const kind = block.type as "bullet" | "numbered" | "todo";
      const items: Block[] = [];
      while (i < source.length && source[i]?.type === kind) {
        items.push(source[i]!);
        i += 1;
      }
      content.push(buildNestedList(kind, items, 0));
      continue;
    }
    content.push(blockToNode(block));
    i += 1;
  }
  return { type: "doc", content: content.length ? content : [emptyParagraph()] };
}

export function tiptapDocToBlocks(doc: JSONContent | null | undefined): Block[] {
  const nodes = doc?.type === "doc" ? (doc.content ?? []) : doc?.content ? [doc] : [];
  const blocks = nodes.flatMap((node) => nodeToBlocks(node, 0));
  return blocks.length ? blocks : defaultBlocks();
}

function blockToNode(block: Block): JSONContent {
  const meta = metaAttrs(block);
  const inline = textToInline(block.text);

  if (isVaultAtomType(block.type)) {
    return {
      type: "vaultAtom",
      attrs: { id: block.id, payload: JSON.stringify(block) },
    };
  }

  switch (block.type) {
    case "heading1":
    case "heading2":
    case "heading3":
    case "heading4":
    case "heading5":
    case "heading6":
      return {
        type: "heading",
        attrs: { ...meta, level: Number(block.type.slice(-1)) },
        content: inline,
      };
    case "quote":
      return {
        type: "blockquote",
        attrs: meta,
        content: [{ type: "paragraph", content: inline }],
      };
    case "code":
      return {
        type: "codeBlock",
        attrs: {
          ...meta,
          language: !block.language || block.language === "auto" ? null : block.language,
        },
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    case "divider":
      return { type: "horizontalRule", attrs: meta };
    default:
      return { type: "paragraph", attrs: meta, content: inline };
  }
}

function buildNestedList(kind: "bullet" | "numbered" | "todo", items: Block[], minIndent: number): JSONContent {
  const content: JSONContent[] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i]!;
    const indent = clampIndent(item.indent);
    if (indent < minIndent) break;
    if (indent > minIndent) {
      content.push(...(buildNestedList(kind, items.slice(i), indent).content ?? []));
      break;
    }
    i += 1;
    const nested: Block[] = [];
    while (i < items.length && clampIndent(items[i]?.indent) > indent) {
      nested.push(items[i]!);
      i += 1;
    }
    const paragraph: JSONContent = {
      type: "paragraph",
      content: textToInline(item.text),
    };
    const children: JSONContent[] = [paragraph];
    if (nested.length) children.push(buildNestedList(kind, nested, indent + 1));
    content.push(listItemNode(kind, item, children));
  }
  return { type: listNodeName(kind), content };
}

function listNodeName(kind: "bullet" | "numbered" | "todo") {
  if (kind === "todo") return "taskList";
  if (kind === "numbered") return "orderedList";
  return "bulletList";
}

function listItemNode(kind: "bullet" | "numbered" | "todo", block: Block, content: JSONContent[]): JSONContent {
  if (kind === "todo") {
    return {
      type: "taskItem",
      attrs: {
        ...metaAttrs(block),
        checked: !!block.checked,
        dueAt: block.dueAt ?? null,
      },
      content,
    };
  }
  return { type: "listItem", attrs: metaAttrs(block), content };
}

function nodeToBlocks(node: JSONContent, indent: number): Block[] {
  const type = node.type ?? "";
  switch (type) {
    case "paragraph":
      return [withMeta(createBlock("paragraph", inlineToText(node.content)), node.attrs)];
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1))) as 1 | 2 | 3 | 4 | 5 | 6;
      return [
        withMeta(createBlock(`heading${level}`, inlineToText(node.content)), node.attrs),
      ];
    }
    case "blockquote":
      return (node.content ?? []).flatMap((child) => {
        if (child.type === "paragraph") {
          return [withMeta(createBlock("quote", inlineToText(child.content)), node.attrs)];
        }
        return nodeToBlocks(child, indent);
      });
    case "codeBlock":
      return [
        withMeta(
          createBlock("code", codeText(node), {
            language: node.attrs?.language || "auto",
          }),
          node.attrs,
        ),
      ];
    case "horizontalRule":
      return [withMeta(createBlock("divider"), node.attrs)];
    case "bulletList":
      return flattenList(node, "bullet", indent);
    case "orderedList":
      return flattenList(node, "numbered", indent);
    case "taskList":
      return flattenList(node, "todo", indent);
    case "vaultAtom":
      return [parseAtom(node.attrs?.payload, node.attrs?.id)];
    default:
      if (node.content?.length) return node.content.flatMap((child) => nodeToBlocks(child, indent));
      return [];
  }
}

function flattenList(node: JSONContent, kind: "bullet" | "numbered" | "todo", indent: number): Block[] {
  const blocks: Block[] = [];
  for (const item of node.content ?? []) {
    const children = item.content ?? [];
    const paragraph = children.find((child) => child.type === "paragraph");
    const nested = children.filter((child) => child.type !== "paragraph");
    const text = inlineToText(paragraph?.content);
    const extras =
      kind === "todo"
        ? { checked: !!item.attrs?.checked, dueAt: item.attrs?.dueAt ?? undefined, indent }
        : { indent };
    const block = withMeta(createBlock(kind, text, extras), item.attrs ?? paragraph?.attrs);
    blocks.push(block);
    for (const child of nested) {
      blocks.push(...nodeToBlocks(child, indent + 1));
    }
  }
  return blocks;
}

function parseAtom(payload: unknown, fallbackId?: string): Block {
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as Block;
      if (parsed && typeof parsed === "object" && parsed.type) {
        return { ...createBlock("paragraph"), ...parsed, id: parsed.id || fallbackId || crypto.randomUUID() };
      }
    } catch {
      /* fall through */
    }
  }
  if (payload && typeof payload === "object" && "type" in (payload as Block)) {
    const parsed = payload as Block;
    return { ...createBlock("paragraph"), ...parsed, id: parsed.id || fallbackId || crypto.randomUUID() };
  }
  return withMeta(createBlock("paragraph"), { id: fallbackId });
}

function metaAttrs(block: Block) {
  return {
    id: block.id,
    color: block.color ?? null,
    bgColor: block.bgColor ?? null,
    pinned: block.pinned ?? false,
    layoutGroupId: block.layoutGroupId ?? null,
    columnIndex: block.columnIndex ?? null,
    columnCount: block.columnCount ?? null,
  };
}

function withMeta(block: Block, attrs?: Record<string, unknown> | null): Block {
  const id = typeof attrs?.id === "string" && attrs.id ? attrs.id : block.id;
  return {
    ...block,
    id,
    color: (attrs?.color as string | undefined) || undefined,
    bgColor: (attrs?.bgColor as string | undefined) || undefined,
    pinned: attrs?.pinned ? true : undefined,
    layoutGroupId: (attrs?.layoutGroupId as string | undefined) || undefined,
    columnIndex: typeof attrs?.columnIndex === "number" ? attrs.columnIndex : undefined,
    columnCount: typeof attrs?.columnCount === "number" ? attrs.columnCount : undefined,
    dueAt: typeof attrs?.dueAt === "number" ? attrs.dueAt : block.dueAt,
  };
}

function emptyParagraph(): JSONContent {
  return { type: "paragraph", attrs: { id: crypto.randomUUID() } };
}

function codeText(node: JSONContent): string {
  return (node.content ?? []).map((child) => child.text ?? "").join("");
}

export function textToInline(text: string): JSONContent[] | undefined {
  if (!text) return undefined;
  const nodes: JSONContent[] = [];
  const pattern = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(...markedText(text.slice(last, match.index)));
    if (match[1] !== undefined) {
      const id = match[1].trim();
      const label = (match[2] || id).trim();
      nodes.push({ type: "mention", attrs: { id, label, mentionSuggestionChar: "@" } });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      nodes.push({
        type: "text",
        text: match[3],
        marks: [{ type: "link", attrs: { href: match[4] } }],
      });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(...markedText(text.slice(last)));
  return nodes.length ? nodes : undefined;
}

function markedText(input: string): JSONContent[] {
  if (!input) return [];
  const parts = input.split("\n");
  const nodes: JSONContent[] = [];
  parts.forEach((part, index) => {
    for (const segment of parseInlineSegments(part)) {
      if (!segment.value) continue;
      if (segment.type === "text") {
        nodes.push({ type: "text", text: segment.value });
        continue;
      }
      nodes.push({
        type: "text",
        text: segment.value,
        marks: [{ type: segment.type === "highlight" ? "highlight" : segment.type }],
      });
    }
    if (index < parts.length - 1) nodes.push({ type: "hardBreak" });
  });
  return nodes;
}

export function inlineToText(content?: JSONContent[]): string {
  if (!content?.length) return "";
  return content
    .map((node) => {
      if (node.type === "hardBreak") return "\n";
      if (node.type === "mention") {
        const id = String(node.attrs?.id ?? "");
        const label = String(node.attrs?.label ?? id);
        return id && label && id !== label ? `[[${id}|${label}]]` : `[[${id || label}]]`;
      }
      if (node.content) return inlineToText(node.content);
      let text = node.text ?? "";
      const marks = node.marks ?? [];
      if (marks.some((mark) => mark.type === "code")) text = `\`${text}\``;
      if (marks.some((mark) => mark.type === "bold")) text = `**${text}**`;
      if (marks.some((mark) => mark.type === "italic")) text = `*${text}*`;
      if (marks.some((mark) => mark.type === "highlight")) text = `==${text}==`;
      const link = marks.find((mark) => mark.type === "link");
      if (link?.attrs?.href) text = `[${text}](${link.attrs.href})`;
      return text;
    })
    .join("");
}

export function atomFromCommand(
  type: BlockType,
  extras?: Partial<Block>,
): Block {
  return createBlock(type, extras?.text ?? "", {
    checked: extras?.checked,
    calloutVariant: extras?.calloutVariant,
    pageId: extras?.pageId,
    language: extras?.language,
    url: extras?.url,
    label: extras?.label,
    rows: extras?.rows ?? (type === "table" ? emptyTable() : undefined),
  });
}
