"use client";

import {
  Permission,
  Query,
  Role,
  type TablesDB,
} from "@appwrite.io/react";
import type { Models } from "appwrite";
import { Effect, Schema } from "effect";
import { Note } from "@/domain/note";
import { Folder, Workspace } from "@/domain/shelf";
import { AppwriteError } from "./errors";
import {
  SHELF_DATABASE_ID,
  TABLE_FOLDERS,
  TABLE_PAGES,
  TABLE_WORKSPACES,
} from "./tables";

const ownerPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

type WorkspaceRow = Models.Row & {
  ownerId: string;
  name: string;
  emoji: string;
  createdAt: number;
};

type FolderRow = Models.Row & {
  ownerId: string;
  workspaceId: string;
  name: string;
  emoji: string;
  createdAt: number;
  deletedAt?: number | null;
};

type PageRow = Models.Row & {
  ownerId: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  body: string;
  tags?: string[] | null;
  linkedNoteIds?: string[] | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
};

const decodeWorkspace = (row: WorkspaceRow) =>
  Schema.decodeUnknownEffect(Workspace)({
    id: row.$id,
    name: row.name,
    emoji: row.emoji,
    createdAt: Number(row.createdAt),
  }).pipe(
    Effect.mapError(
      () =>
        new AppwriteError({
          message: "Invalid workspace row from Appwrite.",
        }),
    ),
  );

const decodeFolder = (row: FolderRow) =>
  Schema.decodeUnknownEffect(Folder)({
    id: row.$id,
    workspaceId: row.workspaceId,
    name: row.name,
    emoji: row.emoji,
    createdAt: Number(row.createdAt),
    deletedAt: row.deletedAt == null ? null : Number(row.deletedAt),
  }).pipe(
    Effect.mapError(
      () =>
        new AppwriteError({
          message: "Invalid folder row from Appwrite.",
        }),
    ),
  );

const decodePage = (row: PageRow) =>
  Schema.decodeUnknownEffect(Note)({
    id: row.$id,
    workspaceId: row.workspaceId,
    folderId: row.folderId || null,
    title: row.title,
    body: row.body ?? "",
    tags: row.tags ?? [],
    linkedNoteIds: row.linkedNoteIds ?? [],
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
    deletedAt: row.deletedAt == null ? null : Number(row.deletedAt),
  }).pipe(
    Effect.mapError(
      () =>
        new AppwriteError({
          message: "Invalid page row from Appwrite.",
        }),
    ),
  );

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

export type ShelfSnapshot = {
  workspaces: Workspace[];
  folders: Folder[];
  notes: Note[];
};

/** Load the signed-in user's workspaces, folders, and pages (including trash). */
export const loadShelf = Effect.fn("loadShelf")(function* (
  tablesDB: TablesDB,
  ownerId: string,
) {
  const workspaceList = yield* tryAppwrite(
    () =>
      tablesDB.listRows<WorkspaceRow>({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_WORKSPACES,
        queries: [
          Query.equal("ownerId", ownerId),
          Query.orderAsc("createdAt"),
          Query.limit(100),
        ],
      }),
    "Failed to load workspaces.",
  );
  const folderList = yield* tryAppwrite(
    () =>
      tablesDB.listRows<FolderRow>({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_FOLDERS,
        queries: [
          Query.equal("ownerId", ownerId),
          Query.orderAsc("createdAt"),
          Query.limit(200),
        ],
      }),
    "Failed to load folders.",
  );
  const pageList = yield* tryAppwrite(
    () =>
      tablesDB.listRows<PageRow>({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_PAGES,
        queries: [
          Query.equal("ownerId", ownerId),
          Query.orderDesc("updatedAt"),
          Query.limit(500),
        ],
      }),
    "Failed to load pages.",
  );

  const workspaces: Workspace[] = [];
  for (const row of workspaceList.rows) {
    workspaces.push(yield* decodeWorkspace(row));
  }
  const folders: Folder[] = [];
  for (const row of folderList.rows) {
    folders.push(yield* decodeFolder(row));
  }
  const notes: Note[] = [];
  for (const row of pageList.rows) {
    notes.push(yield* decodePage(row));
  }

  return { workspaces, folders, notes } satisfies ShelfSnapshot;
});

export const persistWorkspace = Effect.fn("persistWorkspace")(function* (
  tablesDB: TablesDB,
  ownerId: string,
  workspace: Workspace,
) {
  yield* tryAppwrite(
    () =>
      tablesDB.createRow({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_WORKSPACES,
        rowId: workspace.id,
        data: {
          ownerId,
          name: workspace.name,
          emoji: workspace.emoji,
          createdAt: workspace.createdAt,
        },
        permissions: ownerPermissions(ownerId),
      }),
    "Failed to save workspace.",
  );
  return workspace;
});

export const persistFolder = Effect.fn("persistFolder")(function* (
  tablesDB: TablesDB,
  ownerId: string,
  folder: Folder,
) {
  yield* tryAppwrite(
    () =>
      tablesDB.createRow({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_FOLDERS,
        rowId: folder.id,
        data: {
          ownerId,
          workspaceId: folder.workspaceId,
          name: folder.name,
          emoji: folder.emoji,
          createdAt: folder.createdAt,
          deletedAt: folder.deletedAt,
        },
        permissions: ownerPermissions(ownerId),
      }),
    "Failed to save folder.",
  );
  return folder;
});

export const persistPage = Effect.fn("persistPage")(function* (
  tablesDB: TablesDB,
  ownerId: string,
  note: Note,
) {
  yield* tryAppwrite(
    () =>
      tablesDB.createRow({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_PAGES,
        rowId: note.id,
        data: {
          ownerId,
          workspaceId: note.workspaceId,
          folderId: note.folderId,
          title: note.title,
          body: note.body,
          tags: [...(note.tags ?? [])],
          linkedNoteIds: [...(note.linkedNoteIds ?? [])],
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          deletedAt: note.deletedAt,
        },
        permissions: ownerPermissions(ownerId),
      }),
    "Failed to save page.",
  );
  return note;
});

export const persistPageUpdate = Effect.fn("persistPageUpdate")(function* (
  tablesDB: TablesDB,
  note: Note,
) {
  yield* tryAppwrite(
    () =>
      tablesDB.updateRow({
        databaseId: SHELF_DATABASE_ID,
        tableId: TABLE_PAGES,
        rowId: note.id,
        data: {
          title: note.title,
          body: note.body,
          tags: [...(note.tags ?? [])],
          linkedNoteIds: [...(note.linkedNoteIds ?? [])],
          folderId: note.folderId,
          updatedAt: note.updatedAt,
          deletedAt: note.deletedAt,
        },
      }),
    "Failed to update page.",
  );
  return note;
});

export const persistFolderDeletedAt = Effect.fn("persistFolderDeletedAt")(
  function* (tablesDB: TablesDB, folder: Folder) {
    yield* tryAppwrite(
      () =>
        tablesDB.updateRow({
          databaseId: SHELF_DATABASE_ID,
          tableId: TABLE_FOLDERS,
          rowId: folder.id,
          data: { deletedAt: folder.deletedAt },
        }),
      "Failed to update folder trash state.",
    );
    return folder;
  },
);

export const permanentlyDeletePage = Effect.fn("permanentlyDeletePage")(
  function* (tablesDB: TablesDB, noteId: string) {
    yield* tryAppwrite(
      () =>
        tablesDB.deleteRow({
          databaseId: SHELF_DATABASE_ID,
          tableId: TABLE_PAGES,
          rowId: noteId,
        }),
      "Failed to permanently delete page.",
    );
  },
);

export const permanentlyDeleteFolder = Effect.fn("permanentlyDeleteFolder")(
  function* (tablesDB: TablesDB, folderId: string) {
    yield* tryAppwrite(
      () =>
        tablesDB.deleteRow({
          databaseId: SHELF_DATABASE_ID,
          tableId: TABLE_FOLDERS,
          rowId: folderId,
        }),
      "Failed to permanently delete folder.",
    );
  },
);
