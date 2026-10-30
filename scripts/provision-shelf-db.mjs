/**
 * One-shot: create NoteValut database + workspaces/folders/pages tables.
 * Requires APPWRITE_API_KEY with databases.read + databases.write.
 *
 * Usage: node --env-file=.env.local scripts/provision-shelf-db.mjs
 */
import {
  Client,
  ID,
  Permission,
  Role,
  TablesDB,
  TablesDBIndexType,
} from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "notevalut";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite env (endpoint, project id, or API key).");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const tablesDB = new TablesDB(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureDatabase() {
  try {
    await tablesDB.get({ databaseId });
    console.log(`Database "${databaseId}" already exists.`);
  } catch {
    await tablesDB.create({ databaseId, name: "NoteValut" });
    console.log(`Created database "${databaseId}".`);
  }
}

async function ensureTable(tableId, name, columns, indexColumns) {
  try {
    await tablesDB.getTable({ databaseId, tableId });
    console.log(`Table "${tableId}" already exists.`);
    return;
  } catch {
    // create below
  }

  await tablesDB.createTable({
    databaseId,
    tableId,
    name,
    permissions: [Permission.create(Role.users())],
    rowSecurity: true,
  });
  console.log(`Created table "${tableId}".`);

  for (const column of columns) {
    const { kind, ...params } = column;
    if (kind === "varchar") {
      await tablesDB.createVarcharColumn({ databaseId, tableId, ...params });
    } else if (kind === "integer") {
      await tablesDB.createIntegerColumn({ databaseId, tableId, ...params });
    } else if (kind === "mediumtext") {
      await tablesDB.createMediumtextColumn({ databaseId, tableId, ...params });
    } else if (kind === "string") {
      await tablesDB.createStringColumn({ databaseId, tableId, ...params });
    }
    console.log(`  + column ${params.key}`);
  }

  // Indexes need available columns.
  await sleep(1500);

  for (const key of indexColumns) {
    try {
      await tablesDB.createIndex({
        databaseId,
        tableId,
        key: `${key}_idx`,
        type: TablesDBIndexType.Key,
        columns: [key],
      });
      console.log(`  + index ${key}_idx`);
    } catch (error) {
      console.warn(`  ! index ${key}_idx:`, error.message ?? error);
    }
  }
}

await ensureDatabase();

await ensureTable(
  "workspaces",
  "Workspaces",
  [
    { kind: "varchar", key: "ownerId", size: 36, required: true },
    { kind: "varchar", key: "name", size: 80, required: true },
    { kind: "varchar", key: "emoji", size: 8, required: true },
    { kind: "integer", key: "createdAt", required: true },
  ],
  ["ownerId"],
);

await ensureTable(
  "folders",
  "Folders",
  [
    { kind: "varchar", key: "ownerId", size: 36, required: true },
    { kind: "varchar", key: "workspaceId", size: 36, required: true },
    { kind: "varchar", key: "name", size: 80, required: true },
    { kind: "varchar", key: "emoji", size: 8, required: true },
    { kind: "integer", key: "createdAt", required: true },
    { kind: "integer", key: "deletedAt", required: false },
  ],
  ["ownerId", "workspaceId"],
);

await ensureTable(
  "pages",
  "Pages",
  [
    { kind: "varchar", key: "ownerId", size: 36, required: true },
    { kind: "varchar", key: "workspaceId", size: 36, required: true },
    { kind: "varchar", key: "folderId", size: 36, required: false },
    { kind: "varchar", key: "title", size: 120, required: true },
    { kind: "mediumtext", key: "body", required: true },
    { kind: "varchar", key: "tags", size: 24, required: false, array: true },
    {
      kind: "varchar",
      key: "linkedNoteIds",
      size: 36,
      required: false,
      array: true,
    },
    { kind: "integer", key: "createdAt", required: true },
    { kind: "integer", key: "updatedAt", required: true },
    { kind: "integer", key: "deletedAt", required: false },
  ],
  ["ownerId", "workspaceId", "folderId"],
);

console.log("Done. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID=" + databaseId);
void ID;
