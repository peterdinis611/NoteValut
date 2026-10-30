import { cacheLife } from "next/cache";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

/** Cached marketing JSON-LD graph for the landing page. */
export async function getMarketingJsonLd() {
  "use cache";
  cacheLife("marketing");

  return [websiteJsonLd(), organizationJsonLd(), softwareApplicationJsonLd()];
}
