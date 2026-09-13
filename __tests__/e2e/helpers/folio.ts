import type { Page } from "@playwright/test";

export const FOLIO = {
  background: "#fbf8f2",
  foreground: "#171412",
  accent: "#e8611a",
  lilac: "#cbb6ee",
  sidebar: "#f3ead8",
} as const;

export const PHOSPHOR_ACCENT = "#c8f542";

export const SETTINGS_STORAGE_KEY = "notevault.db.settings";
export const FOLIO_HOUSE_MIGRATION_KEY = "notevault.folio-house-v1";

export function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

export async function cssVar(page: Page, name: string) {
  return page
    .locator("html")
    .evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);
}

export function forestSettingsPayload() {
  return JSON.stringify({
    "s:vault": {
      versionKey: "e2e-forest",
      data: {
        id: "vault",
        themeId: "forest",
        customCss: "",
        updatedAt: 1,
      },
    },
  });
}
