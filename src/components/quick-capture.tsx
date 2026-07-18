"use client";

import { useMutation, useQuery } from "convex/react";
import { X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createBlock } from "@/lib/blocks";
import { normalizeTags } from "@/lib/tags";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (id: Id<"notes">) => void;
};

export function QuickCapture({ ownerId, open, onClose, onCreated }: Props) {
  const toast = useToast();
  const notes = useQuery(api.notes.list, { ownerId });
  const createNote = useMutation(api.notes.create);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const inbox = notes?.find((n) => n.kind === "folder" && n.title.toLowerCase() === "inbox");

  async function handleSave() {
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    try {
      const blocks = body.trim()
        ? [createBlock("paragraph", body.trim())]
        : [createBlock("paragraph", "")];

      const captureTags = normalizeTags(["capture"]);
      const id = await createNote({
        ownerId,
        title: title.trim() || "Quick capture",
        parentId: inbox?._id,
        kind: "page",
        icon: "⚡",
        tags: captureTags.success ? captureTags.tags : ["capture"],
        blocks,
      });

      setTitle("");
      setBody("");
      toast.success("Captured");
      onCreated(id);
      onClose();
    } catch {
      toast.error("Couldn’t save capture");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="quick-capture-overlay"
          onClick={onClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={easeQuick}
        >
          <motion.div
            className="quick-capture-modal"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <div className="quick-capture-header">
              <div className="flex items-center gap-2 font-medium">
                <Zap className="size-4 text-accent" />
                Quick capture
              </div>
              <button type="button" className="topbar-btn" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            <input
              autoFocus
              className="quick-capture-title"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <textarea
              className="quick-capture-body"
              placeholder="What's on your mind?"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            <div className="quick-capture-footer">
              <span className="text-xs text-muted">
                Saves to {inbox ? "Inbox collection" : "vault root"}
              </span>
              <button
                type="button"
                className="vault-btn-primary"
                disabled={saving || (!title.trim() && !body.trim())}
                onClick={handleSave}
              >
                {saving ? "Saving…" : "Save entry"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QuickCaptureFab({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className="quick-capture-fab"
      onClick={onClick}
      aria-label="Quick capture"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={easeOutSoft}
    >
      <Zap className="size-5" />
    </motion.button>
  );
}
