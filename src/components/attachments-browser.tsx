"use client";

import { useQuery } from "convex/react";
import { File, FileImage, FileText, Film, Paperclip, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onNavigate: (noteId: Id<"notes">) => void;
};

type Filter = "all" | "image" | "pdf" | "video" | "file" | "cover";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "pdf", label: "PDFs" },
  { id: "video", label: "Videos" },
  { id: "file", label: "Files" },
  { id: "cover", label: "Covers" },
];

function TypeIcon({ type }: { type: string }) {
  if (type === "image" || type === "cover") return <FileImage className="size-4" />;
  if (type === "pdf") return <FileText className="size-4" />;
  if (type === "video") return <Film className="size-4" />;
  return <File className="size-4" />;
}

export function AttachmentsBrowser({ ownerId, open, onClose, onNavigate }: Props) {
  const items = useQuery(api.notes.listAttachments, open ? { ownerId } : "skip");
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setFilter("all");
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

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  if (!mounted) return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="share-panel attachments-browser"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attachments-browser-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="share-panel-header">
            <div className="share-panel-heading">
              <span className="share-panel-icon" aria-hidden>
                <Paperclip className="size-4" />
              </span>
              <div>
                <h2 id="attachments-browser-title" className="share-panel-title">
                  Attachments
                </h2>
                <p className="share-panel-subtitle">
                  Images, PDFs, videos, and files across your vault
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

          <div className="attachments-browser-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`attachments-filter-chip ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="attachments-browser-list note-scroll">
            {items === undefined ? (
              <p className="attachments-browser-empty">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="attachments-browser-empty">No attachments found</p>
            ) : (
              <ul>
                {filtered.map((item) => (
                  <li key={`${item.noteId}-${item.blockId}`}>
                    <button
                      type="button"
                      className="attachments-browser-row"
                      onClick={() => {
                        onNavigate(item.noteId);
                        onClose();
                      }}
                    >
                      <span className="attachments-browser-thumb">
                        {item.type === "image" || item.type === "cover" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.url} alt="" />
                        ) : (
                          <TypeIcon type={item.type} />
                        )}
                      </span>
                      <span className="attachments-browser-meta">
                        <span className="attachments-browser-label">{item.label}</span>
                        <span className="attachments-browser-note">{item.noteTitle}</span>
                      </span>
                      <span className="attachments-browser-type">{item.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
