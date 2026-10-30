"use client";

import {
  ID,
  Permission,
  Query,
  Role,
  type Storage,
} from "@appwrite.io/react";
import type { Models } from "appwrite";
import { Effect } from "effect";
import { AppwriteError } from "./errors";

export const VAULT_BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "vault-files";

const ownerPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const tryAppwrite = <A>(tryFn: () => Promise<A>, message: string) =>
  Effect.tryPromise({
    try: tryFn,
    catch: (cause) =>
      new AppwriteError({
        message:
          cause && typeof cause === "object" && "message" in cause
            ? String((cause as { message: unknown }).message)
            : message,
        cause,
      }),
  });

export const listVaultFiles = Effect.fn("listVaultFiles")(function* (
  storage: Storage,
) {
  const list = yield* tryAppwrite(
    () =>
      storage.listFiles({
        bucketId: VAULT_BUCKET_ID,
        queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
      }),
    "Failed to list files.",
  );
  return list.files;
});

export const uploadVaultFile = Effect.fn("uploadVaultFile")(function* (
  storage: Storage,
  ownerId: string,
  file: File,
) {
  const created = yield* tryAppwrite(
    () =>
      storage.createFile({
        bucketId: VAULT_BUCKET_ID,
        fileId: ID.unique(),
        file,
        permissions: ownerPermissions(ownerId),
      }),
    "Failed to upload file.",
  );
  return created;
});

export const deleteVaultFile = Effect.fn("deleteVaultFile")(function* (
  storage: Storage,
  fileId: string,
) {
  yield* tryAppwrite(
    () =>
      storage.deleteFile({
        bucketId: VAULT_BUCKET_ID,
        fileId,
      }),
    "Failed to delete file.",
  );
});

export const getVaultFileViewUrl = (storage: Storage, fileId: string) =>
  storage.getFileView({
    bucketId: VAULT_BUCKET_ID,
    fileId,
  });

export const getVaultFilePreviewUrl = (
  storage: Storage,
  fileId: string,
  width = 320,
) =>
  storage.getFilePreview({
    bucketId: VAULT_BUCKET_ID,
    fileId,
    width,
    height: width,
  });

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export type VaultFile = Models.File;
