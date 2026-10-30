/**
 * Create NoteValut Storage bucket for vault uploads.
 * Requires APPWRITE_API_KEY with storage.read + storage.write.
 *
 * Usage: node --env-file=.env.local scripts/provision-storage.mjs
 */
import { Client, Permission, Role, Storage } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "vault-files";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite env (endpoint, project id, or API key).");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const storage = new Storage(client);

try {
  await storage.getBucket({ bucketId });
  console.log(`Bucket "${bucketId}" already exists.`);
} catch {
  await storage.createBucket({
    bucketId,
    name: "Vault files",
    permissions: [Permission.create(Role.users())],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024,
    allowedFileExtensions: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "pdf",
      "txt",
      "md",
      "csv",
      "json",
    ],
    encryption: true,
    antivirus: true,
    transformations: true,
  });
  console.log(`Created bucket "${bucketId}".`);
}

console.log("Done. Set NEXT_PUBLIC_APPWRITE_BUCKET_ID=" + bucketId);
