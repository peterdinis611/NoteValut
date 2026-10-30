/**
 * Add deletedAt (soft delete) to folders + pages tables.
 * Usage: node --env-file=.env.local scripts/migrate-trash-columns.mjs
 */
import { Client, TablesDB } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "notevalut";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite env.");
  process.exit(1);
}

const tablesDB = new TablesDB(
  new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey),
);

async function ensureDeletedAt(tableId) {
  try {
    await tablesDB.createIntegerColumn({
      databaseId,
      tableId,
      key: "deletedAt",
      required: false,
    });
    console.log(`+ ${tableId}.deletedAt`);
  } catch (error) {
    console.log(`· ${tableId}.deletedAt (${error.message ?? "exists"})`);
  }
}

await ensureDeletedAt("folders");
await ensureDeletedAt("pages");
console.log("Done.");
