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
  ownerId: string;
  noteId: Id<"notes">;
  noteTitle: string;
  currentParentId?: Id<"notes"> | null;
};

export function MoveDialog({
  open,
  onClose,
  ownerId,
  noteId,
  noteTitle,
  currentParentId,
}: Props) {
  const toast = useToast();
  const notes = useQuery(api.notes.list, open ? { ownerId } : "skip");
  const moveNote = useMutation(api.notes.move);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const collections = useMemo(() => {
    if (!notes) return [];
    const folders = notes.filter((n) => isFolder(n) && n._id !== noteId);
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => (f.title || "").toLowerCase().includes(q));
  }, [notes, noteId, query]);

  async function moveTo(parentId: Id<"notes"> | null) {
    if (busy) return;
    if (parentId === (currentParentId ?? null)) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await moveNote({ id: noteId, parentId });
      toast.success(parentId ? "Moved to collection" : "Moved to vault root");
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
                <p className="text-xs text-muted truncate max-w-[16rem]">
                  {noteTitle || "Untitled"}
                </p>
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
                placeholder="Filter collections…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="move-list note-scroll">
              <button
                type="button"
                className={`move-option ${!currentParentId ? "move-option-current" : ""}`}
                disabled={busy}
                onClick={() => void moveTo(null)}
              >
                <Home className="size-3.5 text-accent" />
                <span>Vault root</span>
                {!currentParentId && <span className="move-current">Current</span>}
              </button>

              {collections.length === 0 ? (
                <p className="settings-empty px-1 py-3">No collections found</p>
              ) : (
                collections.map((folder) => {
                  const current = currentParentId === folder._id;
                  return (
                    <button
                      key={folder._id}
                      type="button"
                      className={`move-option ${current ? "move-option-current" : ""}`}
                      disabled={busy}
                      onClick={() => void moveTo(folder._id)}
                    >
                      <FolderOpen className="size-3.5 text-muted" />
                      <span className="truncate">{folder.icon} {folder.title || "Untitled"}</span>
                      {current && <span className="move-current">Current</span>}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
