"use client";

import { useMutation, useQuery } from "convex/react";
import { Hash, Pencil, Tag, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, fadeUpVariants } from "@/lib/motion";
import { formatRelativeTime } from "@/lib/format";
import { normalizeTag, tagKey } from "@/lib/tags";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  onClose: () => void;
  onNavigate: (id: Id<"notes">) => void;
  initialTag?: string | null;
};

export function TagsHub({ ownerId, onClose, onNavigate, initialTag = null }: Props) {
  const toast = useToast();
  const tags = useQuery(api.notes.listTags, { ownerId });
  const notes = useQuery(api.notes.list, { ownerId });
  const renameTag = useMutation(api.notes.renameTag);
  const deleteTag = useMutation(api.notes.deleteTag);

  const [activeTag, setActiveTag] = useState<string | null>(initialTag);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialTag) setActiveTag(initialTag);
  }, [initialTag]);

  const filtered = useMemo(() => {
    if (!notes || !activeTag) return [];
    const needle = tagKey(activeTag);
    return notes.filter(
      (n) => !isFolder(n) && n.tags.some((t) => tagKey(t) === needle),
    );
  }, [notes, activeTag]);

  async function handleRename(from: string) {
    const to = normalizeTag(renameDraft);
    if (!to || tagKey(to) === tagKey(from)) {
      setRenaming(null);
      return;
    }
    setBusy(true);
    try {
      const n = await renameTag({ ownerId, from, to });
      toast.success(n ? `Renamed on ${n} page${n === 1 ? "" : "s"}` : "No pages updated");
      setActiveTag((v) => (v && tagKey(v) === tagKey(from) ? to : v));
      setRenaming(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t rename tag");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(tag: string) {
    if (!window.confirm(`Remove #${tag} from every page in this vault?`)) return;
    setBusy(true);
    try {
      const n = await deleteTag({ ownerId, tag });
      toast.success(n ? `Removed from ${n} page${n === 1 ? "" : "s"}` : "Tag not found");
      setActiveTag((v) => (v && tagKey(v) === tagKey(tag) ? null : v));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t delete tag");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="tags-hub note-scroll"
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
      transition={easeOutSoft}
    >
      <header className="settings-header">
        <div>
          <p className="settings-kicker">
            <Tag className="size-3.5" />
            Browse
          </p>
          <h1 className="settings-title">Tags</h1>
          <p className="settings-subtitle">Filter, rename, or delete tags across your vault</p>
        </div>
        <button type="button" className="settings-close" onClick={onClose} aria-label="Close tags">
          <X className="size-4" />
        </button>
      </header>

      {tags === undefined ? (
        <p className="settings-empty">Loading tags…</p>
      ) : tags.length === 0 ? (
        <p className="settings-empty">No tags yet — add some from a page’s properties.</p>
      ) : (
        <div className="tags-cloud">
          {tags.map(({ tag, count, key }) => {
            const isActive = activeTag !== null && tagKey(activeTag) === key;
            if (renaming === tag) {
              return (
                <form
                  key={key}
                  className="tags-chip-rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleRename(tag);
                  }}
                >
                  <Hash className="size-3 shrink-0" />
                  <input
                    autoFocus
                    className="tags-chip-rename-input"
                    value={renameDraft}
                    disabled={busy}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    onBlur={() => void handleRename(tag)}
                  />
                </form>
              );
            }
            return (
              <div
                key={key}
                className={`tags-chip-wrap ${isActive ? "tags-chip-wrap-active" : ""}`}
              >
                <button
                  type="button"
                  className={`tags-chip ${isActive ? "tags-chip-active" : ""}`}
                  onClick={() => setActiveTag((v) => (v && tagKey(v) === key ? null : tag))}
                >
                  <Hash className="size-3" />
                  {tag}
                  <span className="tags-chip-count">{count}</span>
                </button>
                <div className="tags-chip-actions">
                  <button
                    type="button"
                    className="tags-chip-action"
                    title="Rename"
                    disabled={busy}
                    aria-label={`Rename ${tag}`}
                    onClick={() => {
                      setRenaming(tag);
                      setRenameDraft(tag);
                    }}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    className="tags-chip-action tags-chip-action-danger"
                    title="Delete"
                    disabled={busy}
                    aria-label={`Delete ${tag}`}
                    onClick={() => void handleDelete(tag)}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTag && (
        <section className="tags-results">
          <h2 className="tags-results-title">
            Pages tagged <span className="text-accent">#{activeTag}</span>
            <span className="text-muted font-normal"> · {filtered.length}</span>
          </h2>
          {filtered.length === 0 ? (
            <p className="settings-empty">No pages with this tag.</p>
          ) : (
            <ul className="tags-results-list">
              {filtered.map((note) => (
                <li key={note._id}>
                  <button
                    type="button"
                    className="tags-result-row"
                    onClick={() => onNavigate(note._id)}
                  >
                    <span className="text-lg">{note.icon}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium">
                        {note.title || "Untitled"}
                      </span>
                      <span className="block text-xs text-muted">
                        {formatRelativeTime(note.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </motion.div>
  );
}
