"use client";

import { useSyncExternalStore } from "react";
import { migrateLegacyLocalStorageOnce } from "@/db/migrate-legacy";
import {
  getOwnerId,
  ownerCollection,
  SERVER_OWNER_SNAPSHOT,
} from "@/db/owner-collection";

let snapshot = SERVER_OWNER_SNAPSHOT.ownerId;

function readOwnerIdPure(): string {
  if (typeof window === "undefined") return SERVER_OWNER_SNAPSHOT.ownerId;
  return ownerCollection.get("owner")?.ownerId ?? snapshot;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  migrateLegacyLocalStorageOnce();
  try {
    ownerCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
  // Side effects only in subscribe, never in getSnapshot
  const id = getOwnerId();
  if (snapshot !== id) snapshot = id;

  const sub = ownerCollection.subscribeChanges(() => {
    const next = ownerCollection.get("owner")?.ownerId ?? snapshot;
    if (next === snapshot) return;
    snapshot = next;
    onStoreChange();
  });
  return () => sub.unsubscribe();
}

function getClientSnapshot(): string {
  const next = readOwnerIdPure();
  if (next === snapshot) return snapshot;
  snapshot = next;
  return snapshot;
}

function getServerSnapshot(): string {
  return SERVER_OWNER_SNAPSHOT.ownerId;
}

export function useOwnerId() {
  const ownerId = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return ownerId === "server" ? null : ownerId;
}
