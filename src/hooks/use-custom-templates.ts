"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  loadCustomTemplates,
  templatesCollection,
  type CustomPageTemplate,
} from "@/db/templates-collection";
import { migrateLegacyLocalStorageOnce } from "@/db/migrate-legacy";

const SERVER_TEMPLATES: CustomPageTemplate[] = [];

let snapshot: CustomPageTemplate[] = SERVER_TEMPLATES;
let snapshotKey = "";

function templatesKey(rows: CustomPageTemplate[]): string {
  return JSON.stringify(rows.map((r) => [r.id, r.createdAt, r.name]));
}

function pullSnapshot(): CustomPageTemplate[] {
  const rows = loadCustomTemplates();
  const key = templatesKey(rows);
  if (snapshotKey === key) return snapshot;
  snapshotKey = key;
  snapshot = rows;
  return snapshot;
}

function subscribeTemplates(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  migrateLegacyLocalStorageOnce();
  try {
    templatesCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
  pullSnapshot();
  const subscription = templatesCollection.subscribeChanges(() => {
    const prev = snapshot;
    const next = pullSnapshot();
    if (prev !== next) onStoreChange();
  });
  return () => subscription.unsubscribe();
}

function getClientSnapshot(): CustomPageTemplate[] {
  return pullSnapshot();
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
