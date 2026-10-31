import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { marketingRoutes } from "@/lib/seo-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return marketingRoutes.map((route) => ({
    url: new URL(route.path, base).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
