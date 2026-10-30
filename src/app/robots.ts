import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().toString();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/demo"],
        disallow: [
          "/vault",
          "/verify",
          "/forgot-password",
          "/reset-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}sitemap.xml`,
    host: base.replace(/\/$/, ""),
  };
}
