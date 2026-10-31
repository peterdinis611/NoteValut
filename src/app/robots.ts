import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { robotsAllow, robotsDisallow } from "@/lib/seo-routes";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().toString();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [...robotsAllow],
        disallow: [...robotsDisallow],
      },
    ],
    sitemap: `${base}sitemap.xml`,
    host: base.replace(/\/$/, ""),
  };
}
