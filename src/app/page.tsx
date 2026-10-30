import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata, siteConfig } from "@/lib/seo";
import { getMarketingJsonLd } from "@/lib/seo-cache";

export const metadata: Metadata = createPageMetadata({
  description: siteConfig.description,
  path: "/",
});

export default async function Home() {
  const jsonLd = await getMarketingJsonLd();

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingPage />
    </>
  );
}
