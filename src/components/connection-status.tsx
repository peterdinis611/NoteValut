"use client";

import { useConvexConnectionState } from "convex/react";
import { CloudOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Status = "offline" | "syncing" | "live";

function useBrowserOnline() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
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

type Props = {
  className?: string;
  /** Compact rail chip for the sidebar account row. */
  variant?: "default" | "rail";
};

/** Compact online / Convex sync chip for the vault chrome. */
export function ConnectionStatus({ className = "", variant = "default" }: Props) {
  const online = useBrowserOnline();
  const conn = useConvexConnectionState();

  let status: Status = "live";
  if (!online) status = "offline";
  else if (!conn.isWebSocketConnected || conn.hasInflightRequests) status = "syncing";

  const label =
    status === "offline" ? "Offline" : status === "syncing" ? "Syncing" : "Live";
  const title =
    status === "offline"
      ? "No network — edits queue locally until you’re back online"
      : status === "syncing"
        ? "Talking to Convex…"
        : "Connected to Convex";

  if (variant === "rail") {
    return (
      <div
        className={`nv-conn-rail nv-conn-rail-${status} ${className}`}
        role="status"
        aria-live="polite"
        title={title}
      >
        <span className="nv-conn-rail-dot" aria-hidden />
        {status === "syncing" ? (
          <Loader2 className="size-3 nv-conn-spin" aria-hidden />
        ) : status === "offline" ? (
          <CloudOff className="size-3" aria-hidden />
        ) : null}
        <span className="nv-conn-rail-label">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`nv-conn nv-conn-${status} ${className}`}
      role="status"
      aria-live="polite"
      title={title}
    >
      {status === "offline" ? (
        <CloudOff className="size-3" />
      ) : status === "syncing" ? (
        <Loader2 className="size-3 nv-conn-spin" />
      ) : (
        <span className="nv-conn-dot" aria-hidden />
      )}
      <span>{label}</span>
    </div>
  );
}
