"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  ensureSettingsRow,
  readSettings,
  settingsCollection,
  SERVER_SETTINGS_SNAPSHOT,
  type SettingsRecord,
} from "@/db/settings-collection";
import { migrateLegacyLocalStorageOnce } from "@/db/migrate-legacy";

let snapshot: SettingsRecord = SERVER_SETTINGS_SNAPSHOT;

function settingsEqual(a: SettingsRecord, b: SettingsRecord): boolean {
  return (
    a.themeId === b.themeId &&
    a.customCss === b.customCss &&
    a.customCssName === b.customCssName &&
    a.fontMode === b.fontMode &&
    a.fontFamily === b.fontFamily &&
    a.fontFileName === b.fontFileName &&
    a.fontDataUrl === b.fontDataUrl &&
    a.fontUrl === b.fontUrl &&
    a.updatedAt === b.updatedAt
  );
}

function pullSnapshot(): SettingsRecord {
  const next = readSettings();
  if (settingsEqual(snapshot, next)) return snapshot;
  snapshot = next;
  return snapshot;
}

/**
 * Subscribe to the TanStack DB settings collection (SSR-safe snapshot).
 * getSnapshot must be pure and referentially stable when data is unchanged.
 */
function subscribeSettings(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  migrateLegacyLocalStorageOnce();
  try {
    settingsCollection.startSyncImmediate();
  } catch {
    /* collection may already be syncing */
  }
  ensureSettingsRow();
  pullSnapshot();

  const subscription = settingsCollection.subscribeChanges(() => {
    const prev = snapshot;
    const next = pullSnapshot();
    if (prev !== next) onStoreChange();
  });
  return () => subscription.unsubscribe();
}

function getClientSnapshot(): SettingsRecord {
  return pullSnapshot();
}

function getServerSnapshot(): SettingsRecord {
  return SERVER_SETTINGS_SNAPSHOT;
}

export function useVaultSettings(): SettingsRecord {
  const record = useSyncExternalStore(
    subscribeSettings,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    migrateLegacyLocalStorageOnce();
    ensureSettingsRow();
    applyTheme(record);
  }, [record]);

  return record;
}
