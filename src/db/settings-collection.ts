import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import * as v from "valibot";

export const ThemePresetIdSchema = v.picklist([
  "default",
  "ocean",
  "violet",
  "rose",
  "forest",
  "slate",
  "custom",
]);

export type ThemePresetId = v.InferOutput<typeof ThemePresetIdSchema>;

export const FontModeSchema = v.picklist(["default", "file", "url"]);
export type FontMode = v.InferOutput<typeof FontModeSchema>;

export const SettingsRecordSchema = v.object({
  id: v.literal("vault"),
  themeId: ThemePresetIdSchema,
  customCss: v.string(),
  customCssName: v.optional(v.string()),
  fontMode: v.optional(FontModeSchema),
  fontFamily: v.optional(v.string()),
  fontFileName: v.optional(v.string()),
  fontDataUrl: v.optional(v.string()),
  fontUrl: v.optional(v.string()),
  updatedAt: v.number(),
});

export type SettingsRecord = v.InferOutput<typeof SettingsRecordSchema>;

export const settingsCollection = createCollection(
  localStorageCollectionOptions({
    id: "nv-settings",
    storageKey: "notevault.db.settings",
    getKey: (item) => item.id,
    schema: SettingsRecordSchema,
  }),
);

export const THEME_PRESETS: Record<
  Exclude<ThemePresetId, "custom">,
  {
    id: Exclude<ThemePresetId, "custom">;
    label: string;
    description: string;
    swatch: string;
    vars: Record<string, string>;
  }
> = {
  default: {
    id: "default",
    label: "Teal night",
    description: "Default NoteVault look",
    swatch: "#3ecfbe",
    vars: {
      "--background": "#12151c",
      "--foreground": "rgba(255, 255, 255, 0.88)",
      "--sidebar": "#171b24",
      "--panel": "#1e2430",
      "--hover": "rgba(255, 255, 255, 0.05)",
      "--hover-strong": "rgba(255, 255, 255, 0.09)",
      "--border": "rgba(255, 255, 255, 0.07)",
      "--muted": "rgba(255, 255, 255, 0.45)",
      "--accent": "#3ecfbe",
      "--accent-soft": "rgba(62, 207, 190, 0.12)",
      "--topbar": "#12151c",
    },
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    description: "Cool blues",
    swatch: "#38bdf8",
    vars: {
      "--background": "#0b1220",
      "--foreground": "rgba(241, 245, 249, 0.9)",
      "--sidebar": "#0f1a2e",
      "--panel": "#152238",
      "--hover": "rgba(148, 163, 184, 0.08)",
      "--hover-strong": "rgba(148, 163, 184, 0.14)",
      "--border": "rgba(148, 163, 184, 0.12)",
      "--muted": "rgba(148, 163, 184, 0.65)",
      "--accent": "#38bdf8",
      "--accent-soft": "rgba(56, 189, 248, 0.14)",
      "--topbar": "#0b1220",
    },
  },
  violet: {
    id: "violet",
    label: "Violet",
    description: "Soft purple accents",
    swatch: "#a78bfa",
    vars: {
      "--background": "#14111c",
      "--foreground": "rgba(250, 245, 255, 0.9)",
      "--sidebar": "#1a1526",
      "--panel": "#221b33",
      "--hover": "rgba(196, 181, 253, 0.08)",
      "--hover-strong": "rgba(196, 181, 253, 0.14)",
      "--border": "rgba(196, 181, 253, 0.12)",
      "--muted": "rgba(196, 181, 253, 0.55)",
      "--accent": "#a78bfa",
      "--accent-soft": "rgba(167, 139, 250, 0.16)",
      "--topbar": "#14111c",
    },
  },
  rose: {
    id: "rose",
    label: "Rose",
    description: "Warm rose accents",
    swatch: "#fb7185",
    vars: {
      "--background": "#171114",
      "--foreground": "rgba(255, 241, 242, 0.9)",
      "--sidebar": "#1f1519",
      "--panel": "#2a1b21",
      "--hover": "rgba(251, 113, 133, 0.08)",
      "--hover-strong": "rgba(251, 113, 133, 0.14)",
      "--border": "rgba(251, 113, 133, 0.12)",
      "--muted": "rgba(253, 164, 175, 0.55)",
      "--accent": "#fb7185",
      "--accent-soft": "rgba(251, 113, 133, 0.14)",
      "--topbar": "#171114",
    },
  },
  forest: {
    id: "forest",
    label: "Forest",
    description: "Deep green tones",
    swatch: "#34d399",
    vars: {
      "--background": "#0f1612",
      "--foreground": "rgba(236, 253, 245, 0.9)",
      "--sidebar": "#14201a",
      "--panel": "#1a2b22",
      "--hover": "rgba(52, 211, 153, 0.08)",
      "--hover-strong": "rgba(52, 211, 153, 0.14)",
      "--border": "rgba(52, 211, 153, 0.12)",
      "--muted": "rgba(167, 243, 208, 0.5)",
      "--accent": "#34d399",
      "--accent-soft": "rgba(52, 211, 153, 0.14)",
      "--topbar": "#0f1612",
    },
  },
  slate: {
    id: "slate",
    label: "Slate",
    description: "Neutral graphite",
    swatch: "#94a3b8",
    vars: {
      "--background": "#111318",
      "--foreground": "rgba(248, 250, 252, 0.9)",
      "--sidebar": "#161a22",
      "--panel": "#1c222d",
      "--hover": "rgba(148, 163, 184, 0.08)",
      "--hover-strong": "rgba(148, 163, 184, 0.14)",
      "--border": "rgba(148, 163, 184, 0.12)",
      "--muted": "rgba(148, 163, 184, 0.6)",
      "--accent": "#94a3b8",
      "--accent-soft": "rgba(148, 163, 184, 0.14)",
      "--topbar": "#111318",
    },
  },
};

const STYLE_ID = "nv-custom-theme-css";
const FONT_STYLE_ID = "nv-custom-font-css";
const FONT_LINK_ID = "nv-custom-font-link";

const DEFAULT_SETTINGS: SettingsRecord = {
  id: "vault",
  themeId: "default",
  customCss: "",
  customCssName: undefined,
  fontMode: "default",
  fontFamily: undefined,
  fontFileName: undefined,
  fontDataUrl: undefined,
  fontUrl: undefined,
  updatedAt: Date.now(),
};

function normalizeSettings(raw: SettingsRecord): SettingsRecord {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    fontMode: raw.fontMode ?? "default",
  };
}

export function getSettings(): SettingsRecord {
  const existing = settingsCollection.get("vault");
  if (existing) return normalizeSettings(existing);
  const defaults: SettingsRecord = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
  if (typeof window !== "undefined" && !settingsCollection.has("vault")) {
    settingsCollection.insert(defaults);
  }
  return defaults;
}

function writeSettings(next: SettingsRecord) {
  if (settingsCollection.has("vault")) {
    settingsCollection.update("vault", (draft) => {
      draft.themeId = next.themeId;
      draft.customCss = next.customCss;
      draft.customCssName = next.customCssName;
      draft.fontMode = next.fontMode;
      draft.fontFamily = next.fontFamily;
      draft.fontFileName = next.fontFileName;
      draft.fontDataUrl = next.fontDataUrl;
      draft.fontUrl = next.fontUrl;
      draft.updatedAt = next.updatedAt;
    });
  } else {
    settingsCollection.insert(next);
  }
}

export function updateSettings(patch: Partial<Omit<SettingsRecord, "id">>) {
  const current = getSettings();
  const next = normalizeSettings({
    ...current,
    ...patch,
    updatedAt: Date.now(),
    id: "vault" as const,
  });
  writeSettings(next);
  applyTheme(next);
  return next;
}

function fontFormatFromName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".woff2")) return "woff2";
  if (lower.endsWith(".woff")) return "woff";
  if (lower.endsWith(".otf")) return "opentype";
  if (lower.endsWith(".ttf")) return "truetype";
  return "woff2";
}

function sanitizeFontFamily(name: string): string {
  return name.replace(/["\\]/g, "").trim().slice(0, 60) || "NoteVault Custom";
}

function familyStack(family: string): string {
  return `"${sanitizeFontFamily(family)}", ui-sans-serif, system-ui, sans-serif`;
}

function clearFontDom() {
  document.getElementById(FONT_STYLE_ID)?.remove();
  document.getElementById(FONT_LINK_ID)?.remove();
  document.documentElement.style.removeProperty("--font-geist-sans");
  document.documentElement.style.removeProperty("--font-sans");
}

export function applyFont(settings?: SettingsRecord) {
  if (typeof document === "undefined") return;
  const s = normalizeSettings(settings ?? getSettings());
  const root = document.documentElement;
  const mode = s.fontMode ?? "default";

  if (mode === "default" || !s.fontFamily?.trim()) {
    clearFontDom();
    return;
  }

  const family = sanitizeFontFamily(s.fontFamily);
  const stack = familyStack(family);

  if (mode === "file" && s.fontDataUrl) {
    document.getElementById(FONT_LINK_ID)?.remove();
    let styleEl = document.getElementById(FONT_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = FONT_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    const format = fontFormatFromName(s.fontFileName ?? "font.woff2");
    styleEl.textContent = `
@font-face {
  font-family: "${family}";
  src: url(${JSON.stringify(s.fontDataUrl)}) format("${format}");
  font-display: swap;
  font-weight: 100 900;
  font-style: normal;
}
`.trim();
    root.style.setProperty("--font-geist-sans", stack);
    root.style.setProperty("--font-sans", stack);
    return;
  }

  if (mode === "url" && s.fontUrl?.trim()) {
    document.getElementById(FONT_STYLE_ID)?.remove();
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = s.fontUrl.trim();
    root.style.setProperty("--font-geist-sans", stack);
    root.style.setProperty("--font-sans", stack);
    return;
  }

  clearFontDom();
}

export function applyTheme(settings?: SettingsRecord) {
  if (typeof document === "undefined") return;
  const s = normalizeSettings(settings ?? getSettings());
  const root = document.documentElement;

  const preset =
    s.themeId === "custom" ? THEME_PRESETS.default : THEME_PRESETS[s.themeId];
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value);
  }

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  const css = s.themeId === "custom" ? s.customCss.trim() : "";

  if (css) {
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  } else if (styleEl) {
    styleEl.remove();
  }

  applyFont(s);
}

export function setThemePreset(id: Exclude<ThemePresetId, "custom">) {
  return updateSettings({ themeId: id });
}

export function setCustomThemeCss(css: string, fileName?: string) {
  return updateSettings({
    themeId: "custom",
    customCss: css,
    customCssName: fileName,
  });
}

export function clearCustomTheme() {
  return updateSettings({
    themeId: "default",
    customCss: "",
    customCssName: undefined,
  });
}

export const MAX_FONT_BYTES = 1_500_000;

export function setCustomFontFromFile(input: {
  family: string;
  fileName: string;
  dataUrl: string;
}) {
  return updateSettings({
    fontMode: "file",
    fontFamily: sanitizeFontFamily(input.family),
    fontFileName: input.fileName,
    fontDataUrl: input.dataUrl,
    fontUrl: undefined,
  });
}

export function setCustomFontFromUrl(family: string, cssUrl: string) {
  return updateSettings({
    fontMode: "url",
    fontFamily: sanitizeFontFamily(family),
    fontUrl: cssUrl.trim(),
    fontDataUrl: undefined,
    fontFileName: undefined,
  });
}

export function clearCustomFont() {
  return updateSettings({
    fontMode: "default",
    fontFamily: undefined,
    fontFileName: undefined,
    fontDataUrl: undefined,
    fontUrl: undefined,
  });
}

export function familyNameFromFile(fileName: string): string {
  return sanitizeFontFamily(
    fileName.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]+/g, " "),
  );
}

export async function readFontFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Couldn’t read font"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Couldn’t read font"));
    reader.readAsDataURL(file);
  });
}
