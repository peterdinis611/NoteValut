"use client";

import { Focus } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import {
  getFocusMode,
  getServerFocusMode,
  setFocusMode,
  subscribeFocusMode,
  toggleFocusMode,
} from "@/lib/focus-mode";

type Props = {
  className?: string;
  label?: string;
  /** Compact icon-only control */
  compact?: boolean;
};

function applyDomClass(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("nv-focus-mode", on);
}

export function FocusModeToggle({ className, label = "Focus mode", compact }: Props) {
  const on = useSyncExternalStore(subscribeFocusMode, getFocusMode, getServerFocusMode);

  useEffect(() => {
    applyDomClass(on);
  }, [on]);

  useEffect(() => {
    applyDomClass(getFocusMode());
    return () => {
      /* leave class if user navigates — intentional persistence */
    };
  }, []);

  return (
    <button
      type="button"
      className={className ?? (compact ? "vault-link-btn" : "vault-btn-secondary")}
      aria-pressed={on}
      title={on ? "Exit focus mode" : "Enter focus mode"}
      onClick={() => {
        const next = toggleFocusMode();
        applyDomClass(next);
      }}
    >
      <Focus className="size-3.5" />
      {!compact && <span>{on ? "Focus on" : label}</span>}
    </button>
  );
}

/** Ensure document class matches stored preference on app boot. */
export function FocusModeBoot() {
  const on = useSyncExternalStore(subscribeFocusMode, getFocusMode, getServerFocusMode);
  useEffect(() => {
    applyDomClass(on);
  }, [on]);
  return null;
}

export { setFocusMode, toggleFocusMode, getFocusMode };
