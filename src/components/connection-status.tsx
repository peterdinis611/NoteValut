"use client";

import { useConvexConnectionState } from "convex/react";
import { CloudOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { queuedPatchCount, subscribeOfflineQueue } from "@/lib/offline-queue";

type Status = "offline" | "syncing" | "live" | "queued";

function useBrowserOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    function on() {
      setOnline(true);
    }
    function off() {
      setOnline(false);
    }
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function useQueueCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(queuedPatchCount());
    return subscribeOfflineQueue(setCount);
  }, []);
  return count;
}

type Props = {
  className?: string;
  /** Compact rail chip for the sidebar account row. */
  variant?: "default" | "rail";
};

/** Compact online / Convex sync chip for the vault chrome. */
export function ConnectionStatus({ className = "", variant = "default" }: Props) {
  const online = useBrowserOnline();
  const conn = useConvexConnectionState();
  const queue = useQueueCount();

  let status: Status = "live";
  if (!online) status = "offline";
  else if (queue > 0) status = "queued";
  else if (!conn.isWebSocketConnected || conn.hasInflightRequests) status = "syncing";

  const label =
    status === "offline"
      ? "Offline"
      : status === "queued"
        ? `${queue} pending`
        : status === "syncing"
          ? "Syncing"
          : "Live";
  const title =
    status === "offline"
      ? "No network — edits queue locally until you’re back online"
      : status === "queued"
        ? `${queue} edit${queue === 1 ? "" : "s"} waiting to sync`
        : status === "syncing"
          ? "Talking to Convex…"
          : "Connected to Convex";

  if (variant === "rail") {
    return (
      <div
        className={`nv-conn-rail nv-conn-rail-${status === "queued" ? "sync" : status} ${className}`}
        role="status"
        aria-live="polite"
        title={title}
      >
        <span className="nv-conn-rail-dot" aria-hidden />
        {status === "syncing" || status === "queued" ? (
          <Loader2 className="size-3 nv-conn-spin" aria-hidden />
        ) : status === "offline" ? (
          <CloudOff className="size-3" aria-hidden />
        ) : null}
        <span className="nv-conn-rail-label">{label}</span>
        {queue > 0 ? <span className="nv-conn-queue-badge">{queue}</span> : null}
      </div>
    );
  }

  return (
    <div
      className={`nv-conn nv-conn-${status === "queued" ? "sync" : status} ${className}`}
      role="status"
      aria-live="polite"
      title={title}
    >
      {status === "offline" ? (
        <CloudOff className="size-3" />
      ) : status === "syncing" || status === "queued" ? (
        <Loader2 className="size-3 nv-conn-spin" />
      ) : (
        <span className="nv-conn-dot" aria-hidden />
      )}
      <span>{label}</span>
      {queue > 0 ? <span className="nv-conn-queue-badge">{queue}</span> : null}
    </div>
  );
}
