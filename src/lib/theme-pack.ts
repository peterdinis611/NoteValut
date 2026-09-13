import {
  getSettings,
  type SettingsRecord,
  type ThemePresetId,
  updateSettings,
} from "@/db/settings-collection";

export const THEME_PACK_VERSION = 1 as const;

export type ThemePack = {
  version: typeof THEME_PACK_VERSION;
  exportedAt: number;
  app: "notevault";
  themeId: ThemePresetId;
  customCss: string;
  customCssName?: string;
  font: {
    mode: SettingsRecord["fontMode"];
    family?: string;
    url?: string;
    fileName?: string;
    /** Base64 data URLs can be large — included only when present and under ~200KB */
    dataUrl?: string;
  };
};

const MAX_DATA_URL = 200_000;

export function exportThemePack(settings?: SettingsRecord): ThemePack {
  const s = settings ?? getSettings();
  const dataUrl = s.fontDataUrl && s.fontDataUrl.length <= MAX_DATA_URL ? s.fontDataUrl : undefined;
  return {
    version: THEME_PACK_VERSION,
    exportedAt: Date.now(),
    app: "notevault",
    themeId: s.themeId,
    customCss: s.customCss,
    customCssName: s.customCssName,
    font: {
      mode: s.fontMode ?? "default",
      family: s.fontFamily,
      url: s.fontUrl,
      fileName: s.fontFileName,
      dataUrl,
    },
  };
}

export function downloadThemePack(settings?: SettingsRecord) {
  const pack = exportThemePack(settings);
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `notevault-theme-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return pack;
}

export function parseThemePack(raw: unknown): ThemePack {
  if (!raw || typeof raw !== "object") throw new Error("Invalid theme pack");
  const o = raw as Record<string, unknown>;
  if (o.app !== "notevault") throw new Error("Not a NoteVault theme pack");
  if (o.version !== 1) throw new Error("Unsupported theme pack version");
  const font = (o.font ?? {}) as Record<string, unknown>;
  return {
    version: 1,
    exportedAt: typeof o.exportedAt === "number" ? o.exportedAt : Date.now(),
    app: "notevault",
    themeId: (typeof o.themeId === "string" ? o.themeId : "default") as ThemePresetId,
    customCss: typeof o.customCss === "string" ? o.customCss : "",
    customCssName: typeof o.customCssName === "string" ? o.customCssName : undefined,
    font: {
      mode:
        font.mode === "file" || font.mode === "url" || font.mode === "default"
          ? font.mode
          : "default",
      family: typeof font.family === "string" ? font.family : undefined,
      url: typeof font.url === "string" ? font.url : undefined,
      fileName: typeof font.fileName === "string" ? font.fileName : undefined,
      dataUrl: typeof font.dataUrl === "string" ? font.dataUrl : undefined,
    },
  };
}

export function applyThemePack(pack: ThemePack) {
  const fontMode = pack.font.mode ?? "default";
  return updateSettings({
    themeId: pack.themeId,
    customCss: pack.customCss,
    customCssName: pack.customCssName,
    fontMode,
    fontFamily: fontMode === "default" ? undefined : pack.font.family,
    fontUrl: fontMode === "url" ? pack.font.url : undefined,
    fontFileName: fontMode === "file" ? pack.font.fileName : undefined,
    fontDataUrl: fontMode === "file" ? pack.font.dataUrl : undefined,
  });
}
