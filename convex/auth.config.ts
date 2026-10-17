import type { AuthConfig } from "convex/server";

/**
 * Clerk JWT validation for Convex.
 * Domain must match Clerk Frontend API URL (JWT template Issuer).
 * Env override: set CLERK_JWT_ISSUER_DOMAIN on the Convex deployment.
 */
const CLERK_ISSUER =
  process.env.CLERK_JWT_ISSUER_DOMAIN ||
  "https://precious-foal-74.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: CLERK_ISSUER,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
