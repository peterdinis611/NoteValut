import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Block } from "@/lib/blocks";
import {
  buildPublishedJsonLd,
  buildPublishedMetadata,
  resolveShareImage,
} from "@/lib/published-seo";
import { absoluteUrl } from "@/lib/site-url";
import { PublishedMath } from "./published-math";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pub = await fetchQuery(api.publications.getBySlug, { slug });
  if (!pub) {
    return {
      title: "Not found — NoteVault",
      robots: { index: false, follow: false },
    };
  }
  return buildPublishedMetadata(pub);
}

export default async function PublishedPage({ params }: Props) {
  const { slug } = await params;
  const pub = await fetchQuery(api.publications.getBySlug, { slug });
  if (!pub) notFound();

  const blocks = (pub.blocks ?? []) as Block[];
  const shareImage = resolveShareImage(pub);
  const jsonLd = buildPublishedJsonLd(pub);
  const publishedIso = pub.publishedAt ? new Date(pub.publishedAt).toISOString() : undefined;
  const modifiedIso = pub.updatedAt ? new Date(pub.updatedAt).toISOString() : publishedIso;

  return (
    <div className="published-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a className="published-skip" href="#published-content">
        Skip to content
      </a>

      <article
        className="published-article"
        itemScope
        itemType="https://schema.org/Article"
      >
        <link itemProp="mainEntityOfPage" href={absoluteUrl(`/p/${pub.slug}`)} />
        <meta itemProp="headline" content={pub.title || "Untitled"} />
        {pub.description ? <meta itemProp="description" content={pub.description} /> : null}
        {shareImage ? <link itemProp="image" href={absoluteUrl(shareImage)} /> : null}

        {(pub.coverImage || pub.coverColor) && (
          <figure
            className={`published-cover ${pub.coverColor ? `bg-gradient-to-br ${pub.coverColor}` : ""}`}
            itemProp="image"
            itemScope
            itemType="https://schema.org/ImageObject"
          >
            {pub.coverImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="published-cover-img"
                  src={pub.coverImage}
                  alt={pub.title ? `Cover for ${pub.title}` : "Article cover"}
                  width={1600}
                  height={640}
                  decoding="async"
                  fetchPriority="high"
                  itemProp="contentUrl"
                />
                <meta itemProp="url" content={absoluteUrl(pub.coverImage)} />
              </>
            ) : (
              <div className="published-cover-fallback" role="img" aria-label="Cover" />
            )}
          </figure>
        )}

        <header className="published-header">
          {pub.icon ? (
            <p className="published-icon" aria-hidden>
              {pub.icon}
            </p>
          ) : null}
          <h1 className="published-title" itemProp="headline">
            {pub.title || "Untitled"}
          </h1>
          {pub.description ? (
            <p className="published-description" itemProp="description">
              {pub.description}
            </p>
          ) : null}
          {pub.tags && pub.tags.length > 0 ? (
            <ul className="published-tags" aria-label="Tags">
              {pub.tags.map((tag) => (
                <li key={tag}>
                  <span itemProp="keywords">#{tag}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="published-meta">
            {publishedIso ? (
              <>
                <span>Published </span>
                <time dateTime={publishedIso} itemProp="datePublished">
                  {new Date(publishedIso).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            ) : null}
            {modifiedIso && modifiedIso !== publishedIso ? (
              <>
                <span aria-hidden> · </span>
                <span>Updated </span>
                <time dateTime={modifiedIso} itemProp="dateModified">
                  {new Date(modifiedIso).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </>
            ) : publishedIso ? (
              <meta itemProp="dateModified" content={publishedIso} />
            ) : null}
          </p>
        </header>

        <section
          id="published-content"
          className="published-body"
          itemProp="articleBody"
          aria-label="Article body"
        >
          <PublishedBlocks blocks={blocks} />
        </section>

        <footer className="published-footer">
          <nav aria-label="Site">
            <a href="/" rel="home">
              NoteVault
            </a>
          </nav>
          <p className="published-footer-copy" itemProp="publisher" itemScope itemType="https://schema.org/Organization">
            <span itemProp="name">NoteVault</span>
            <link itemProp="url" href={absoluteUrl("/")} />
          </p>
        </footer>
      </article>
    </div>
  );
}

function PublishedBlocks({ blocks }: { blocks: Block[] }) {
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i]!;
    if (block.type === "bullet" || block.type === "numbered") {
      const listType = block.type;
      const items: Block[] = [];
      while (i < blocks.length && blocks[i]!.type === listType) {
        items.push(blocks[i]!);
        i += 1;
      }
      const Tag = listType === "bullet" ? "ul" : "ol";
      elements.push(
        <Tag key={`${listType}-${items[0]!.id}`} className="published-list">
          {items.map((item) => (
            <li key={item.id} style={indentStyle(item.indent)}>
              {item.text}
            </li>
          ))}
        </Tag>,
      );
      continue;
    }

    elements.push(<PublishedBlock key={block.id} block={block} />);
    i += 1;
  }

  return <>{elements}</>;
}

function indentStyle(indent?: number): CSSProperties | undefined {
  if (!indent) return undefined;
  return { marginLeft: `${indent * 1.25}rem` };
}

function PublishedBlock({ block }: { block: Block }) {
  const style = indentStyle(block.indent);

  switch (block.type) {
    case "heading1":
      return (
        <h2 className="published-h1" style={style}>
          {block.text}
        </h2>
      );
    case "heading2":
      return (
        <h2 className="published-h2" style={style}>
          {block.text}
        </h2>
      );
    case "heading3":
      return (
        <h3 className="published-h3" style={style}>
          {block.text}
        </h3>
      );
    case "heading4":
      return (
        <h4 className="published-h4" style={style}>
          {block.text}
        </h4>
      );
    case "heading5":
      return (
        <h5 className="published-h5" style={style}>
          {block.text}
        </h5>
      );
    case "heading6":
      return (
        <h6 className="published-h6" style={style}>
          {block.text}
        </h6>
      );
    case "quote":
      return (
        <blockquote className="published-quote" cite={undefined} style={style}>
          <p>{block.text}</p>
        </blockquote>
      );
    case "code":
      return (
        <figure className="published-code-figure" style={style}>
          <pre className="published-code">
            <code
              className={
                block.language && block.language !== "auto"
                  ? `language-${block.language}`
                  : undefined
              }
            >
              {block.text}
            </code>
          </pre>
          {block.language && block.language !== "auto" ? (
            <figcaption className="published-code-caption">{block.language}</figcaption>
          ) : null}
        </figure>
      );
    case "divider":
      return <hr className="published-divider" />;
    case "todo":
      return (
        <p className="published-todo" style={style}>
          <input type="checkbox" checked={Boolean(block.checked)} readOnly disabled />{" "}
          <span className={block.checked ? "published-todo-done" : undefined}>{block.text}</span>
        </p>
      );
    case "callout":
      return (
        <aside
          className={`published-callout published-callout-${block.calloutVariant ?? "info"}`}
          style={style}
          role="note"
        >
          <p>{block.text}</p>
        </aside>
      );
    case "image":
      return block.url ? (
        <figure
          className={`published-image published-image-${block.align ?? "center"}`}
          style={{ ...style, width: block.width ? `${block.width}%` : undefined }}
          itemScope
          itemType="https://schema.org/ImageObject"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.label || block.text || "Illustration"}
            loading="lazy"
            decoding="async"
            itemProp="contentUrl"
          />
          <meta itemProp="url" content={absoluteUrl(block.url)} />
          {(block.label || block.text) && (
            <figcaption itemProp="caption">{block.label || block.text}</figcaption>
          )}
        </figure>
      ) : null;
    case "video":
      return block.url ? (
        <figure className="published-video" style={style}>
          <video
            src={block.url}
            controls
            preload="metadata"
            playsInline
            title={block.label || block.text || "Video"}
          >
            <a href={block.url}>Download video</a>
          </video>
          {(block.label || block.text) && <figcaption>{block.label || block.text}</figcaption>}
        </figure>
      ) : null;
    case "link":
    case "pagelink":
      return (
        <p className="published-link" style={style}>
          {block.url ? (
            <a href={block.url} target="_blank" rel="noopener noreferrer">
              {block.label || block.text || block.url}
            </a>
          ) : (
            block.text || block.label
          )}
        </p>
      );
    case "math":
      return (
        <figure className="published-math" style={style} role="math" aria-label="Equation">
          <PublishedMath latex={block.text} />
          <figcaption className="sr-only">{block.text}</figcaption>
        </figure>
      );
    case "table":
      if (!block.rows?.length) return null;
      return (
        <figure className="published-table-wrap" style={style}>
          <table className="published-table">
            <caption className="sr-only">{block.label || "Data table"}</caption>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={`${block.id}-r${ri}`}>
                  {row.map((cell, ci) =>
                    ri === 0 ? (
                      <th key={`${block.id}-r${ri}-c${ci}`} scope="col">
                        {cell}
                      </th>
                    ) : (
                      <td key={`${block.id}-r${ri}-c${ci}`}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    case "toggle":
      return (
        <details className="published-toggle" style={style}>
          <summary>{block.text || "Details"}</summary>
        </details>
      );
    case "file":
    case "pdf":
      return block.url ? (
        <p className="published-file" style={style}>
          <a href={block.url} target="_blank" rel="noopener noreferrer" download={block.type === "file"}>
            {block.label || block.text || "Download file"}
          </a>
        </p>
      ) : (
        <p className="published-p" style={style}>
          {block.text}
        </p>
      );
    default:
      return block.text?.trim() ? (
        <p className="published-p" style={style}>
          {block.text}
        </p>
      ) : null;
  }
}
