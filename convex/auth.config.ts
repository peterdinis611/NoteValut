import type { AuthConfig } from "convex/server";

/**
 * Clerk JWT validation for Convex.
 * Set `CLERK_JWT_ISSUER_DOMAIN` on the Convex dashboard
 * (Frontend API URL from Clerk → API keys, e.g. https://verb-noun-00.clerk.accounts.dev).
 * Also enable the Convex integration in the Clerk dashboard (JWT template "convex").
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
