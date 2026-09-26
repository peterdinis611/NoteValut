"use client";

import { createBlock, type Block } from "@/lib/blocks";
import { listDefaultTemplates } from "@/lib/templates";
import { Extension } from "../create-extension";

function cloneTemplateBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) =>
    createBlock(b.type, b.text, {
      checked: b.checked,
      calloutVariant: b.calloutVariant,
      pageId: b.pageId,
      language: b.language,
      url: b.url,
      label: b.label,
      rows: b.rows?.map((row) => [...row]),
      color: b.color,
      bgColor: b.bgColor,
      width: b.width,
      align: b.align,
      indent: b.indent,
      dueAt: b.dueAt,
      pinned: b.pinned,
      syncedId: b.type === "synced" ? crypto.randomUUID() : b.syncedId,
      mentionUserId: b.mentionUserId,
    }),
  );
}

const SLASH_TEMPLATE_IDS = ["meeting", "weekly-review", "standup", "daily", "checklist"] as const;

/** Slash commands that insert a full page template into the current page. */
export const TemplateInsert = Extension({
  name: "template-insert",
  types: [],
  slashCommands: listDefaultTemplates()
    .filter((t) => (SLASH_TEMPLATE_IDS as readonly string[]).includes(t.id))
    .map((t) => ({
      id: `template-${t.id}`,
      type: "paragraph" as const,
      label: t.name,
      description: `Insert ${t.description.toLowerCase()}`,
      icon: t.icon,
      keywords: [t.name.toLowerCase(), t.id, "template", "insert", ...t.tags],
      group: "Templates",
      insertBlocks: cloneTemplateBlocks(t.blocks),
    })),
  render: () => null,
});
