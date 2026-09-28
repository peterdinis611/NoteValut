"use client";

import { useMutation } from "convex/react";
import Fuse from "fuse.js";
import { ArrowRight, Link2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { createBlock } from "@/lib/blocks";
import { isFolder } from "@/lib/item-kinds";
import { useToast } from "./toast";

type Props = {
  open: boolean;
  onClose: () => void;
  notes: Doc<"notes">[] | undefined;
  /** Prefill source when opened from a page */
  defaultFromId?: Id<"notes"> | null;
  onNavigate?: (id: Id<"notes">) => void;
  onOpenGraph?: () => void;
};

export function LinkDocumentsDialog({
  open,
  onClose,
  notes,
  defaultFromId,
  onNavigate,
  onOpenGraph,
}: Props) {
  const toast = useToast();
  const updateNote = useMutation(api.notes.update);
  const pages = useMemo(
    () => (notes ?? []).filter((n) => !isFolder(n) && !n.trashed && !n.archived),
    [notes],
  );

  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [fromQ, setFromQ] = useState("");
  const [toQ, setToQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFromId(defaultFromId ?? "");
    setToId("");
    setFromQ("");
    setToQ("");
  }, [open, defaultFromId]);

  const fuse = useMemo(
    () =>
      new Fuse(pages, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "tags", weight: 0.25 },
          { name: "status", weight: 0.15 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [pages],
  );

  function filterPages(q: string, exclude?: string) {
    const base = q.trim() ? fuse.search(q).map((h) => h.item) : pages;
    return base.filter((p) => p._id !== exclude).slice(0, 12);
  }

  const fromHits = filterPages(fromQ);
  const toHits = filterPages(toQ, fromId || undefined);
  const fromNote = pages.find((p) => p._id === fromId);
  const toNote = pages.find((p) => p._id === toId);

  async function handleLink() {
    if (!fromNote || !toNote || fromNote._id === toNote._id) return;
    const already = (fromNote.blocks ?? []).some(
      (b) => b.type === "pagelink" && b.pageId === toNote._id,
    );
    if (already) {
      toast.success("Already linked");
      onClose();
      return;
    }
    setSaving(true);
    try {
      const link = createBlock("pagelink", toNote.title || "Untitled", {
        pageId: toNote._id,
      });
      const blocks = [...(fromNote.blocks ?? []), link];
      await updateNote({ id: fromNote._id, blocks });
      toast.success(`Linked → ${toNote.title || "Untitled"}`);
      onClose();
      onNavigate?.(fromNote._id);
    } catch {
      toast.error("Couldn’t create link");
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="create-dialog-overlay" onClick={onClose} role="presentation">
        <div
          className="link-docs-dialog"
          role="dialog"
          aria-modal
          aria-labelledby="link-docs-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="create-dialog-header">
            <div>
              <h2 id="link-docs-title" className="create-dialog-title">
                Link documents
              </h2>
              <p className="create-dialog-subtitle">
                Create a vault [[link]] between two pages
              </p>
            </div>
            <button type="button" className="create-dialog-close" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </header>

          <div className="link-docs-pickers">
            <PickerColumn
              label="From"
              query={fromQ}
              onQuery={setFromQ}
              selected={fromNote}
              hits={fromHits}
              onSelect={(id) => {
                setFromId(id);
                const n = pages.find((p) => p._id === id);
                if (n) setFromQ(n.title || "Untitled");
              }}
            />
            <div className="link-docs-arrow" aria-hidden>
              <ArrowRight className="size-4" />
            </div>
            <PickerColumn
              label="To"
              query={toQ}
              onQuery={setToQ}
              selected={toNote}
              hits={toHits}
              onSelect={(id) => {
                setToId(id);
                const n = pages.find((p) => p._id === id);
                if (n) setToQ(n.title || "Untitled");
              }}
            />
          </div>

          <div className="link-docs-preview">
            {fromNote && toNote ? (
              <p>
                <span>{fromNote.icon}</span> {fromNote.title || "Untitled"}
                <ArrowRight className="inline size-3.5 mx-1.5 opacity-60" />
                <span>{toNote.icon}</span> {toNote.title || "Untitled"}
              </p>
            ) : (
              <p className="text-muted">Pick a source and target page</p>
            )}
          </div>

          <footer className="link-docs-footer">
            {onOpenGraph && (
              <button
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() => {
                  onClose();
                  onOpenGraph();
                }}
              >
                <Link2 className="size-3.5" />
                Open graph
              </button>
            )}
            <button
              type="button"
              className="settings-btn"
              disabled={!fromNote || !toNote || fromNote._id === toNote._id || saving}
              onClick={() => void handleLink()}
            >
              {saving ? "Linking…" : "Create link"}
            </button>
          </footer>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}

function PickerColumn({
  label,
  query,
  onQuery,
  selected,
  hits,
  onSelect,
}: {
  label: string;
  query: string;
  onQuery: (q: string) => void;
  selected?: Doc<"notes">;
  hits: Doc<"notes">[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="link-docs-col">
      <p className="create-dialog-label">{label}</p>
      <div className="create-dialog-search">
        <Search className="size-3.5 text-muted" aria-hidden />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search pages…"
          aria-label={`Search ${label} page`}
        />
      </div>
      {selected && (
        <div className="link-docs-selected">
          {selected.icon} {selected.title || "Untitled"}
        </div>
      )}
      <ul className="link-docs-hits note-scroll">
        {hits.map((p) => (
          <li key={p._id}>
            <button
              type="button"
              className={selected?._id === p._id ? "is-active" : ""}
              onClick={() => onSelect(p._id)}
            >
              <span>{p.icon}</span>
              <span className="truncate">{p.title || "Untitled"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
