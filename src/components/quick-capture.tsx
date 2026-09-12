"use client";

import { useMutation, useQuery } from "convex/react";
import { X, Zap } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { createBlock } from "@/lib/blocks";
import { normalizeTags } from "@/lib/tags";
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
    <AnimePresence show={open} kind="overlay">
      <div className="quick-capture-overlay" onClick={onClose}>
        <div className="quick-capture-modal" onClick={(e) => e.stopPropagation()}>
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
        </div>
      </div>
    </AnimePresence>
  );
}

export function QuickCaptureFab({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="quick-capture-fab" onClick={onClick} aria-label="Quick capture">
      <Zap className="size-5" />
    </button>
  );
}
