"use client";

import { useSyncExternalStore } from "react";
import { migrateLegacyLocalStorageOnce } from "@/db/migrate-legacy";
import {
  getOwnerId,
  ownerCollection,
  readOwnerRecord,
  SERVER_OWNER_SNAPSHOT,
} from "@/db/owner-collection";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  migrateLegacyLocalStorageOnce();
  try {
    ownerCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
  getOwnerId();
  const sub = ownerCollection.subscribeChanges(() => {
    cache = null;
    onStoreChange();
  });
  return () => sub.unsubscribe();
}

let cache: string | null = null;
let cacheKey = "";

function getClientSnapshot(): string {
  const record = readOwnerRecord();
  if (cache && cacheKey === record.ownerId) return cache;
  cacheKey = record.ownerId;
  cache = record.ownerId;
  return cache;
}

function getServerSnapshot(): string {
  return SERVER_OWNER_SNAPSHOT.ownerId;
}

export function useOwnerId() {
  const ownerId = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return ownerId === "server" ? null : ownerId;
}
