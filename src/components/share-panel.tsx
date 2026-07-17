"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Eye, Link2, Lock, Pencil, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";
import { permissionLabel, shareUrl, type ShareScope } from "@/lib/share";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  scope: ShareScope;
  noteId?: Id<"notes">;
  title?: string;
};

export function SharePanel({ ownerId, open, onClose, scope, noteId, title }: Props) {
  const shares = useQuery(api.shares.list, open ? { ownerId } : "skip");
  const settings = useQuery(api.vaultSettings.get, open ? { ownerId } : "skip");
  const createShare = useMutation(api.shares.create);
  const updateShare = useMutation(api.shares.update);
  const removeShare = useMutation(api.shares.remove);
  const updateSettings = useMutation(api.vaultSettings.update);

  const [permission, setPermission] = useState<"read" | "write">("read");
  const [copied, setCopied] = useState<string | null>(null);

  const relevant =
    shares?.filter((s) => {
      if (scope === "vault") return s.scope === "vault";
      return s.scope !== "vault" && s.noteId === noteId;
    }) ?? [];

  async function handleCreate() {
    await createShare({
      ownerId,
      scope,
      noteId,
      permission,
      label: title ? `Share: ${title}` : undefined,
    });
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(shareUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="share-overlay"
          onClick={onClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={easeQuick}
        >
          <motion.div
            className="share-panel"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <div className="share-panel-header">
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-accent" />
                <span className="font-medium">Share {scopeLabel(scope)}</span>
              </div>
              <button type="button" className="topbar-btn" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            {scope === "vault" && settings && (
              <div className="share-settings-block">
                <label className="share-toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.sharingEnabled}
                    onChange={(e) =>
                      updateSettings({ ownerId, sharingEnabled: e.target.checked })
                    }
                  />
                  <span>Enable vault sharing</span>
                </label>
                <label className="share-toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.publicReadonly}
                    onChange={(e) =>
                      updateSettings({ ownerId, publicReadonly: e.target.checked })
                    }
                  />
                  <span>Default new links to read-only</span>
                </label>
              </div>
            )}

            <div className="share-create-row">
              <select
                className="share-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value as "read" | "write")}
              >
                <option value="read">Read only — viewers cannot edit</option>
                <option value="write">Can edit — collaborators can modify</option>
              </select>
              <button type="button" className="vault-btn-primary" onClick={handleCreate}>
                Create link
              </button>
            </div>

            <div className="share-list">
              {relevant.length === 0 ? (
                <p className="text-sm text-muted">No share links yet.</p>
              ) : (
                relevant.map((share) => (
                  <div key={share._id} className="share-item">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{share.label}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        {share.permission === "read" ? (
                          <Eye className="size-3" />
                        ) : (
                          <Pencil className="size-3" />
                        )}
                        {permissionLabel(share.permission)}
                        {!share.enabled && " · Disabled"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="topbar-btn"
                      title="Copy link"
                      onClick={() => copyLink(share.token)}
                    >
                      {copied === share.token ? (
                        <Check className="size-4 text-accent" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="topbar-btn"
                      title="Toggle permission"
                      onClick={() =>
                        updateShare({
                          id: share._id,
                          ownerId,
                          permission: share.permission === "read" ? "write" : "read",
                        })
                      }
                    >
                      {share.permission === "read" ? (
                        <Lock className="size-4" />
                      ) : (
                        <Pencil className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="topbar-btn text-red-400"
                      onClick={() => removeShare({ id: share._id, ownerId })}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="share-hint">
              Anyone with the link can view{permission === "write" ? " and edit" : ""} this{" "}
              {scopeLabel(scope).toLowerCase()}.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function scopeLabel(scope: ShareScope) {
  if (scope === "vault") return "vault";
  if (scope === "collection") return "collection";
  return "entry";
}
