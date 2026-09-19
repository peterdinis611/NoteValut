import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { SharedVaultApp } from "@/components/shared-vault-app";
import { api } from "../../../../convex/_generated/api";
import { absoluteUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const bundle = await fetchQuery(api.shares.getSharedVault, { token }).catch(() => null);
  const url = absoluteUrl(`/share/${token}`);

  if (!bundle) {
    return {
      title: "Shared vault — NoteVault",
      robots: { index: false, follow: false },
    };
  }

  if ("expired" in bundle) {
    return {
      title: `${bundle.label || "Shared vault"} — NoteVault`,
      description: "This share link has expired",
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        siteName: "NoteVault",
        title: bundle.label || "Shared vault",
        description: "This share link has expired",
        url,
      },
    };
  }

  if ("locked" in bundle) {
    return {
      title: `${bundle.label || "Shared vault"} — NoteVault`,
      description: "Password-protected NoteVault share",
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        siteName: "NoteVault",
        title: bundle.label || "Shared vault",
        description: "Password-protected NoteVault share",
        url,
      },
    };
  }

  const title = bundle.share.label || bundle.rootNote?.title || "Shared vault";
  const description =
    bundle.rootNote?.description?.trim() ||
    `Shared ${bundle.share.permission === "write" ? "editable" : "read-only"} NoteVault link`;
  const cover = bundle.rootNote?.coverImage;
  const ogImage = cover ? absoluteUrl(cover) : absoluteUrl("/icons/icon-512.svg");

  return {
    title: `${title} — NoteVault`,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "NoteVault",
      locale: "en_US",
      url,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: cover ? 1200 : 512,
          height: cover ? 630 : 512,
          alt: title,
        },
      ],
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  return <SharedVaultApp token={token} />;
}
