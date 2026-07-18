import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import * as v from "valibot";

export const OwnerRecordSchema = v.object({
  id: v.literal("owner"),
  ownerId: v.pipe(v.string(), v.minLength(1)),
  updatedAt: v.number(),
});

export type OwnerRecord = v.InferOutput<typeof OwnerRecordSchema>;

export const ownerCollection = createCollection(
  localStorageCollectionOptions({
    id: "nv-owner",
    storageKey: "notevault.db.owner",
    getKey: (item) => item.id,
    schema: OwnerRecordSchema,
  }),
);

export const SERVER_OWNER_SNAPSHOT: OwnerRecord = Object.freeze({
  id: "owner",
  ownerId: "server",
  updatedAt: 0,
});

function ensureOwnerSynced() {
  if (typeof window === "undefined") return;
  try {
    ownerCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
}

/** Stable vault identity — stored only via TanStack DB. */
export function getOwnerId(): string {
  if (typeof window === "undefined") return SERVER_OWNER_SNAPSHOT.ownerId;
  ensureOwnerSynced();
  const existing = ownerCollection.get("owner");
  if (existing?.ownerId) return existing.ownerId;

  const ownerId = crypto.randomUUID();
  const record: OwnerRecord = {
    id: "owner",
    ownerId,
    updatedAt: Date.now(),
  };
  if (ownerCollection.has("owner")) {
    ownerCollection.update("owner", (draft) => {
      draft.ownerId = ownerId;
      draft.updatedAt = record.updatedAt;
    });
  } else {
    ownerCollection.insert(record);
  }
  return ownerId;
}

export function readOwnerRecord(): OwnerRecord {
  if (typeof window === "undefined") return SERVER_OWNER_SNAPSHOT;
  ensureOwnerSynced();
  const existing = ownerCollection.get("owner");
  if (existing) return existing;
  getOwnerId();
  return ownerCollection.get("owner") ?? {
    id: "owner",
    ownerId: getOwnerId(),
    updatedAt: Date.now(),
  };
}
