"use client";

import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo } from "react";
import { api } from "../../convex/_generated/api";

type Props = {
  ownerId: string;
  /** Active note id for “viewing …” hint */
  noteId?: string | null;
  enabled?: boolean;
};

function sessionId() {
  if (typeof window === "undefined") return "ssr";
  const key = "nv-presence-session";
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
  }
  return id;
}

/** Compact “who’s here” chip row for the active workspace (team or personal). */
export function WorkspacePresence({ ownerId, noteId, enabled = true }: Props) {
  const { user } = useUser();
  const vault = useQuery(api.vaultSettings.get, enabled ? { ownerId } : "skip");
  const wsId = vault?.activeWorkspaceId ?? ownerId;
  const shareToken = wsId.startsWith("org:") ? `ws:${wsId}` : `vault:${ownerId}`;
  const sid = useMemo(() => sessionId(), []);
  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "You";
  const heartbeat = useMutation(api.presence.heartbeat);
  const leave = useMutation(api.presence.leave);
  const peers = useQuery(
    api.presence.listActive,
    enabled ? { shareToken } : "skip",
  );

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      void heartbeat({
        shareToken,
        sessionId: sid,
        displayName,
        noteId: noteId ?? undefined,
      }).catch(() => {});
    };
    tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      window.clearInterval(id);
      void leave({ shareToken, sessionId: sid }).catch(() => {});
    };
  }, [enabled, shareToken, sid, displayName, noteId, heartbeat, leave]);

  const others = (peers ?? []).filter((p) => p.sessionId !== sid);
  if (!enabled || others.length === 0) return null;

  return (
    <div className="ws-presence" aria-label="Teammates online">
      <span className="ws-presence-label">Online</span>
      <ul className="ws-presence-list">
        {others.slice(0, 6).map((p) => (
          <li
            key={p.sessionId}
            title={p.displayName}
            style={{ ["--ws-dot" as string]: p.color }}
          >
            <span className="ws-presence-dot" aria-hidden />
            <span className="ws-presence-name">{p.displayName}</span>
          </li>
        ))}
        {others.length > 6 ? (
          <li className="ws-presence-more">+{others.length - 6}</li>
        ) : null}
      </ul>
    </div>
  );
}
