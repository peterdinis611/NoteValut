"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  drainQueuedPatches,
  subscribeOfflineQueue,
  queuedPatchCount,
} from "@/lib/offline-queue";
import { useToast } from "./toast";

/**
 * Flushes offline note patches when the browser comes back online.
 * Mount once under ConvexProvider (e.g. in Providers).
 */
export function OfflineQueueFlush() {
  const updateNote = useMutation(api.notes.update);
  const toast = useToast();
  const flushing = useRef(false);

  useEffect(() => {
    async function flush() {
      if (flushing.current || !navigator.onLine) return;
      const items = drainQueuedPatches();
      if (items.length === 0) return;
      flushing.current = true;
      let ok = 0;
      try {
        for (const item of items) {
          try {
            await updateNote({
              id: item.noteId as Id<"notes">,
              ...item.patch,
            });
            ok += 1;
          } catch {
            // Re-queue failed item
            const { enqueueNotePatch } = await import("@/lib/offline-queue");
            enqueueNotePatch(item.noteId, item.ownerId, item.patch);
          }
        }
        if (ok > 0) {
          toast.success(
            ok === 1 ? "Synced 1 offline edit" : `Synced ${ok} offline edits`,
          );
        }
      } finally {
        flushing.current = false;
      }
    }

    void flush();
    window.addEventListener("online", flush);
    const unsub = subscribeOfflineQueue(() => {
      if (navigator.onLine && queuedPatchCount() > 0) void flush();
    });
    return () => {
      window.removeEventListener("online", flush);
      unsub();
    };
  }, [updateNote, toast]);

  return null;
}
