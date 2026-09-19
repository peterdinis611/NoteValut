/** Theme tokens users can override from Settings → Appearance. */

export type CssVarKind = "color" | "text";

export type CssVarDef = {
  key: string;
  label: string;
  hint: string;
  kind: CssVarKind;
  group: "surfaces" | "accents" | "text" | "chrome";
};

export const CSS_THEME_VARS: CssVarDef[] = [
  {
    key: "--background",
    label: "Background",
    hint: "App canvas / page wash",
    kind: "color",
    group: "surfaces",
  },
  {
    key: "--panel",
    label: "Panel",
    hint: "Cards, dialogs, editor surface",
    kind: "color",
    group: "surfaces",
  },
  {
    key: "--sidebar",
    label: "Sidebar",
    hint: "Navigation rail",
    kind: "color",
    group: "surfaces",
  },
  {
    key: "--topbar",
    label: "Top bar",
    hint: "Header strip",
    kind: "color",
    group: "surfaces",
  },
  {
    key: "--foreground",
    label: "Ink / text",
    hint: "Primary text color",
    kind: "color",
    group: "text",
  },
  {
    key: "--muted",
    label: "Muted text",
    hint: "Secondary labels & hints",
    kind: "color",
    group: "text",
  },
  {
    key: "--border",
    label: "Border",
    hint: "Hairlines & dividers (hex or rgba)",
    kind: "text",
    group: "chrome",
  },
  {
    key: "--hover",
    label: "Hover",
    hint: "Subtle hover wash",
    kind: "text",
    group: "chrome",
  },
  {
    key: "--hover-strong",
    label: "Hover strong",
    hint: "Stronger selection / press",
    kind: "text",
    group: "chrome",
  },
  {
    key: "--grid-line",
    label: "Grid line",
    hint: "Atmosphere grid tint",
    kind: "text",
    group: "chrome",
  },
  {
    key: "--accent",
    label: "Accent",
    hint: "Brew / primary action",
    kind: "color",
    group: "accents",
  },
  {
    key: "--accent-bright",
    label: "Accent bright",
    hint: "Hover / emphasis accent",
    kind: "color",
    group: "accents",
  },
  {
    key: "--accent-soft",
    label: "Accent soft",
    hint: "Tinted chips & soft fills",
    kind: "text",
    group: "accents",
  },
  {
    key: "--accent-ink",
    label: "Accent ink",
    hint: "Text on accent buttons",
    kind: "color",
    group: "accents",
  },
  {
    key: "--lilac",
    label: "Lilac",
    hint: "Secondary decorative accent",
    kind: "color",
    group: "accents",
  },
  {
    key: "--live",
    label: "Live / success",
    hint: "Online, success, LIVE badge",
    kind: "color",
    group: "accents",
  },
  {
    key: "--live-soft",
    label: "Live soft",
    hint: "Soft success wash",
    kind: "text",
    group: "accents",
  },
];

export const CSS_VAR_GROUPS: Array<{ id: CssVarDef["group"]; label: string }> = [
  { id: "surfaces", label: "Surfaces" },
  { id: "text", label: "Text" },
  { id: "accents", label: "Accents" },
  { id: "chrome", label: "Chrome" },
];

const VAR_RE = /(--[\w-]+)\s*:\s*([^;]+);/g;

/** Pull `:root { --x: … }` declarations from a CSS string. */
export function parseCssVarMap(css: string): Record<string, string> {
  const map: Record<string, string> = {};
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_RE.source, "g");
  while ((m = re.exec(css))) {
    map[m[1]] = m[2].trim();
  }
  return map;
}

export function buildRootCss(vars: Record<string, string>): string {
  const lines = CSS_THEME_VARS.map((def) => {
    const value = vars[def.key]?.trim();
    if (!value) return null;
    return `  ${def.key}: ${value};`;
  }).filter(Boolean);
  if (lines.length === 0) return "";
  return `:root {\n${lines.join("\n")}\n}\n`;
}

/** Prefer hex for `<input type="color">`; fall back to #000000 if not a hex. */
export function toColorInputValue(value: string | undefined, fallback = "#000000"): string {
  if (!value) return fallback;
  const hex = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value.trim());
}
