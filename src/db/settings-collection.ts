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
    label: "Copper ink",
    description: "Warm amber on parchment dark",
    swatch: "#e2a45a",
    vars: {
      "--background": "#141210",
      "--foreground": "rgba(250, 245, 235, 0.92)",
      "--sidebar": "#1a1713",
      "--panel": "#24201a",
      "--hover": "rgba(255, 236, 210, 0.05)",
      "--hover-strong": "rgba(255, 236, 210, 0.1)",
      "--border": "rgba(255, 230, 200, 0.09)",
      "--muted": "rgba(210, 190, 165, 0.58)",
      "--accent": "#e2a45a",
      "--accent-soft": "rgba(226, 164, 90, 0.14)",
      "--topbar": "#141210",
    },
  },
  ocean: {
    id: "ocean",
    label: "Harbor",
    description: "Deep sea and sky blue",
    swatch: "#5eb0e0",
    vars: {
      "--background": "#0c1218",
      "--foreground": "rgba(230, 240, 248, 0.92)",
      "--sidebar": "#111820",
      "--panel": "#1a2430",
      "--hover": "rgba(160, 190, 220, 0.07)",
      "--hover-strong": "rgba(160, 190, 220, 0.13)",
      "--border": "rgba(150, 185, 220, 0.11)",
      "--muted": "rgba(150, 180, 205, 0.58)",
      "--accent": "#5eb0e0",
      "--accent-soft": "rgba(94, 176, 224, 0.14)",
      "--topbar": "#0c1218",
    },
  },
  violet: {
    id: "violet",
    label: "Plum",
    description: "Muted berry accents",
    swatch: "#c48ab8",
    vars: {
      "--background": "#151218",
      "--foreground": "rgba(250, 242, 248, 0.92)",
      "--sidebar": "#1c171f",
      "--panel": "#26202a",
      "--hover": "rgba(220, 180, 210, 0.07)",
      "--hover-strong": "rgba(220, 180, 210, 0.13)",
      "--border": "rgba(210, 170, 200, 0.11)",
      "--muted": "rgba(200, 170, 190, 0.55)",
      "--accent": "#c48ab8",
      "--accent-soft": "rgba(196, 138, 184, 0.15)",
      "--topbar": "#151218",
    },
  },
  rose: {
    id: "rose",
    label: "Clay",
    description: "Earthy terracotta",
    swatch: "#d4846a",
    vars: {
      "--background": "#161210",
      "--foreground": "rgba(255, 244, 238, 0.92)",
      "--sidebar": "#1e1714",
      "--panel": "#2a201b",
      "--hover": "rgba(230, 170, 145, 0.07)",
      "--hover-strong": "rgba(230, 170, 145, 0.13)",
      "--border": "rgba(220, 160, 135, 0.11)",
      "--muted": "rgba(210, 165, 145, 0.55)",
      "--accent": "#d4846a",
      "--accent-soft": "rgba(212, 132, 106, 0.15)",
      "--topbar": "#161210",
    },
  },
  forest: {
    id: "forest",
    label: "Olive",
    description: "Quiet moss and leaf",
    swatch: "#8faf6e",
    vars: {
      "--background": "#121510",
      "--foreground": "rgba(240, 246, 232, 0.92)",
      "--sidebar": "#171b14",
      "--panel": "#22281c",
      "--hover": "rgba(180, 200, 150, 0.07)",
      "--hover-strong": "rgba(180, 200, 150, 0.13)",
      "--border": "rgba(170, 190, 140, 0.11)",
      "--muted": "rgba(170, 185, 150, 0.55)",
      "--accent": "#8faf6e",
      "--accent-soft": "rgba(143, 175, 110, 0.15)",
      "--topbar": "#121510",
    },
  },
  slate: {
    id: "slate",
    label: "Stone",
    description: "Cool graphite neutrals",
    swatch: "#9aa3b2",
    vars: {
      "--background": "#12141a",
      "--foreground": "rgba(240, 244, 248, 0.92)",
      "--sidebar": "#171a21",
      "--panel": "#21262f",
      "--hover": "rgba(170, 180, 195, 0.07)",
      "--hover-strong": "rgba(170, 180, 195, 0.13)",
      "--border": "rgba(160, 170, 185, 0.11)",
      "--muted": "rgba(155, 165, 180, 0.58)",
      "--accent": "#9aa3b2",
      "--accent-soft": "rgba(154, 163, 178, 0.14)",
      "--topbar": "#12141a",
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
  updatedAt: 0,
};

/** Stable snapshot for SSR (`useSyncExternalStore` getServerSnapshot). */
export const SERVER_SETTINGS_SNAPSHOT: SettingsRecord = Object.freeze({
  ...DEFAULT_SETTINGS,
});

function normalizeSettings(raw: SettingsRecord): SettingsRecord {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    fontMode: raw.fontMode ?? "default",
  };
}

/** Pure read — never inserts. Safe for `useSyncExternalStore` getSnapshot. */
export function readSettings(): SettingsRecord {
  const existing = settingsCollection.get("vault");
  if (existing) return normalizeSettings(existing);
  return SERVER_SETTINGS_SNAPSHOT;
}

/** Ensure a settings row exists (call from effects / mutations, not getSnapshot). */
export function ensureSettingsRow(): SettingsRecord {
  const existing = settingsCollection.get("vault");
  if (existing) return normalizeSettings(existing);
  const defaults: SettingsRecord = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
  if (typeof window !== "undefined") {
    settingsCollection.insert(defaults);
  }
  return defaults;
}

export function getSettings(): SettingsRecord {
  if (typeof window === "undefined") return SERVER_SETTINGS_SNAPSHOT;
  return ensureSettingsRow();
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
