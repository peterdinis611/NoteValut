"use client";

import { useMutation, useQuery } from "convex/react";
import { Activity, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { formatRelativeTime } from "@/lib/format";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onNavigate?: (id: Id<"notes">) => void;
};

export function ActivityFeed({ ownerId, open, onClose, onNavigate }: Props) {
  const toast = useToast();
  const items = useQuery(api.activity.list, open ? { ownerId, limit: 50 } : "skip");
  const restore = useMutation(api.versions.restore);
  const [mounted, setMounted] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  async function handleRestore(noteId: Id<"notes">, versionId: Id<"noteVersions">) {
    setBusyId(versionId);
    try {
      await restore({ noteId, versionId });
      toast.success("Restored previous version");
      onNavigate?.(noteId);
      onClose();
    } catch {
      toast.error("Couldn’t restore");
    } finally {
      setBusyId(null);
    }
  }

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="share-panel activity-feed-panel"
          role="dialog"
          aria-modal
          aria-labelledby="activity-feed-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="share-panel-header">
            <div className="share-panel-heading">
              <span className="share-panel-icon" aria-hidden>
                <Activity className="size-4" />
              </span>
              <div>
                <h2 id="activity-feed-title" className="share-panel-title">
                  Activity
                </h2>
                <p className="share-panel-subtitle">Edits, restores, rules — one-click undo</p>
              </div>
            </div>
            <button type="button" className="share-panel-close" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </header>

          <div className="activity-feed-list note-scroll">
            {items === undefined ? (
              <p className="settings-empty">Loading…</p>
            ) : items.length === 0 ? (
              <p className="settings-empty">No activity yet</p>
            ) : (
              <ul>
                {items.map((row) => {
                  const meta = row.meta as { versionId?: string } | undefined;
                  const versionId = meta?.versionId as Id<"noteVersions"> | undefined;
                  return (
                    <li key={row._id} className="activity-feed-row">
                      <div>
                        <p className="activity-feed-summary">{row.summary}</p>
                        <p className="activity-feed-meta">
                          <span className="activity-feed-action">{row.action}</span>
                          · {formatRelativeTime(row.createdAt)}
                          {row.actorName ? ` · ${row.actorName}` : ""}
                        </p>
                      </div>
                      <div className="activity-feed-actions">
                        {row.noteId && versionId ? (
                          <button
                            type="button"
                            className="settings-btn"
                            disabled={busyId === versionId}
                            onClick={() => void handleRestore(row.noteId!, versionId)}
                            title="Restore the snapshot taken before this edit"
                          >
                            <RotateCcw className="size-3.5" />
                            Restore
                          </button>
                        ) : null}
                        {row.noteId && onNavigate ? (
                          <button
                            type="button"
                            className="settings-btn settings-btn-ghost"
                            onClick={() => {
                              onNavigate(row.noteId!);
                              onClose();
                            }}
                          >
                            Open
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
