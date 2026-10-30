const appOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
};

/** Redirect target Appwrite appends `userId` + `secret` query params to. */
export const getEmailVerificationUrl = () => `${appOrigin()}/verify`;

/** Optional: Appwrite Console recovery redirect (1h TTL). NoteValut uses Messaging + 30m. */
export const getPasswordRecoveryUrl = () => `${appOrigin()}/reset-password`;
