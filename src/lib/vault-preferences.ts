export type VaultPreferences = {
  editorFontSize: "sm" | "md" | "lg";
  autosaveMs: 300 | 450 | 800;
  compactSidebar: boolean;
  openCalendarFirst: boolean;
  notifyMentions: boolean;
  notifyUpdates: boolean;
  defaultNewPageTitle: string;
};

export const DEFAULT_VAULT_PREFERENCES: VaultPreferences = {
  editorFontSize: "md",
  autosaveMs: 450,
  compactSidebar: false,
  openCalendarFirst: false,
  notifyMentions: true,
  notifyUpdates: false,
  defaultNewPageTitle: "Untitled",
};

const STORAGE_KEY = "notevalut.vault.preferences";

export const loadVaultPreferences = (): VaultPreferences => {
  if (typeof window === "undefined") return DEFAULT_VAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VAULT_PREFERENCES;
    return { ...DEFAULT_VAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VAULT_PREFERENCES;
  }
};

export const saveVaultPreferences = (prefs: VaultPreferences) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};
