import { blocksToMarkdown, type Block } from "@/lib/blocks";
import type { ExportVaultPayload } from "@/lib/vault-backup";

function safeFilename(title: string) {
  return (title || "untitled").replace(/[^\w\-]+/g, "-").toLowerCase() || "untitled";
}

/** Download a single combined Markdown dump of the vault. */
export function downloadVaultMarkdown(backup: ExportVaultPayload) {
  const pages = backup.notes.filter((n) => n.kind !== "folder");
  const parts = [
    `# NoteVault export`,
    ``,
    `Exported ${new Date(backup.exportedAt).toLocaleString()} · ${pages.length} pages`,
    ``,
    `---`,
    ``,
  ];

  for (const note of pages) {
    const blocks = (note.blocks ?? []) as Block[];
    const body = blocks.length > 0 ? blocksToMarkdown(blocks) : note.content || "";
    parts.push(`# ${note.icon ? `${note.icon} ` : ""}${note.title || "Untitled"}`);
    if (note.tags?.length) {
      parts.push(`Tags: ${note.tags.map((t) => `#${t}`).join(" ")}`);
    }
    parts.push(``);
    parts.push(body.trim() || "_Empty page_");
    parts.push(``);
    parts.push(`---`);
    parts.push(``);
  }

  const blob = new Blob([parts.join("\n")], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10);
  a.href = url;
  a.download = `notevault-${stamp}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export { safeFilename };
