import { Effect } from "effect";
import {
  isValidEmail,
  sendPageByEmail,
} from "@/lib/appwrite/messaging";
import { createAppwriteServer } from "@/lib/appwrite/server";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  rateLimitedResponse,
  rateLimitPresets,
} from "@/lib/rate-limit";

type Body = {
  noteId?: string;
  title?: string;
  body?: string;
  recipientEmail?: string;
};

export async function POST(request: Request) {
  const limit = checkRateLimit(getClientIp(request), {
    name: "api:vault:email-page",
    ...rateLimitPresets.auth,
  });
  if (!limit.success) {
    return rateLimitedResponse(limit);
  }

  const helpers = createAppwriteServer();
  const user = await helpers.getLoggedInUser();
  if (!user) {
    return Response.json(
      { error: "Sign in required." },
      { status: 401, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const noteId = payload.noteId?.trim() ?? "";
  const title = payload.title?.trim() ?? "Untitled";
  const body = sanitizeEditorHtml(payload.body ?? "");
  const recipientEmail = payload.recipientEmail?.trim() ?? "";

  if (!noteId) {
    return Response.json(
      { error: "Missing noteId." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (!isValidEmail(recipientEmail)) {
    return Response.json(
      { error: "Enter a valid recipient email." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (body.length > 100_000) {
    return Response.json(
      { error: "Page body is too large to email." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const result = await Effect.runPromise(
    sendPageByEmail({
      senderUserId: user.$id,
      senderName: user.name || "",
      senderEmail: user.email || null,
      recipientEmail,
      noteId,
      title,
      body,
    }).pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((error) =>
        Effect.succeed({
          ok: false as const,
          message:
            error && typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : "Could not send email.",
        }),
      ),
    ),
  );

  if (!result.ok) {
    return Response.json(
      { error: result.message },
      { status: 502, headers: rateLimitHeaders(limit) },
    );
  }

  return Response.json(
    {
      ok: true,
      messageId: result.value.messageId,
      recipient: result.value.recipient,
    },
    { headers: rateLimitHeaders(limit) },
  );
}
