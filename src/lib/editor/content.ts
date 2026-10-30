import { sanitizeEditorHtml } from "./sanitize";

/** Escape text for HTML text nodes. */
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value.trim());

const taskItemHtml = (checked: boolean, label: string) => {
  const checkedAttr = checked ? "true" : "false";
  const inputChecked = checked ? " checked" : "";
  const text = escapeHtml(label);
  return [
    '<li data-type="taskItem" data-checked="',
    checkedAttr,
    '"><label><input type="checkbox"',
    inputChecked,
    "><span></span></label><div><p>",
    text,
    "</p></div></li>",
  ].join("");
};

/**
 * TipTap stores HTML. Older notes were plain text (with markdown-ish checklists).
 * Convert plain text into a minimal HTML document TipTap can load.
 */
export function normalizeEditorContent(body: string): string {
  const raw = body ?? "";
  if (!raw.trim()) return "<p></p>";
  if (looksLikeHtml(raw)) return sanitizeEditorHtml(raw);

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const chunks: string[] = [];
  let taskBuffer: Array<{ checked: boolean; label: string }> = [];

  const flushTasks = () => {
    if (taskBuffer.length === 0) return;
    const items = taskBuffer
      .map((item) => taskItemHtml(item.checked, item.label))
      .join("");
    chunks.push(`<ul data-type="taskList">${items}</ul>`);
    taskBuffer = [];
  };

  for (const line of lines) {
    const task = line.match(/^\s*- \[([ xX])\]\s+(.*)$/);
    if (task) {
      taskBuffer.push({
        checked: task[1]!.toLowerCase() === "x",
        label: task[2] ?? "",
      });
      continue;
    }

    flushTasks();

    if (/^Brief\s*$/i.test(line.trim())) {
      chunks.push("<h2>Brief</h2>");
      continue;
    }

    if (!line.trim()) {
      chunks.push("<p></p>");
      continue;
    }

    chunks.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushTasks();
  return sanitizeEditorHtml(chunks.join("") || "<p></p>");
}

/** Rough plain-text extract for search / previews. */
export function plainTextFromEditorContent(body: string): string {
  if (!body) return "";
  if (!looksLikeHtml(body)) return body;
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|div|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
