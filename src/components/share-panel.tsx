"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Copy,
  Eye,
  Link2,
  Lock,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { roleDescription } from "@/lib/ability";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";
import { permissionLabel, shareUrl, type ShareScope } from "@/lib/share";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  scope: ShareScope;
  noteId?: Id<"notes">;
  title?: string;
};

export function SharePanel({ ownerId, open, onClose, scope, noteId, title }: Props) {
  const toast = useToast();
  const shares = useQuery(api.shares.list, open ? { ownerId } : "skip");
  const settings = useQuery(api.vaultSettings.get, open ? { ownerId } : "skip");
  const createShare = useMutation(api.shares.create);
  const updateShare = useMutation(api.shares.update);
  const removeShare = useMutation(api.shares.remove);
  const updateSettings = useMutation(api.vaultSettings.update);

  const [permission, setPermission] = useState<"read" | "write">("read");
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
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

  useEffect(() => {
    if (!open || !settings) return;
    if (settings.publicReadonly) setPermission("read");
  }, [open, settings?.publicReadonly]);

  const relevant =
    shares?.filter((s) => {
      if (scope === "vault") return s.scope === "vault";
      return s.scope !== "vault" && s.noteId === noteId;
    }) ?? [];

  async function handleCreate() {
    setBusy(true);
    try {
      await createShare({
        ownerId,
        scope,
        noteId,
        permission,
        label: title ? `Share: ${title}` : undefined,
      });
      toast.success(
        permission === "read" ? "Viewer link created" : "Editor link created",
      );
    } catch {
      toast.error("Couldn’t create share link");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      setCopied(token);
      toast.success("Link copied");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn’t copy link");
    }
  }

  async function handleTogglePermission(share: {
    _id: Id<"shares">;
    permission: "read" | "write";
  }) {
    try {
      const next = share.permission === "read" ? "write" : "read";
      await updateShare({ id: share._id, ownerId, permission: next });
      toast.success(next === "read" ? "Role set to Viewer" : "Role set to Editor");
    } catch {
      toast.error("Couldn’t update role");
    }
  }

  async function handleRemove(id: Id<"shares">) {
    try {
      await removeShare({ id, ownerId });
      toast.success("Share link removed");
    } catch {
      toast.error("Couldn’t remove link");
    }
  }

  if (!mounted) return null;

  return createPortal(
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-panel-title"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <header className="share-panel-header">
              <div className="share-panel-heading">
                <span className="share-panel-icon" aria-hidden>
                  <Link2 className="size-4" />
                </span>
                <div>
                  <h2 id="share-panel-title" className="share-panel-title">
                    Share {scopeLabel(scope)}
                  </h2>
                  <p className="share-panel-subtitle">
                    {title
                      ? `Invite people to “${title}” with a link`
                      : "Invite people with a link — no account required"}
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

            {scope === "vault" && settings && (
              <section className="share-settings-block" aria-label="Sharing preferences">
                <label className="share-switch">
                  <span className="share-switch-copy">
                    <span className="share-switch-label">Enable vault sharing</span>
                    <span className="share-switch-hint">
                      Turn this off to pause all vault links
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={settings.sharingEnabled}
                    onChange={async (e) => {
                      try {
                        await updateSettings({
                          ownerId,
                          sharingEnabled: e.target.checked,
                        });
                        toast.success(
                          e.target.checked ? "Sharing enabled" : "Sharing disabled",
                        );
                      } catch {
                        toast.error("Couldn’t update sharing settings");
                      }
                    }}
                  />
                  <span className="share-switch-track" aria-hidden />
                </label>
                <label className="share-switch">
                  <span className="share-switch-copy">
                    <span className="share-switch-label">Prefer Viewer links</span>
                    <span className="share-switch-hint">
                      New links default to view-only
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={settings.publicReadonly}
                    onChange={async (e) => {
                      try {
                        await updateSettings({
                          ownerId,
                          publicReadonly: e.target.checked,
                        });
                        if (e.target.checked) setPermission("read");
                        toast.info(
                          e.target.checked
                            ? "New links default to Viewer"
                            : "Editor links allowed",
                        );
                      } catch {
                        toast.error("Couldn’t update sharing settings");
                      }
                    }}
                  />
                  <span className="share-switch-track" aria-hidden />
                </label>
              </section>
            )}

            <section className="share-create" aria-label="Create share link">
              <p className="share-section-label">Permission</p>
              <div className="share-role-seg" role="group" aria-label="Link permission">
                <button
                  type="button"
                  className={`share-role-opt ${permission === "read" ? "share-role-opt-active" : ""}`}
                  onClick={() => setPermission("read")}
                >
                  <Eye className="size-3.5" />
                  <span>
                    <strong>Viewer</strong>
                    <small>{roleDescription("viewer")}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={`share-role-opt ${permission === "write" ? "share-role-opt-active" : ""}`}
                  disabled={scope === "vault" && settings?.publicReadonly}
                  onClick={() => setPermission("write")}
                >
                  <Pencil className="size-3.5" />
                  <span>
                    <strong>Editor</strong>
                    <small>{roleDescription("editor")}</small>
                  </span>
                </button>
              </div>
              <button
                type="button"
                className="share-create-btn"
                disabled={busy || (scope === "vault" && settings?.sharingEnabled === false)}
                onClick={() => void handleCreate()}
              >
                <Link2 className="size-3.5" />
                {busy ? "Creating…" : "Create link"}
              </button>
            </section>

            <section className="share-list-section" aria-label="Active links">
              <div className="share-list-head">
                <p className="share-section-label">Active links</p>
                {relevant.length > 0 && (
                  <span className="share-list-count">{relevant.length}</span>
                )}
              </div>
              <div className="share-list">
                {shares === undefined ? (
                  <p className="share-empty">Loading links…</p>
                ) : relevant.length === 0 ? (
                  <div className="share-empty-card">
                    <Link2 className="size-5 opacity-45" />
                    <p>No share links yet</p>
                    <span>Create one above — anyone with the link can open it.</span>
                  </div>
                ) : (
                  relevant.map((share) => (
                    <div
                      key={share._id}
                      className={`share-item ${!share.enabled ? "share-item-disabled" : ""}`}
                    >
                      <div className="share-item-main">
                        <p className="share-item-title">{share.label}</p>
                        <p className="share-item-meta">
                          <span
                            className={`share-item-badge ${
                              share.permission === "read"
                                ? "share-item-badge-view"
                                : "share-item-badge-edit"
                            }`}
                          >
                            {share.permission === "read" ? (
                              <Eye className="size-3" />
                            ) : (
                              <Pencil className="size-3" />
                            )}
                            {permissionLabel(share.permission)}
                          </span>
                          {!share.enabled && <span>Disabled</span>}
                        </p>
                      </div>
                      <div className="share-item-actions">
                        <button
                          type="button"
                          className="share-icon-btn"
                          title="Copy link"
                          aria-label="Copy link"
                          onClick={() => void copyLink(share.token)}
                        >
                          {copied === share.token ? (
                            <Check className="size-3.5 text-accent" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="share-icon-btn"
                          title={
                            share.permission === "read"
                              ? "Switch to Editor"
                              : "Switch to Viewer"
                          }
                          aria-label="Toggle permission"
                          onClick={() => void handleTogglePermission(share)}
                        >
                          {share.permission === "read" ? (
                            <Pencil className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="share-icon-btn share-icon-btn-danger"
                          title="Remove link"
                          aria-label="Remove link"
                          onClick={() => void handleRemove(share._id)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <p className="share-hint">
              <Lock className="size-3.5 shrink-0" />
              Recipients open the link as Viewer or Editor. Only you can create or revoke
              links.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function scopeLabel(scope: ShareScope) {
  if (scope === "vault") return "vault";
  if (scope === "collection") return "collection";
  return "entry";
}
