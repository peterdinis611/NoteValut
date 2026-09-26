"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef } from "react";
import { api } from "../../convex/_generated/api";

type Props = {
  shareToken: string;
  noteId?: string | null;
  displayName?: string;
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

export function SharePresenceBar({
  shareToken,
  noteId,
  displayName = "Guest",
  enabled = true,
}: Props) {
  const sid = useMemo(() => sessionId(), []);
  const heartbeat = useMutation(api.presence.heartbeat);
  const leave = useMutation(api.presence.leave);
  const peers = useQuery(api.presence.listActive, enabled ? { shareToken } : "skip");
  const pointer = useRef({ x: 0, y: 0, blockId: undefined as string | undefined });

  useEffect(() => {
    if (!enabled) return;

    function onMove(e: PointerEvent) {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const block = el?.closest<HTMLElement>("[data-block-id]");
      pointer.current.blockId = block?.dataset.blockId;
    }
    window.addEventListener("pointermove", onMove);

    const tick = () => {
      void heartbeat({
        shareToken,
        sessionId: sid,
        displayName,
        noteId: noteId ?? undefined,
        cursorBlockId: pointer.current.blockId,
        cursorX: pointer.current.x,
        cursorY: pointer.current.y,
      }).catch(() => {});
    };
    tick();
    const id = window.setInterval(tick, 3000);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(id);
      void leave({ shareToken, sessionId: sid }).catch(() => {});
    };
  }, [enabled, shareToken, sid, displayName, noteId, heartbeat, leave]);

  const others = (peers ?? []).filter((p) => p.sessionId !== sid);
  if (!enabled) return null;

  return (
    <>
      <div className="presence-bar" aria-live="polite">
        {others.length === 0 ? (
          <span className="presence-alone">Only you here</span>
        ) : (
          others.map((p) => (
            <span key={p.sessionId} className="presence-chip" style={{ borderColor: p.color }}>
              <span className="presence-dot" style={{ background: p.color }} />
              {p.displayName}
            </span>
          ))
        )}
      </div>
      {others.map((p) =>
        p.cursorX != null && p.cursorY != null ? (
          <div
            key={`cursor-${p.sessionId}`}
            className="presence-cursor"
            style={{
              left: p.cursorX,
              top: p.cursorY,
              color: p.color,
            }}
            aria-hidden
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
              <path d="M0 0 L16 12 L9 13 L12 20 L8 21 L5 14 L0 18 Z" />
            </svg>
            <span style={{ background: p.color }}>{p.displayName}</span>
          </div>
        ) : null,
      )}
    </>
  );
}
