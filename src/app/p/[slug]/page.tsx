import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Block } from "@/lib/blocks";
import { PublishedMath } from "./published-math";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pub = await fetchQuery(api.publications.getBySlug, { slug });
  if (!pub) {
    return { title: "Not found — NoteVault" };
  }
  const title = pub.title || "Untitled";
  const description = pub.description || undefined;
  const images = pub.ogImage ? [{ url: pub.ogImage }] : undefined;
  return {
    title: `${title} — NoteVault`,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "article",
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: pub.ogImage ? [pub.ogImage] : undefined,
    },
  };
}

export default async function PublishedPage({ params }: Props) {
  const { slug } = await params;
  const pub = await fetchQuery(api.publications.getBySlug, { slug });
  if (!pub) notFound();

  const blocks = (pub.blocks ?? []) as Block[];

  return (
    <div className="published-page">
      <article className="published-article">
        {(pub.coverImage || pub.coverColor) && (
          <div
            className={`published-cover ${pub.coverColor ? `bg-gradient-to-br ${pub.coverColor}` : ""}`}
            style={
              pub.coverImage
                ? {
                    backgroundImage: `url(${pub.coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
        )}

        <header className="published-header">
          {pub.icon && <span className="published-icon">{pub.icon}</span>}
          <h1 className="published-title">{pub.title || "Untitled"}</h1>
          {pub.description ? (
            <p className="published-description">{pub.description}</p>
          ) : null}
          {pub.tags && pub.tags.length > 0 && (
            <ul className="published-tags">
              {pub.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          )}
          {pub.publishedAt ? (
            <p className="published-meta">
              Published{" "}
              {new Date(pub.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          ) : null}
        </header>

        <div className="published-body">
          <PublishedBlocks blocks={blocks} />
        </div>

        <footer className="published-footer">
          <a href="/">NoteVault</a>
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
        <h1 className="published-h1" style={style}>
          {block.text}
        </h1>
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
        <blockquote className="published-quote" style={style}>
          {block.text}
        </blockquote>
      );
    case "code":
      return (
        <pre className="published-code" style={style}>
          <code>{block.text}</code>
        </pre>
      );
    case "divider":
      return <hr className="published-divider" />;
    case "todo":
      return (
        <p className="published-todo" style={style}>
          <input type="checkbox" checked={Boolean(block.checked)} readOnly disabled />
          <span className={block.checked ? "published-todo-done" : undefined}>{block.text}</span>
        </p>
      );
    case "callout":
      return (
        <aside className={`published-callout published-callout-${block.calloutVariant ?? "info"}`} style={style}>
          {block.text}
        </aside>
      );
    case "image":
      return block.url ? (
        <figure
          className={`published-image published-image-${block.align ?? "center"}`}
          style={{ ...style, width: block.width ? `${block.width}%` : undefined }}
        >
          <img src={block.url} alt={block.label || block.text || ""} />
          {(block.label || block.text) && <figcaption>{block.label || block.text}</figcaption>}
        </figure>
      ) : null;
    case "video":
      return block.url ? (
        <div className="published-video" style={style}>
          <video src={block.url} controls preload="metadata" />
        </div>
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
        <div style={style}>
          <PublishedMath latex={block.text} />
        </div>
      );
    case "table":
      if (!block.rows?.length) return null;
      return (
        <div className="published-table-wrap" style={style}>
          <table className="published-table">
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={`${block.id}-r${ri}`}>
                  {row.map((cell, ci) => (
                    <td key={`${block.id}-r${ri}-c${ci}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <a href={block.url} target="_blank" rel="noopener noreferrer">
            {block.label || block.text || "Download file"}
          </a>
        </p>
      ) : (
        <p className="published-p" style={style}>
          {block.text}
        </p>
      );
    default:
      return (
        <p className="published-p" style={style}>
          {block.text}
        </p>
      );
  }
}
