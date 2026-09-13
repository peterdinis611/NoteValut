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

function collectWeights(variants: string[]): { weights: number[]; hasItalic: boolean } {
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

  return { weights: [...weights].sort((a, b) => a - b), hasItalic };
}

/** Build a CSS2 stylesheet URL for a Google Fonts family. */
export function googleFontsCss2Url(
  family: string,
  variants: string[] = [],
  opts?: { weight?: number },
): string {
  const familyParam = family.trim().replace(/\s+/g, "+");
  let { weights, hasItalic } = collectWeights(variants);

  if (opts?.weight && Number.isFinite(opts.weight)) {
    weights = [...new Set([...weights, opts.weight])].sort((a, b) => a - b);
  }

  if (weights.length === 0) {
    if (opts?.weight) {
      return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${opts.weight}&display=swap`;
    }
    return `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`;
  }

  if (hasItalic) {
    const pairs = [...weights.map((w) => `0,${w}`), ...weights.map((w) => `1,${w}`)].join(";");
    return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@${pairs}&display=swap`;
  }

  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weights.join(";")}&display=swap`;
}

/** Numeric weights available for a family (for the preview slider). */
export function googleFontWeightOptions(variants: string[]): number[] {
  const { weights } = collectWeights(variants);
  return weights.length > 0 ? weights : [400, 500, 600, 700];
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
        item.family.toLowerCase().includes(q) || normalizeFontCategory(item.category).includes(q),
    );
  }
  return filtered.slice(0, limit);
}
