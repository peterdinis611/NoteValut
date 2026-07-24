"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  onOpenNote?: (noteId: string) => void;
};

/**
 * While the vault app is open, pick up fired calendar reminders and surface
 * them via toast + browser Notification (when permission is granted).
 */
export function ReminderListener({ ownerId, onOpenNote }: Props) {
  const toast = useToast();
  const fired = useQuery(api.reminders.listFired, { ownerId });
  const dismiss = useMutation(api.reminders.dismiss);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!fired?.length) return;

    for (const row of fired) {
      if (seen.current.has(row._id)) continue;
      seen.current.add(row._id);

      const when = new Date(row.remindAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
      const message = `${row.title} · ${when}`;
      toast.info(message);

      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            const n = new Notification("NoteVault reminder", {
              body: message,
              tag: row._id,
              icon: "/icons/icon-192.svg",
            });
            n.onclick = () => {
              window.focus();
              if (row.noteId && onOpenNote) onOpenNote(row.noteId);
              n.close();
            };
          } catch {
            /* Notification constructor can throw in some contexts */
          }
        }
      }

      void dismiss({ ownerId, reminderId: row._id }).catch(() => {});
    }
  }, [fired, dismiss, ownerId, onOpenNote, toast]);

  return null;
}
