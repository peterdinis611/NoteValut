import type { Metadata } from "next";

export const siteConfig = {
  name: "NoteValut",
  shortName: "NoteValut",
  tagline: "Your notes, tags, and vault — together.",
  description:
    "NoteValut is the quiet workspace where better notes stay found. Typed notes with Effect schemas, Appwrite sessions, and a Notion-like vault for folders, pages, and search.",
  locale: "en_US",
  keywords: [
    "NoteValut",
    "notes app",
    "personal knowledge vault",
    "Notion alternative",
    "Appwrite notes",
    "Effect TypeScript",
    "workspace notes",
    "tagged notes",
  ],
} as const;

export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return new URL(raw);
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
  keywords,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: readonly string[];
}): Metadata {
  const url = new URL(path, getSiteUrl());
  const pageTitle = title ?? siteConfig.name;
  const pageDescription = description ?? siteConfig.description;

  return {
    title: title
      ? { absolute: `${title} · ${siteConfig.name}` }
      : siteConfig.name,
    description: pageDescription,
    keywords: [...(keywords ?? siteConfig.keywords)],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: title ? `${title} · ${siteConfig.name}` : siteConfig.name,
      description: pageDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${siteConfig.name}` : siteConfig.name,
      description: pageDescription,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function softwareApplicationJsonLd() {
  const url = getSiteUrl().toString();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Typed notes validated with Effect schemas",
      "Appwrite authentication and SSR sessions",
      "Workspaces, folders, and linked pages",
      "Notion-like editor with slash commands",
      "Search, calendar, storage, and trash",
    ],
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl().toString();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url,
    },
  };
}

export function organizationJsonLd() {
  const url = getSiteUrl().toString();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url,
    description: siteConfig.description,
  };
}
