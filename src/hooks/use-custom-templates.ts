"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  loadCustomTemplates,
  templatesCollection,
  type CustomPageTemplate,
} from "@/db/templates-collection";
import { migrateLegacyLocalStorageOnce } from "@/db/migrate-legacy";

const SERVER_TEMPLATES: CustomPageTemplate[] = [];

function subscribeTemplates(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  migrateLegacyLocalStorageOnce();
  try {
    templatesCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
  const subscription = templatesCollection.subscribeChanges(() => {
    clientCache = null;
    onStoreChange();
  });
  return () => subscription.unsubscribe();
}

let clientCache: CustomPageTemplate[] | null = null;
let clientCacheKey = "";

function getClientSnapshot(): CustomPageTemplate[] {
  const rows = loadCustomTemplates();
  const key = JSON.stringify(rows.map((r) => [r.id, r.createdAt, r.name]));
  if (clientCache && clientCacheKey === key) return clientCache;
  clientCacheKey = key;
  clientCache = [...rows].sort((a, b) => b.createdAt - a.createdAt);
  return clientCache;
}

function getServerSnapshot(): CustomPageTemplate[] {
  return SERVER_TEMPLATES;
}

/** Reactive list of user templates from TanStack DB. */
export function useCustomTemplates(): CustomPageTemplate[] {
  useEffect(() => {
    migrateLegacyLocalStorageOnce();
  }, []);

  return useSyncExternalStore(
    subscribeTemplates,
    getClientSnapshot,
    getServerSnapshot,
  );
}
