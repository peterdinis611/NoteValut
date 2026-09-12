"use client";

import { useVaultSettings } from "@/hooks/use-vault-settings";

/** Applies the vault theme (and one-shot Folio house migration) on every page. */
export function ThemeBoot() {
  useVaultSettings();
  return null;
}
