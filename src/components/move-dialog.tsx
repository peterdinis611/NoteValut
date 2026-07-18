"use client";

import { useMutation, useQuery } from "convex/react";
import { FolderOpen, Home, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";
import { useToast } from "./toast";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful move */
  onMoved?: () => void;
  ownerId: string;
  /** Single-note move (legacy) or first id for title display */
  noteId?: Id<"notes">;
  noteIds?: Id<"notes">[];
  noteTitle?: string;
  currentParentId?: Id<"notes"> | null;
};

export function MoveDialog({
  open,
  onClose,
  onMoved,
  ownerId,
  noteId,
  noteIds,
  noteTitle,
  currentParentId,
}: Props) {
  const toast = useToast();
  const notes = useQuery(api.notes.list, open ? { ownerId } : "skip");
  const moveNote = useMutation(api.notes.move);
  const bulkUpdate = useMutation(api.notes.bulkUpdate);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const ids = useMemo(() => {
    if (noteIds?.length) return noteIds;
    return noteId ? [noteId] : [];
  }, [noteId, noteIds]);

  const exclude = useMemo(() => new Set(ids.map(String)), [ids]);

  const collections = useMemo(() => {
    if (!notes) return [];
    const folders = notes.filter((n) => isFolder(n) && !exclude.has(n._id));
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => (f.title || "").toLowerCase().includes(q));
  }, [notes, exclude, query]);

  const heading =
    ids.length > 1
      ? `${ids.length} items`
      : noteTitle || notes?.find((n) => n._id === ids[0])?.title || "Untitled";

  async function moveTo(parentId: Id<"notes"> | null) {
    if (busy || !ids.length) return;
    if (ids.length === 1 && parentId === (currentParentId ?? null)) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      if (ids.length === 1) {
        await moveNote({ id: ids[0], parentId });
      } else {
        await bulkUpdate({ ids, parentId });
      }
      toast.success(
        parentId
          ? `Moved ${ids.length} to collection`
          : `Moved ${ids.length} to vault root`,
      );
      onMoved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t move item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="share-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={easeQuick}
          onClick={onClose}
        >
          <motion.div
            className="move-dialog"
            role="dialog"
            aria-modal
            aria-labelledby="move-dialog-title"
            variants={modalVariants}
            transition={easeOutSoft}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-panel-header">
              <div>
                <h2 id="move-dialog-title" className="text-base font-semibold">
                  Move to…
                </h2>
                <p className="text-xs text-muted truncate max-w-[16rem]">{heading}</p>
              </div>
              <button type="button" className="topbar-btn" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            <div className="move-search">
              <Search className="size-3.5 text-muted" />
              <input
                autoFocus
                className="move-search-input"
                placeholder="Search collections…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="move-list note-scroll">
              <button
                type="button"
                className="move-option"
                disabled={busy}
                onClick={() => void moveTo(null)}
              >
                <Home className="size-3.5" />
                <span>Vault root</span>
              </button>
              {collections.map((folder) => (
                <button
                  key={folder._id}
                  type="button"
                  className="move-option"
                  disabled={busy}
                  onClick={() => void moveTo(folder._id)}
                >
                  <FolderOpen className="size-3.5" />
                  <span className="truncate">{folder.icon} {folder.title || "Untitled"}</span>
                </button>
              ))}
              {collections.length === 0 && (
                <p className="move-empty">No collections match</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
