import "server-only";

import { Effect, Schema } from "effect";
import { ID, MessagingProviderType, Query } from "node-appwrite";
import { plainTextFromEditorContent } from "@/lib/editor/content";
import { sanitizeEmailHtml } from "@/lib/editor/sanitize";
import { toSafePageUrl } from "@/lib/editor/safe-url";
import { createAppwriteAdmin } from "./admin";

export class MessagingError extends Schema.TaggedError<MessagingError>()(
  "MessagingError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  },
) {}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

function buildPageEmailHtml(input: {
  title: string;
  bodyHtml: string;
  pageUrl: string;
  fromLabel: string;
}): string {
  const title = escapeHtml(input.title || "Untitled");
  const from = escapeHtml(input.fromLabel);
  const url = escapeHtml(input.pageUrl);
  const body = sanitizeEmailHtml(input.bodyHtml ?? "");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5efe6;color:#2a2218;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:640px;background:#fffdf8;border:1px solid #e6dcc8;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;font-family:ui-sans-serif,system-ui,sans-serif;">
                <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7a66;">NoteValut</p>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">${title}</h1>
                <p style="margin:10px 0 0;font-size:14px;color:#6b5e4e;">Shared by ${from}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 24px;font-size:16px;line-height:1.65;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;font-family:ui-sans-serif,system-ui,sans-serif;">
                <a href="${url}" style="display:inline-block;background:#2a2218;color:#f5efe6;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;">
                  Open in NoteValut
                </a>
                <p style="margin:14px 0 0;font-size:12px;color:#8a7a66;word-break:break-all;">${url}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function resolveRecipientUserIds(
  users: ReturnType<typeof createAppwriteAdmin>["users"],
  senderUserId: string,
  recipientEmail: string,
): Promise<{ users: string[]; targets: string[] }> {
  const email = recipientEmail.trim().toLowerCase();

  const matched = await users.list({
    queries: [Query.equal("email", email), Query.limit(1)],
    total: false,
  });

  const existing = matched.users[0];
  if (existing) {
    return { users: [existing.$id], targets: [] };
  }

  // External address: attach as an email target on the sender, then address it.
  const targetsList = await users.listTargets({
    userId: senderUserId,
    queries: [Query.equal("identifier", email), Query.limit(5)],
    total: false,
  });

  const emailTarget = targetsList.targets.find(
    (target) => target.providerType === "email",
  );
  if (emailTarget) {
    return { users: [], targets: [emailTarget.$id] };
  }

  const created = await users.createTarget({
    userId: senderUserId,
    targetId: ID.unique(),
    providerType: MessagingProviderType.Email,
    identifier: email,
    name: email,
  });

  return { users: [], targets: [created.$id] };
}

export const sendPageByEmail = Effect.fn("sendPageByEmail")(function* (input: {
  senderUserId: string;
  senderName: string;
  senderEmail: string | null;
  recipientEmail: string;
  noteId: string;
  title: string;
  body: string;
}) {
  const recipient = input.recipientEmail.trim().toLowerCase();
  if (!isValidEmail(recipient)) {
    return yield* new MessagingError({
      message: "Enter a valid recipient email.",
    });
  }

  const admin = createAppwriteAdmin();
  const pageUrl = toSafePageUrl({
    noteId: input.noteId,
    title: input.title,
  });
  const fromLabel =
    input.senderName?.trim() || input.senderEmail || "a NoteValut user";
  const subject = `${input.title || "Untitled"} — shared from NoteValut`;
  const html = buildPageEmailHtml({
    title: input.title,
    bodyHtml: input.body,
    pageUrl,
    fromLabel,
  });

  // Keep a plain preview in logs / message metadata via content length check.
  void plainTextFromEditorContent(input.body);

  const routing = yield* Effect.tryPromise({
    try: () =>
      resolveRecipientUserIds(admin.users, input.senderUserId, recipient),
    catch: (cause) =>
      new MessagingError({
        message:
          cause && typeof cause === "object" && "message" in cause
            ? String((cause as { message: unknown }).message)
            : "Could not resolve recipient.",
        cause,
      }),
  });

  const message = yield* Effect.tryPromise({
    try: () =>
      admin.messaging.createEmail({
        messageId: ID.unique(),
        subject,
        content: html,
        users: routing.users,
        targets: routing.targets,
        html: true,
        draft: false,
      }),
    catch: (cause) =>
      new MessagingError({
        message:
          cause && typeof cause === "object" && "message" in cause
            ? String((cause as { message: unknown }).message)
            : "Could not send email. Check Messaging provider in Appwrite Console.",
        cause,
      }),
  });

  return {
    messageId: message.$id,
    recipient,
  };
});
