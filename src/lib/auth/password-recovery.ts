import "server-only";

import { Effect, Schema } from "effect";
import { ID, Query } from "node-appwrite";
import { isValidEmail } from "@/lib/appwrite/messaging";
import { createAppwriteAdmin } from "@/lib/appwrite/admin";
import { buildRecoveryEmailHtml } from "./recovery-email";
import {
  RECOVERY_PREF_KEY,
  buildResetPasswordUrl,
  createRecoverySecret,
  parseRecoveryPref,
  verifyRecoverySecret,
} from "./recovery";

export class RecoveryError extends Schema.TaggedError<RecoveryError>()(
  "RecoveryError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  },
) {}

const GENERIC_SENT =
  "If an account exists for that email, a reset link is on its way. It expires in 30 minutes.";

/**
 * Start password recovery: email a one-time 30-minute link.
 * Always returns the same message (no account enumeration).
 */
export const requestPasswordRecovery = Effect.fn("requestPasswordRecovery")(
  function* (emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return yield* new RecoveryError({
        message: "Enter a valid email address.",
      });
    }

    const admin = createAppwriteAdmin();

    const listed = yield* Effect.tryPromise({
      try: () =>
        admin.users.list({
          queries: [Query.equal("email", email), Query.limit(1)],
          total: false,
        }),
      catch: (cause) =>
        new RecoveryError({
          message: "Could not start password recovery.",
          cause,
        }),
    });

    const user = listed.users[0];
    if (!user) {
      return { message: GENERIC_SENT };
    }

    const { secret, pref } = createRecoverySecret(user.$id);
    const resetUrl = buildResetPasswordUrl(user.$id, secret);

    const existingPrefs =
      user.prefs && typeof user.prefs === "object" ? { ...user.prefs } : {};

    yield* Effect.tryPromise({
      try: () =>
        admin.users.updatePrefs({
          userId: user.$id,
          prefs: {
            ...existingPrefs,
            [RECOVERY_PREF_KEY]: pref,
          },
        }),
      catch: (cause) =>
        new RecoveryError({
          message: "Could not start password recovery.",
          cause,
        }),
    });

    const html = buildRecoveryEmailHtml({
      userName: user.name || "",
      resetUrl,
    });

    yield* Effect.tryPromise({
      try: () =>
        admin.messaging.createEmail({
          messageId: ID.unique(),
          subject: "Reset your NoteValut password",
          content: html,
          users: [user.$id],
          html: true,
          draft: false,
        }),
      catch: (cause) =>
        new RecoveryError({
          message:
            cause && typeof cause === "object" && "message" in cause
              ? String((cause as { message: unknown }).message)
              : "Could not send reset email. Check Messaging email provider in Appwrite Console.",
          cause,
        }),
    });

    return { message: GENERIC_SENT };
  },
);

/**
 * Complete password recovery with userId + secret from the email link.
 */
export const completePasswordRecovery = Effect.fn("completePasswordRecovery")(
  function* (input: {
    userId: string;
    secret: string;
    password: string;
  }) {
    const userId = input.userId.trim();
    const secret = input.secret.trim();
    const password = input.password;

    if (!userId || !secret) {
      return yield* new RecoveryError({
        message: "This reset link is incomplete. Request a new one.",
      });
    }

    if (password.length < 8) {
      return yield* new RecoveryError({
        message: "Password must be at least 8 characters.",
      });
    }

    const admin = createAppwriteAdmin();

    const prefs = yield* Effect.tryPromise({
      try: () => admin.users.getPrefs({ userId }),
      catch: () =>
        new RecoveryError({
          message: "This reset link is invalid or has expired.",
        }),
    });

    const prefBag = prefs as Record<string, unknown>;
    const stored = parseRecoveryPref(prefBag[RECOVERY_PREF_KEY]);
    const check = verifyRecoverySecret(userId, secret, stored);

    if (!check.ok) {
      const message =
        check.reason === "expired"
          ? "This reset link has expired. Request a new one (links last 30 minutes)."
          : "This reset link is invalid or was already used.";
      return yield* new RecoveryError({ message });
    }

    yield* Effect.tryPromise({
      try: () =>
        admin.users.updatePassword({
          userId,
          password,
        }),
      catch: (cause) =>
        new RecoveryError({
          message:
            cause && typeof cause === "object" && "message" in cause
              ? String((cause as { message: unknown }).message)
              : "Could not update password.",
          cause,
        }),
    });

    const nextPrefs = { ...prefBag };
    delete nextPrefs[RECOVERY_PREF_KEY];

    yield* Effect.tryPromise({
      try: () =>
        admin.users.updatePrefs({
          userId,
          prefs: nextPrefs,
        }),
      catch: (cause) => cause,
    }).pipe(Effect.catch(() => Effect.void));

    yield* Effect.tryPromise({
      try: () => admin.users.deleteSessions({ userId }),
      catch: (cause) => cause,
    }).pipe(Effect.catch(() => Effect.void));

    return {
      message: "Password updated. Sign in with your new password.",
    };
  },
);
