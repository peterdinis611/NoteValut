import { Client, Storage } from "node-appwrite";
import { createAppwriteServer } from "@/lib/appwrite/server";
import { getAppwritePublicConfig } from "@/lib/appwrite/env";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  rateLimitedResponse,
  rateLimitPresets,
} from "@/lib/rate-limit";

const VAULT_BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "vault-files";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const limit = checkRateLimit(getClientIp(request), {
    name: "api:vault:file-view",
    ...rateLimitPresets.apiGet,
  });
  if (!limit.success) {
    return rateLimitedResponse(limit);
  }

  const helpers = createAppwriteServer();
  const user = await helpers.getLoggedInUser();
  const session = await helpers.readSessionCookie();
  if (!user || !session) {
    return Response.json(
      { error: "Sign in required." },
      { status: 401, headers: rateLimitHeaders(limit) },
    );
  }

  const { fileId } = await context.params;
  if (!fileId || !/^[a-zA-Z0-9._-]{1,128}$/.test(fileId)) {
    return Response.json(
      { error: "Invalid file id." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const { endpoint, projectId } = getAppwritePublicConfig();
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(session);
  const storage = new Storage(client);

  try {
    const meta = await storage.getFile({
      bucketId: VAULT_BUCKET_ID,
      fileId,
    });
    const buffer = await storage.getFileDownload({
      bucketId: VAULT_BUCKET_ID,
      fileId,
    });

    const safeName = meta.name.replace(/[^\w.\- ()[\]]+/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        ...rateLimitHeaders(limit),
        "Content-Type": meta.mimeType || "application/octet-stream",
        "Content-Length": String(meta.sizeOriginal),
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, max-age=60",
        "X-Vault-File-Name": encodeURIComponent(meta.name),
      },
    });
  } catch (cause) {
    const message =
      cause && typeof cause === "object" && "message" in cause
        ? String((cause as { message: unknown }).message)
        : "Could not load file.";
    return Response.json(
      { error: message },
      { status: 404, headers: rateLimitHeaders(limit) },
    );
  }
}
