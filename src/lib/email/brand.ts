import "server-only";

/** NoteValut light-theme tokens as hex (email clients rarely support oklch). */
export const emailBrand = {
  paper: "#F5EFE6",
  paperDeep: "#EDE4D6",
  card: "#FFFDF9",
  ink: "#2C2620",
  inkSoft: "#4A4036",
  muted: "#7A7064",
  mutedSoft: "#9A8F80",
  border: "#E5DDD0",
  primary: "#352E27",
  primaryFg: "#F7F4EE",
  accent: "#F0E0D2",
  copper: "#B8956A",
  copperSoft: "#D4B896",
  display:
    "'Bricolage Grotesque', 'Iowan Old Style', Palatino, 'Palatino Linotype', Georgia, serif",
  sans: "'Figtree', 'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
} as const;

export const emailFontLinks = `
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,650;12..96,700&family=Figtree:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
`;

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
