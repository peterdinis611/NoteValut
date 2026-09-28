"use client";

import { useMutation, useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatRelativeTime } from "@/lib/format";

type Props = {
  ownerId: string;
  onNavigate?: (id: Id<"notes">) => void;
};

export function NotificationsBell({ ownerId, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const unread = useQuery(api.notifications.unreadCount, { ownerId });
  const items = useQuery(api.notifications.listForUser, open ? { ownerId, limit: 20 } : "skip");
  const markRead = useMutation(api.notifications.markRead);

  return (
    <div className="nv-notif">
      <button
        type="button"
        className="topbar-btn nv-notif-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
        {(unread ?? 0) > 0 ? <span className="nv-notif-dot">{unread}</span> : null}
      </button>
      {open ? (
        <div className="nv-notif-panel" role="dialog" aria-label="Notifications">
          <header className="nv-notif-head">
            <span>Notifications</span>
            <button
              type="button"
              className="settings-btn settings-btn-ghost"
              onClick={() => void markRead({ ownerId, all: true })}
            >
              Mark all read
            </button>
          </header>
          {!items?.length ? (
            <p className="settings-empty">No notifications</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n._id} className={n.read ? "" : "is-unread"}>
                  <button
                    type="button"
                    onClick={() => {
                      void markRead({ ownerId, id: n._id });
                      if (n.noteId) onNavigate?.(n.noteId);
                      setOpen(false);
                    }}
                  >
                    <strong>{n.title}</strong>
                    {n.body ? <span>{n.body}</span> : null}
                    <em>{formatRelativeTime(n.createdAt)}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
