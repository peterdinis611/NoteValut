import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await fetchQuery(api.blog.listPublished, { limit: 50 });
  const site = getSiteUrl();

  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/p/${p.slug}`);
      const date = p.publishedAt ? new Date(p.publishedAt).toUTCString() : new Date().toUTCString();
      return `
    <item>
      <title>${escapeXml(p.title || "Untitled")}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(p.description || "")}</description>
      ${p.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>NoteVault — Published</title>
    <link>${escapeXml(site)}/p</link>
    <description>Public pages from NoteVault</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
