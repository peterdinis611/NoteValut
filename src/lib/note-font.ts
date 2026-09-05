/** Apply a note-scoped font without touching the vault-wide document fonts. */

const NOTE_LINK_ID = "nv-note-font-link";
const NOTE_STYLE_ID = "nv-note-font-style";

export function applyNoteFont(opts: {
  /** CSS selector for the note chrome, e.g. `[data-note-id="…"]` */
  scopeSelector: string;
  family?: string | null;
  cssUrl?: string | null;
}) {
  if (typeof document === "undefined") return;

  document.getElementById(NOTE_LINK_ID)?.remove();
  document.getElementById(NOTE_STYLE_ID)?.remove();

  const family = opts.family?.replace(/["\\]/g, "").trim();
  if (!family) return;

  const stack = `"${family}", var(--font-body), ui-sans-serif, system-ui, sans-serif`;

  if (opts.cssUrl?.trim()) {
    const link = document.createElement("link");
    link.id = NOTE_LINK_ID;
    link.rel = "stylesheet";
    link.href = opts.cssUrl.trim();
    document.head.appendChild(link);
  }

  const style = document.createElement("style");
  style.id = NOTE_STYLE_ID;
  style.textContent = `
${opts.scopeSelector} {
  --font-body: ${stack};
  --font-geist-sans: ${stack};
  --font-sans: ${stack};
  font-family: ${stack};
}
${opts.scopeSelector} .ProseMirror,
${opts.scopeSelector} .nv-editor,
${opts.scopeSelector} .page-title-input,
${opts.scopeSelector} .block-text {
  font-family: inherit;
}
`.trim();
  document.head.appendChild(style);
}

export function clearNoteFont() {
  if (typeof document === "undefined") return;
  document.getElementById(NOTE_LINK_ID)?.remove();
  document.getElementById(NOTE_STYLE_ID)?.remove();
}
