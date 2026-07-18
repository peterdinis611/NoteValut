"use client";

import { useQuery } from "convex/react";
import { Hash, Tag, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, fadeUpVariants } from "@/lib/motion";
import { formatRelativeTime } from "@/lib/format";

type Props = {
  ownerId: string;
  onClose: () => void;
  onNavigate: (id: Id<"notes">) => void;
  initialTag?: string | null;
};

export function TagsHub({ ownerId, onClose, onNavigate, initialTag = null }: Props) {
  const tags = useQuery(api.notes.listTags, { ownerId });
  const notes = useQuery(api.notes.list, { ownerId });
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);

  const filtered = useMemo(() => {
    if (!notes || !activeTag) return [];
    const needle = activeTag.toLowerCase();
    return notes.filter(
      (n) => !isFolder(n) && n.tags.some((t) => t.toLowerCase() === needle),
    );
  }, [notes, activeTag]);

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
          <p className="settings-subtitle">Filter pages by tag across your vault</p>
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
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className={`tags-chip ${activeTag === tag ? "tags-chip-active" : ""}`}
              onClick={() => setActiveTag((v) => (v === tag ? null : tag))}
            >
              <Hash className="size-3" />
              {tag}
              <span className="tags-chip-count">{count}</span>
            </button>
          ))}
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
