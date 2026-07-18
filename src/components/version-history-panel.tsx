"use client";

import { useMutation, useQuery } from "convex/react";
import { History, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatRelativeTime } from "@/lib/format";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";
import { useToast } from "./toast";

type Props = {
  open: boolean;
  onClose: () => void;
  noteId: Id<"notes">;
  readOnly?: boolean;
};

export function VersionHistoryPanel({ open, onClose, noteId, readOnly = false }: Props) {
  const toast = useToast();
  const versions = useQuery(api.versions.listForNote, open ? { noteId } : "skip");
  const restore = useMutation(api.versions.restore);

  async function handleRestore(versionId: Id<"noteVersions">) {
    if (readOnly) return;
    try {
      await restore({ noteId, versionId });
      toast.success("Version restored");
      onClose();
    } catch {
      toast.error("Couldn’t restore version");
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
            className="history-panel"
            role="dialog"
            aria-modal
            aria-labelledby="history-title"
            variants={modalVariants}
            transition={easeOutSoft}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-panel-header">
              <div>
                <h2 id="history-title" className="flex items-center gap-2 text-base font-semibold">
                  <History className="size-4 text-accent" />
                  Version history
                </h2>
                <p className="text-xs text-muted">Last {versions?.length ?? 0} snapshots</p>
              </div>
              <button type="button" className="topbar-btn" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            <div className="history-list note-scroll">
              {versions === undefined ? (
                <p className="settings-empty">Loading…</p>
              ) : versions.length === 0 ? (
                <p className="settings-empty">
                  No snapshots yet — edits create history automatically.
                </p>
              ) : (
                versions.map((ver) => (
                  <div key={ver._id} className="history-row">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ver.title || "Untitled"}</p>
                      <p className="text-xs text-muted">
                        {formatRelativeTime(ver.createdAt)} · {ver.blockCount} blocks
                      </p>
                      {ver.preview.trim() && (
                        <p className="history-preview">{ver.preview}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="settings-btn"
                      disabled={readOnly}
                      onClick={() => void handleRestore(ver._id)}
                    >
                      <RotateCcw className="size-3.5" />
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
