import { fetchAction, fetchQuery, preloadQuery } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";

export type GoogleFontsSearchArgs = {
  q?: string;
  category?: string;
  sort?: "popularity" | "alpha";
  limit?: number;
};

type ConvexAuthOptions = {
  token?: string;
  url?: string;
  skipConvexDeploymentUrlCheck?: boolean;
};

export type PreloadedGoogleFontsSearch = Preloaded<typeof api.googleFonts.search>;

/**
 * Server Components / Route Handlers: one-shot search of the cached catalog.
 * Pass Clerk JWT via `options.token` when calling outside an authed ConvexProvider.
 */
export async function fetchGoogleFonts(
  args: GoogleFontsSearchArgs = {},
  options?: ConvexAuthOptions,
) {
  return await fetchQuery(api.googleFonts.search, args, options);
}

/**
 * Server Components: preload for `usePreloadedQuery` in a Client Component.
 */
export async function preloadGoogleFonts(
  args: GoogleFontsSearchArgs = {},
  options?: ConvexAuthOptions,
): Promise<PreloadedGoogleFontsSearch> {
  return await preloadQuery(api.googleFonts.search, args, options);
}

/**
 * Server Actions / RSC: warm the catalog cache (HTTP fetch on Convex).
 */
export async function ensureGoogleFontsCatalog(opts?: { force?: boolean } & ConvexAuthOptions) {
  const { force, ...options } = opts ?? {};
  return await fetchAction(api.googleFonts.ensure, { force }, options);
}
