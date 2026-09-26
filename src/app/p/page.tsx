import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

type Props = {
  searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tag } = await searchParams;
  const title = tag ? `Published — #${tag}` : "Published pages";
  const description = tag
    ? `Public NoteVault pages tagged #${tag}`
    : "Browse public pages published from NoteVault";
  const url = absoluteUrl(tag ? `/p?tag=${encodeURIComponent(tag)}` : "/p");
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "NoteVault",
      url,
      title: `${title} — NoteVault`,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublishedIndexPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const [posts, tags] = await Promise.all([
    fetchQuery(api.blog.listPublished, { tag, limit: 50 }),
    fetchQuery(api.blog.listTags, {}),
  ]);

  return (
    <main className="blog-index">
      <header className="blog-index-hero">
        <p className="blog-index-kicker">NoteVault</p>
        <h1 className="blog-index-title">
          Published <em>pages</em>
        </h1>
        <p className="blog-index-sub">
          Public notes from the vault
          {tag ? (
            <>
              {" "}
              · filtered by <strong>#{tag}</strong>
            </>
          ) : null}
        </p>
        <p className="blog-index-links">
          <a href="/p/rss.xml">RSS</a>
          <span aria-hidden>·</span>
          <Link href="/">Open vault</Link>
        </p>
      </header>

      {tags.length > 0 && (
        <nav className="blog-tags" aria-label="Tags">
          <Link href="/p" className={!tag ? "is-active" : undefined}>
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t.tag}
              href={`/p?tag=${encodeURIComponent(t.tag)}`}
              className={tag === t.tag ? "is-active" : undefined}
            >
              #{t.tag}
              <span>{t.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p className="blog-empty">No published pages yet.</p>
      ) : (
        <ul className="blog-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="blog-card">
                {post.ogImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.ogImage} alt="" className="blog-card-cover" />
                ) : (
                  <div className="blog-card-cover is-empty" aria-hidden>
                    {post.icon || "📝"}
                  </div>
                )}
                <div className="blog-card-body">
                  <h2>
                    <Link href={`/p/${post.slug}`}>{post.title || "Untitled"}</Link>
                  </h2>
                  {post.description ? <p>{post.description}</p> : null}
                  <footer>
                    {post.publishedAt ? (
                      <time dateTime={new Date(post.publishedAt).toISOString()}>
                        {new Date(post.publishedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    ) : null}
                    {post.tags.slice(0, 4).map((t) => (
                      <Link key={t} href={`/p?tag=${encodeURIComponent(t)}`}>
                        #{t}
                      </Link>
                    ))}
                  </footer>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "NoteVault Published",
            url: getSiteUrl() + "/p",
            blogPost: posts.slice(0, 20).map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/p/${p.slug}`),
              datePublished: p.publishedAt
                ? new Date(p.publishedAt).toISOString()
                : undefined,
            })),
          }),
        }}
      />
    </main>
  );
}
