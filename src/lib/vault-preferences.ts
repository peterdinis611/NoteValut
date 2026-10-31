export type VaultPreferences = {
  editorFontSize: "sm" | "md" | "lg";
  autosaveMs: 300 | 450 | 800;
  compactSidebar: boolean;
  /** Pixel width of the desktop sidebar (clamped on read/write). */
  sidebarWidth: number;
  showPageMarks: boolean;
  openCalendarFirst: boolean;
  defaultLandingView: "pages" | "calendar" | "lab" | "map";
  notifyMentions: boolean;
  notifyUpdates: boolean;
  notifyCalendar: boolean;
  notifyTrash: boolean;
  defaultNewPageTitle: string;
  /** Built-in or custom template id used when creating a page */
  defaultTemplateId: string;
  confirmTrash: boolean;
  showLinkedNotes: boolean;
  spellCheck: boolean;
  weekStartsOn: "sunday" | "monday";
  editorDensity: "comfortable" | "compact";
  focusMode: boolean;
  reduceMotion: "system" | "on" | "off";
};

export const SIDEBAR_WIDTH_MIN = 200;
export const SIDEBAR_WIDTH_MAX = 420;
export const SIDEBAR_WIDTH_DEFAULT = 252;

export const DEFAULT_VAULT_PREFERENCES: VaultPreferences = {
  editorFontSize: "md",
  autosaveMs: 450,
  compactSidebar: false,
  sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
  showPageMarks: true,
  openCalendarFirst: false,
  defaultLandingView: "pages",
  notifyMentions: true,
  notifyUpdates: false,
  notifyCalendar: true,
  notifyTrash: false,
  defaultNewPageTitle: "Untitled",
  defaultTemplateId: "blank",
  confirmTrash: true,
  showLinkedNotes: true,
  spellCheck: true,
  weekStartsOn: "monday",
  editorDensity: "comfortable",
  focusMode: false,
  reduceMotion: "system",
};

const STORAGE_KEY = "notevalut.vault.preferences";
export const VAULT_PREFS_EVENT = "notevalut:vault-preferences";

export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return SIDEBAR_WIDTH_DEFAULT;
  return Math.min(
    SIDEBAR_WIDTH_MAX,
    Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)),
  );
}

export const loadVaultPreferences = (): VaultPreferences => {
  if (typeof window === "undefined") return DEFAULT_VAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<VaultPreferences>;
    return {
      ...DEFAULT_VAULT_PREFERENCES,
      ...parsed,
      sidebarWidth: clampSidebarWidth(
        parsed.sidebarWidth ?? SIDEBAR_WIDTH_DEFAULT,
      ),
    };
  } catch {
    return DEFAULT_VAULT_PREFERENCES;
  }
};

export const saveVaultPreferences = (prefs: VaultPreferences) => {
  if (typeof window === "undefined") return;
  const next = {
    ...prefs,
    sidebarWidth: clampSidebarWidth(prefs.sidebarWidth),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent<VaultPreferences>(VAULT_PREFS_EVENT, { detail: next }),
  );
};

export function patchVaultPreferences(
  patch: Partial<VaultPreferences>,
): VaultPreferences {
  const next = { ...loadVaultPreferences(), ...patch };
  saveVaultPreferences(next);
  return next;
}

/** Subscribe to preference changes (sidebar width, settings, etc.). */
export function subscribeVaultPreferences(
  listener: (prefs: VaultPreferences) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<VaultPreferences>).detail;
    listener(detail ?? loadVaultPreferences());
  };

  window.addEventListener(VAULT_PREFS_EVENT, handler);
  return () => window.removeEventListener(VAULT_PREFS_EVENT, handler);
}
