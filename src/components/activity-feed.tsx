"use client";

import { useQuery } from "convex/react";
import { Activity, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { formatRelativeTime } from "@/lib/format";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onNavigate?: (id: Id<"notes">) => void;
};

export function ActivityFeed({ ownerId, open, onClose, onNavigate }: Props) {
  const items = useQuery(api.activity.list, open ? { ownerId, limit: 50 } : "skip");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

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
                <p className="share-panel-subtitle">Edits, restores, rules, and more</p>
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
                {items.map((row) => (
                  <li key={row._id} className="activity-feed-row">
                    <div>
                      <p className="activity-feed-summary">{row.summary}</p>
                      <p className="activity-feed-meta">
                        <span className="activity-feed-action">{row.action}</span>
                        · {formatRelativeTime(row.createdAt)}
                        {row.actorName ? ` · ${row.actorName}` : ""}
                      </p>
                    </div>
                    {row.noteId && onNavigate && (
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
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
