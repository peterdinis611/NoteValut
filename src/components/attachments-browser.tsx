"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Download,
  File,
  FileImage,
  FileText,
  Film,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onNavigate: (noteId: Id<"notes">) => void;
};

type Filter = "all" | "image" | "pdf" | "video" | "file" | "cover" | "orphans";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "pdf", label: "PDFs" },
  { id: "video", label: "Videos" },
  { id: "file", label: "Files" },
  { id: "cover", label: "Covers" },
  { id: "orphans", label: "Orphans" },
];

function TypeIcon({ type }: { type: string }) {
  if (type === "image" || type === "cover") return <FileImage className="size-4" />;
  if (type === "pdf") return <FileText className="size-4" />;
  if (type === "video") return <Film className="size-4" />;
  return <File className="size-4" />;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsBrowser({ ownerId, open, onClose, onNavigate }: Props) {
  const toast = useToast();
  const items = useQuery(api.notes.listAttachments, open ? { ownerId } : "skip");
  const orphans = useQuery(api.files.listOrphans, open ? { ownerId } : "skip");
  const deleteOrphans = useMutation(api.files.deleteOrphans);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setFilter("all");
      setSelected(new Set());
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
    if (filter === "orphans") return [];
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function bulkDownload() {
    const urls: Array<{ url: string; name: string }> = [];
    if (filter === "orphans") {
      for (const o of orphans ?? []) {
        if (!o.url || !selected.has(o.storageId)) continue;
        urls.push({
          url: o.url,
          name: o.storageId.slice(0, 12) + (o.contentType?.includes("png") ? ".png" : ""),
        });
      }
    } else {
      for (const item of filtered) {
        const key = `${item.noteId}-${item.blockId}`;
        if (!selected.has(key)) continue;
        urls.push({ url: item.url, name: item.label || "file" });
      }
    }
    if (!urls.length) {
      toast.error("Select files to download");
      return;
    }
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      let i = 0;
      for (const u of urls) {
        const res = await fetch(u.url);
        const blob = await res.blob();
        const safe = u.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || `file-${i}`;
        zip.file(`${i + 1}-${safe}`, blob);
        i += 1;
      }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = "notevault-attachments.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Downloaded ${urls.length} file${urls.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(false);
    }
  }

  async function trashSelectedOrphans() {
    const ids = [...selected] as Id<"_storage">[];
    if (!ids.length) return;
    setBusy(true);
    try {
      const res = await deleteOrphans({ ownerId, storageIds: ids });
      setSelected(new Set());
      toast.success(`Deleted ${res.deleted} orphan${res.deleted === 1 ? "" : "s"}`);
    } catch {
      toast.error("Couldn’t delete orphans");
    } finally {
      setBusy(false);
    }
  }

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
                  Browse vault media · trash storage orphans · bulk download
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
                onClick={() => {
                  setFilter(f.id);
                  setSelected(new Set());
                }}
              >
                {f.label}
                {f.id === "orphans" && orphans ? ` (${orphans.length})` : ""}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="attachments-browser-actions">
              <button
                type="button"
                className="settings-btn"
                disabled={busy}
                onClick={() => void bulkDownload()}
              >
                <Download className="size-3.5" />
                Download ({selected.size})
              </button>
              {filter === "orphans" && (
                <button
                  type="button"
                  className="settings-btn settings-btn-ghost"
                  disabled={busy}
                  onClick={() => void trashSelectedOrphans()}
                >
                  <Trash2 className="size-3.5" />
                  Trash orphans
                </button>
              )}
            </div>
          )}

          <div className="attachments-browser-list note-scroll">
            {filter === "orphans" ? (
              orphans === undefined ? (
                <p className="attachments-browser-empty">Loading…</p>
              ) : orphans.length === 0 ? (
                <p className="attachments-browser-empty">No orphan files in storage</p>
              ) : (
                <ul>
                  {orphans.map((o) => (
                    <li key={o.storageId}>
                      <label className="attachments-browser-row attachments-orphan-row">
                        <input
                          type="checkbox"
                          checked={selected.has(o.storageId)}
                          onChange={() => toggleSelect(o.storageId)}
                        />
                        <span className="attachments-browser-thumb">
                          {o.contentType?.startsWith("image/") && o.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={o.url} alt="" />
                          ) : (
                            <File className="size-4" />
                          )}
                        </span>
                        <span className="attachments-browser-meta">
                          <span className="attachments-browser-label">
                            {o.contentType || "File"}
                          </span>
                          <span className="attachments-browser-note">
                            {formatBytes(o.size)} ·{" "}
                            {new Date(o._creationTime).toLocaleDateString()}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )
            ) : items === undefined ? (
              <p className="attachments-browser-empty">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="attachments-browser-empty">No attachments found</p>
            ) : (
              <ul>
                {filtered.map((item) => {
                  const key = `${item.noteId}-${item.blockId}`;
                  return (
                    <li key={key}>
                      <div className="attachments-browser-row">
                        <input
                          type="checkbox"
                          checked={selected.has(key)}
                          onChange={() => toggleSelect(key)}
                          aria-label={`Select ${item.label}`}
                        />
                        <button
                          type="button"
                          className="attachments-browser-nav"
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
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
