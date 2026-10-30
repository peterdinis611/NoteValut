/** Redirect target Appwrite appends `userId` + `secret` query params to. */
export const getEmailVerificationUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verify`;
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  return `${base}/verify`;
};
