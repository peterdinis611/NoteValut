/** Build denormalized search text for Convex searchIndex. */
export function buildNoteSearchText(input: {
  title?: string;
  content?: string;
  description?: string;
  status?: string;
  tags?: string[];
  blocks?: Array<{
    text?: string;
    label?: string;
    url?: string;
    rows?: string[][];
  }>;
  folderBlocks?: Array<{
    text?: string;
    label?: string;
    url?: string;
    rows?: string[][];
  }>;
}): string {
  const parts: string[] = [];
  if (input.title) parts.push(input.title);
  if (input.description) parts.push(input.description);
  if (input.status) parts.push(input.status);
  if (input.content) parts.push(input.content);
  if (input.tags?.length) parts.push(input.tags.join(" "));

  for (const b of [...(input.blocks ?? []), ...(input.folderBlocks ?? [])]) {
    if (b.text) parts.push(b.text);
    if (b.label) parts.push(b.label);
    if (b.url) parts.push(b.url);
    if (b.rows) {
      for (const row of b.rows) {
        for (const cell of row) {
          if (cell) parts.push(cell);
        }
      }
    }
  }

  return parts
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32_000);
}
