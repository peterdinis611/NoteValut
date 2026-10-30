/**
 * Add linkedNoteIds (page ↔ page links) to pages table.
 * Usage: node --env-file=.env.local scripts/migrate-linked-notes.mjs
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

try {
  await tablesDB.createVarcharColumn({
    databaseId,
    tableId: "pages",
    key: "linkedNoteIds",
    size: 36,
    required: false,
    array: true,
  });
  console.log("+ pages.linkedNoteIds");
} catch (error) {
  console.log(`· pages.linkedNoteIds (${error.message ?? "exists"})`);
}

console.log("Done.");
