"use client";

import { useConvexConnectionState } from "convex/react";
import { CloudOff, Loader2, Radio } from "lucide-react";
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

/** Compact online / Convex sync chip for the vault chrome. */
export function ConnectionStatus({ className = "" }: { className?: string }) {
  const online = useBrowserOnline();
  const conn = useConvexConnectionState();

  let status: Status = "live";
  if (!online) status = "offline";
  else if (!conn.isWebSocketConnected || conn.hasInflightRequests) status = "syncing";

  const label =
    status === "offline" ? "Offline" : status === "syncing" ? "Syncing" : "Live";
  const Icon =
    status === "offline" ? CloudOff : status === "syncing" ? Loader2 : Radio;

  return (
    <div
      className={`nv-conn ${status === "offline" ? "nv-conn-offline" : ""} ${status === "syncing" ? "nv-conn-sync" : ""} ${status === "live" ? "nv-conn-live" : ""} ${className}`}
      role="status"
      aria-live="polite"
      title={
        status === "offline"
          ? "No network — changes wait until you’re back online"
          : status === "syncing"
            ? "Talking to Convex…"
            : "Connected to Convex"
      }
    >
      <Icon className={`size-3 ${status === "syncing" ? "nv-conn-spin" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
