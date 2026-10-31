import "server-only";

import { Effect, Schema } from "effect";
import { ID, MessagingProviderType, Query } from "node-appwrite";
import { buildPageShareEmailHtml } from "@/lib/email/page-share-email";
import { plainTextFromEditorContent } from "@/lib/editor/content";
import { toSafePageUrl } from "@/lib/editor/safe-url";
import { createAppwriteAdmin } from "./admin";

export class MessagingError extends Schema.TaggedError<MessagingError>()(
  "MessagingError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  },
) {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
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
  const html = buildPageShareEmailHtml({
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
