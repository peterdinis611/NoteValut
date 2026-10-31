import type { MetadataRoute } from "next";

/**
 * Public indexable routes — single source for sitemap.xml + robots.txt.
 * Private app surfaces (vault, verify, password reset, API) stay out.
 */
export const marketingRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/demo",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/signup",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/login",
    changeFrequency: "monthly",
    priority: 0.6,
  },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}>;

/** Paths search engines may crawl (matches sitemap). */
export const robotsAllow = marketingRoutes.map((route) => route.path);

/** Keep private / transactional surfaces out of the index. */
export const robotsDisallow = [
  "/vault",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/api/",
] as const;
