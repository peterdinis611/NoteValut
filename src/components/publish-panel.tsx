"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Globe, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { publishUrl, slugifyTitle } from "@/lib/publish";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  noteId: Id<"notes">;
  noteTitle: string;
  coverImage?: string;
  open: boolean;
  onClose: () => void;
};

export function PublishPanel({
  ownerId,
  noteId,
  noteTitle,
  coverImage,
  open,
  onClose,
}: Props) {
  const toast = useToast();
  const publication = useQuery(api.publications.getForNote, open ? { ownerId, noteId } : "skip");
  const publish = useMutation(api.publications.publish);
  const unpublish = useMutation(api.publications.unpublish);
  const update = useMutation(api.publications.update);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setHydrated(false);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || publication === undefined || hydrated) return;
    if (publication) {
      setSlug(publication.slug);
      setTitle(publication.title);
      setDescription(publication.description ?? "");
      setOgImage(publication.ogImage ?? "");
    } else {
      setSlug(slugifyTitle(noteTitle) || "page");
      setTitle(noteTitle || "Untitled");
      setDescription("");
      setOgImage(coverImage ?? "");
    }
    setHydrated(true);
  }, [open, publication, noteTitle, coverImage, hydrated]);

  const isPublished = Boolean(publication?.published);
  const publicLink = slug.trim() ? publishUrl(slugifyTitle(slug) || slug) : "";

  async function handlePublish() {
    setBusy(true);
    try {
      await publish({
        ownerId,
        noteId,
        slug: slug.trim() || noteTitle,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        ogImage: ogImage.trim() || null,
      });
      toast.success(isPublished ? "Publication updated" : "Published");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("Slug") ? "Slug already taken" : "Couldn’t publish");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate() {
    setBusy(true);
    try {
      await update({
        ownerId,
        noteId,
        slug: slug.trim() || undefined,
        title: title.trim() || undefined,
        description: description.trim(),
        ogImage: ogImage.trim() || null,
      });
      toast.success("Publication updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("Slug") ? "Slug already taken" : "Couldn’t update");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    setBusy(true);
    try {
      await unpublish({ ownerId, noteId });
      toast.success("Unpublished");
    } catch {
      toast.error("Couldn’t unpublish");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn’t copy link");
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="share-panel publish-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-panel-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="share-panel-header">
            <div className="share-panel-heading">
              <span className="share-panel-icon" aria-hidden>
                <Globe className="size-4" />
              </span>
              <div>
                <h2 id="publish-panel-title" className="share-panel-title">
                  Publish page
                </h2>
                <p className="share-panel-subtitle">
                  Share a public read-only link for “{noteTitle || "Untitled"}”
                </p>
              </div>
            </div>
            <button
              type="button"
              className="share-panel-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </header>

          {publication === undefined || !hydrated ? (
            <p className="share-empty">Loading…</p>
          ) : (
            <>
              <section className="share-create" aria-label="Publication details">
                <label className="share-field">
                  <span>Slug</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-page"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <label className="share-field">
                  <span>Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Page title"
                  />
                </label>
                <label className="share-field">
                  <span>Description</span>
                  <textarea
                    className="publish-panel-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary for search & social"
                    rows={3}
                    maxLength={300}
                  />
                </label>
                <label className="share-field">
                  <span>OG image URL</span>
                  <input
                    type="url"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://…"
                  />
                </label>

                {isPublished && publicLink && (
                  <div className="publish-panel-link-row">
                    <code className="publish-panel-link">{publicLink}</code>
                    <button
                      type="button"
                      className="share-icon-btn"
                      title="Copy public link"
                      aria-label="Copy public link"
                      onClick={() => void copyLink()}
                    >
                      {copied ? (
                        <Check className="size-3.5 text-accent" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="publish-panel-actions">
                  {!isPublished ? (
                    <button
                      type="button"
                      className="share-create-btn"
                      disabled={busy || !slug.trim()}
                      onClick={() => void handlePublish()}
                    >
                      <Globe className="size-3.5" />
                      {busy ? "Publishing…" : "Publish"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="share-create-btn"
                        disabled={busy}
                        onClick={() => void handleUpdate()}
                      >
                        {busy ? "Saving…" : "Update"}
                      </button>
                      <button
                        type="button"
                        className="publish-panel-unpublish"
                        disabled={busy}
                        onClick={() => void handleUnpublish()}
                      >
                        Unpublish
                      </button>
                      <button
                        type="button"
                        className="share-icon-btn"
                        title="Copy public link"
                        aria-label="Copy public link"
                        onClick={() => void copyLink()}
                      >
                        {copied ? (
                          <Check className="size-3.5 text-accent" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </section>

              <p className="share-hint">
                <Globe className="size-3.5 shrink-0" />
                {isPublished
                  ? "This page is live at the public URL. Anyone can read it."
                  : "Publishing creates a public /p/… URL. You can unpublish anytime."}
              </p>
            </>
          )}
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
