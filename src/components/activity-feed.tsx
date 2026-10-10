"use client";

import { useMutation, useQuery } from "convex/react";
import { Activity, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "edit", label: "Edits" },
  { value: "restore", label: "Restores" },
  { value: "inbox_rule", label: "Inbox rules" },
  { value: "status", label: "Status" },
  { value: "tags", label: "Tags" },
  { value: "properties", label: "Properties" },
];

export function ActivityFeed({ ownerId, open, onClose, onNavigate }: Props) {
  const toast = useToast();
  const workspaces = useQuery(api.workspaces.listForUser, open ? { ownerId } : "skip");
  const vault = useQuery(api.vaultSettings.get, open ? { ownerId } : "skip");
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    const active = vault?.activeWorkspaceId;
    if (active?.startsWith("org:")) setWorkspaceFilter(active);
    else setWorkspaceFilter("");
  }, [open, vault?.activeWorkspaceId]);

  const items = useQuery(
    api.activity.list,
    open
      ? {
          ownerId,
          limit: 50,
          workspaceId: workspaceFilter || undefined,
          action: actionFilter || undefined,
          actorId: actorFilter || undefined,
        }
      : "skip",
  );
  const restore = useMutation(api.versions.restore);
  const [mounted, setMounted] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const actors = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of items ?? []) {
      map.set(row.actorId, row.actorName || row.actorId.slice(0, 10));
    }
    return [...map.entries()];
  }, [items]);

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
                <p className="share-panel-subtitle">
                  Org & vault audit — filter by workspace, action, actor
                </p>
              </div>
            </div>
            <button type="button" className="share-panel-close" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </header>

          <div className="activity-feed-filters">
            <select
              className="settings-select"
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
              aria-label="Workspace"
            >
              <option value="">All workspaces</option>
              {(workspaces ?? []).map((w) => (
                <option key={w.workspaceId} value={w.workspaceId}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              className="settings-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Action"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="settings-select"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              aria-label="Actor"
            >
              <option value="">All people</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

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
                          {row.workspaceId?.startsWith("org:") ? " · team" : ""}
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
