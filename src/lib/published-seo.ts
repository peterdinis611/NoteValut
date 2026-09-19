import type { Metadata } from "next";
import type { Block } from "@/lib/blocks";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

const SITE_NAME = "NoteVault";

export type PublishedSeoInput = {
  slug: string;
  title: string;
  description?: string | null;
  ogImage?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  publishedAt?: number | null;
  updatedAt?: number | null;
  icon?: string | null;
  blocks?: Block[] | null;
};

function firstImageFromBlocks(blocks: Block[] | null | undefined): string | undefined {
  if (!blocks) return undefined;
  for (const b of blocks) {
    if (b.type === "image" && b.url?.trim()) return b.url.trim();
  }
  return undefined;
}

function plainExcerpt(blocks: Block[] | null | undefined, max = 160): string {
  if (!blocks?.length) return "";
  const parts: string[] = [];
  for (const b of blocks) {
    if (
      b.type === "paragraph" ||
      b.type === "heading1" ||
      b.type === "heading2" ||
      b.type === "heading3" ||
      b.type === "quote" ||
      b.type === "callout"
    ) {
      const t = b.text?.trim();
      if (t) parts.push(t);
    }
    if (parts.join(" ").length > max) break;
  }
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function resolveShareImage(input: PublishedSeoInput): string | undefined {
  return (
    input.ogImage?.trim() ||
    input.coverImage?.trim() ||
    firstImageFromBlocks(input.blocks) ||
    undefined
  );
}

export function buildPublishedMetadata(input: PublishedSeoInput): Metadata {
  const title = (input.title || "Untitled").trim();
  const description =
    (input.description || "").trim() ||
    plainExcerpt(input.blocks) ||
    `Read “${title}” on ${SITE_NAME}`;
  const url = absoluteUrl(`/p/${input.slug}`);
  const image = resolveShareImage(input);
  const absoluteImage = image ? absoluteUrl(image) : undefined;
  const published = input.publishedAt ? new Date(input.publishedAt).toISOString() : undefined;
  const modified = input.updatedAt ? new Date(input.updatedAt).toISOString() : published;
  const tags = (input.tags ?? []).filter(Boolean);

  const ogImages = absoluteImage
    ? [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: title,
          type: guessImageMime(absoluteImage),
        },
      ]
    : undefined;

  return {
    title: `${title} — ${SITE_NAME}`,
    description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    keywords: tags.length ? tags : undefined,
    category: "notes",
    alternates: {
      canonical: url,
    },
    robots: {
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
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "en_US",
      url,
      title,
      description,
      images: ogImages,
      publishedTime: published,
      modifiedTime: modified,
      tags: tags.length ? tags : undefined,
      authors: [SITE_NAME],
    },
    twitter: {
      card: absoluteImage ? "summary_large_image" : "summary",
      title,
      description,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
  };
}

function guessImageMime(url: string): string | undefined {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  if (lower.includes(".svg")) return "image/svg+xml";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  return undefined;
}

/** JSON-LD Article (+ ImageObject when present). */
export function buildPublishedJsonLd(input: PublishedSeoInput) {
  const title = (input.title || "Untitled").trim();
  const description =
    (input.description || "").trim() || plainExcerpt(input.blocks) || undefined;
  const url = absoluteUrl(`/p/${input.slug}`);
  const image = resolveShareImage(input);
  const absoluteImage = image ? absoluteUrl(image) : undefined;
  const published = input.publishedAt
    ? new Date(input.publishedAt).toISOString()
    : undefined;
  const modified = input.updatedAt
    ? new Date(input.updatedAt).toISOString()
    : published;

  const imagesFromBlocks = (input.blocks ?? [])
    .filter((b) => b.type === "image" && b.url)
    .slice(0, 8)
    .map((b) => ({
      "@type": "ImageObject" as const,
      contentUrl: absoluteUrl(b.url!),
      caption: b.label || b.text || undefined,
      name: b.label || b.text || title,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
    datePublished: published,
    dateModified: modified,
    keywords: (input.tags ?? []).join(", ") || undefined,
    image: absoluteImage
      ? {
          "@type": "ImageObject",
          contentUrl: absoluteImage,
          url: absoluteImage,
          caption: title,
        }
      : imagesFromBlocks[0],
    associatedMedia: imagesFromBlocks.length ? imagesFromBlocks : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icons/icon-512.svg"),
      },
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}
