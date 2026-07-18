"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  getSettings,
  settingsCollection,
  SERVER_SETTINGS_SNAPSHOT,
  type SettingsRecord,
} from "@/db/settings-collection";
import { migrateLegacyLocalStorageOnce } from "@/db/migrate-legacy";

/**
 * Subscribe to the TanStack DB settings collection (SSR-safe snapshot).
 */
function subscribeSettings(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  migrateLegacyLocalStorageOnce();
  try {
    settingsCollection.startSyncImmediate();
  } catch {
    /* collection may already be syncing */
  }
  const subscription = settingsCollection.subscribeChanges(() => {
    clientCache = null;
    onStoreChange();
  });
  return () => subscription.unsubscribe();
}

let clientCache: SettingsRecord | null = null;
let clientCacheKey = "";

function getClientSnapshot(): SettingsRecord {
  const row = settingsCollection.get("vault");
  const key = row ? JSON.stringify(row) : "__default__";
  if (clientCache && clientCacheKey === key) return clientCache;
  clientCacheKey = key;
  clientCache = getSettings();
  return clientCache;
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
    applyTheme(record);
  }, [record]);

  return record;
}
