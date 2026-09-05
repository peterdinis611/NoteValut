/** Shared Google Fonts helpers for Convex actions (keep in sync with src/lib/google-fonts.ts). */

export type GoogleFontItem = {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  popularity?: number;
};

const CATEGORY_ALIASES: Record<string, string> = {
  "sans serif": "sans-serif",
  "sans-serif": "sans-serif",
  serif: "serif",
  display: "display",
  handwriting: "handwriting",
  script: "handwriting",
  monospace: "monospace",
  mono: "monospace",
};

export function normalizeFontCategory(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? key.replace(/\s+/g, "-");
}

export function fontKeyToVariant(key: string): string {
  const italic = /i$/i.test(key);
  const weight = Number.parseInt(key, 10);
  if (!Number.isFinite(weight)) return key;
  if (weight === 400 && !italic) return "regular";
  if (weight === 400 && italic) return "italic";
  if (italic) return `${weight}italic`;
  return String(weight);
}

export function filterGoogleFonts(
  items: GoogleFontItem[],
  query: string,
  opts?: { category?: string; limit?: number },
): GoogleFontItem[] {
  const q = query.trim().toLowerCase();
  const category = opts?.category ? normalizeFontCategory(opts.category) : "";
  const limit = opts?.limit ?? 40;

  let filtered = items;
  if (category) {
    filtered = filtered.filter(
      (item) => normalizeFontCategory(item.category) === category,
    );
  }
  if (q) {
    filtered = filtered.filter(
      (item) =>
        item.family.toLowerCase().includes(q) ||
        normalizeFontCategory(item.category).includes(q),
    );
  }
  return filtered.slice(0, limit);
}
