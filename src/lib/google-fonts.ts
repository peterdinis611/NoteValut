export type GoogleFontItem = {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  popularity?: number;
};

export type GoogleFontsListResponse = {
  items: GoogleFontItem[];
  total: number;
  source: "cache" | "metadata" | "none";
  error?: string;
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

/** Normalize Google Fonts category labels to CSS-like slugs. */
export function normalizeFontCategory(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? key.replace(/\s+/g, "-");
}

/** Convert metadata font keys (`400`, `400i`) to CSS2-friendly variant ids. */
export function fontKeyToVariant(key: string): string {
  const italic = /i$/i.test(key);
  const weight = Number.parseInt(key, 10);
  if (!Number.isFinite(weight)) return key;
  if (weight === 400 && !italic) return "regular";
  if (weight === 400 && italic) return "italic";
  if (italic) return `${weight}italic`;
  return String(weight);
}

/** Build a CSS2 stylesheet URL for a Google Fonts family. */
export function googleFontsCss2Url(family: string, variants: string[] = []): string {
  const familyParam = family.trim().replace(/\s+/g, "+");
  const weights = new Set<number>();
  let hasItalic = false;

  for (const raw of variants) {
    const v = raw.toLowerCase();
    if (v === "regular" || v === "400") {
      weights.add(400);
      continue;
    }
    if (v === "italic" || v === "400i" || v === "400italic") {
      weights.add(400);
      hasItalic = true;
      continue;
    }
    if (v.endsWith("i") && /^\d+i$/.test(v)) {
      const n = Number.parseInt(v, 10);
      weights.add(Number.isFinite(n) ? n : 400);
      hasItalic = true;
      continue;
    }
    if (v.endsWith("italic")) {
      const n = Number.parseInt(v, 10);
      weights.add(Number.isFinite(n) ? n : 400);
      hasItalic = true;
      continue;
    }
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n)) weights.add(n);
  }

  const sorted = [...weights].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`;
  }

  if (hasItalic) {
    const pairs = [
      ...sorted.map((w) => `0,${w}`),
      ...sorted.map((w) => `1,${w}`),
    ].join(";");
    return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@${pairs}&display=swap`;
  }

  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${sorted.join(";")}&display=swap`;
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
    filtered = filtered.filter((item) => normalizeFontCategory(item.category) === category);
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
