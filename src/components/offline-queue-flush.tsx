"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  clearConflict,
  drainQueuedPatches,
  getServerConflicts,
  listConflicts,
  parseConflictError,
  pushConflict,
  queuedPatchCount,
  subscribeConflicts,
  subscribeOfflineQueue,
  type ConflictItem,
} from "@/lib/offline-queue";
import { useToast } from "./toast";

function useConflicts() {
  return useSyncExternalStore(subscribeConflicts, listConflicts, getServerConflicts);
}

function patchPreview(patch: Record<string, unknown>): string {
  if (typeof patch.title === "string" && patch.title.trim()) {
    return `Title → ${patch.title}`;
  }
  if (Array.isArray(patch.blocks)) {
    const texts = (patch.blocks as Array<{ text?: string }>)
      .map((b) => (b.text ?? "").trim())
      .filter(Boolean)
      .slice(0, 3);
    if (texts.length) return texts.join(" · ");
  }
  if (typeof patch.content === "string" && patch.content.trim()) {
    return patch.content.trim().slice(0, 160);
  }
  return "Local edits waiting to sync";
}

/**
 * Flushes offline note patches when the browser comes back online.
 * Surfaces conflict UI when server note is newer than the queued base.
 */
export function OfflineQueueFlush() {
  const updateNote = useMutation(api.notes.update);
  const createNote = useMutation(api.notes.create);
  const toast = useToast();
  const flushing = useRef(false);
  const conflicts = useConflicts();
  const [active, setActive] = useState<ConflictItem | null>(null);

  useEffect(() => {
    if (!active && conflicts.length > 0) setActive(conflicts[0]!);
  }, [conflicts, active]);

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
              expectedUpdatedAt: item.baseUpdatedAt,
            });
            ok += 1;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            const conflict = parseConflictError(msg);
            if (conflict) {
              pushConflict({
                noteId: item.noteId,
                ownerId: item.ownerId,
                title: conflict.title,
                serverUpdatedAt: conflict.serverUpdatedAt,
                localPatch: item.patch,
                baseUpdatedAt: item.baseUpdatedAt,
              });
            } else {
              const { enqueueNotePatch } = await import("@/lib/offline-queue");
              enqueueNotePatch(item.noteId, item.ownerId, item.patch, item.baseUpdatedAt);
            }
          }
        }
        if (ok > 0) {
          toast.success(ok === 1 ? "Synced 1 offline edit" : `Synced ${ok} offline edits`);
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

  async function keepMine(item: ConflictItem) {
    try {
      await updateNote({
        id: item.noteId as Id<"notes">,
        ...item.localPatch,
      });
      clearConflict(item.noteId);
      setActive(null);
      toast.success("Kept your offline version");
    } catch {
      toast.error("Couldn’t apply your version");
    }
  }

  function keepTheirs(item: ConflictItem) {
    clearConflict(item.noteId);
    setActive(null);
    toast.success("Kept the server version");
  }

  async function keepBoth(item: ConflictItem) {
    try {
      const patch = item.localPatch;
      const title =
        typeof patch.title === "string" && patch.title.trim()
          ? `${patch.title} (offline)`
          : `${item.title} (offline)`;
      const blocks = Array.isArray(patch.blocks)
        ? (patch.blocks as NonNullable<Parameters<typeof createNote>[0]["blocks"]>)
        : typeof patch.content === "string"
          ? [
              {
                id: `offline-${Date.now()}`,
                type: "paragraph" as const,
                text: patch.content,
              },
            ]
          : undefined;
      await createNote({
        ownerId: item.ownerId,
        title,
        blocks,
        tags: Array.isArray(patch.tags) ? (patch.tags as string[]) : undefined,
      });
      clearConflict(item.noteId);
      setActive(null);
      toast.success("Saved offline edits as a new note");
    } catch {
      toast.error("Couldn’t keep both versions");
    }
  }

  if (!active) return null;

  return (
    <div className="nv-conflict" role="dialog" aria-label="Sync conflict">
      <div className="nv-conflict-card">
        <h3>Sync conflict</h3>
        <p>
          <strong>{active.title}</strong> changed on the server while you were offline.
        </p>
        <p className="nv-conflict-meta">
          Server updated {new Date(active.serverUpdatedAt).toLocaleString()}
        </p>
        <div className="nv-conflict-diff">
          <p className="nv-conflict-diff-label">Your offline changes</p>
          <pre>{patchPreview(active.localPatch)}</pre>
        </div>
        <div className="nv-conflict-actions">
          <button type="button" className="settings-btn" onClick={() => void keepMine(active)}>
            Keep mine
          </button>
          <button
            type="button"
            className="settings-btn settings-btn-ghost"
            onClick={() => keepTheirs(active)}
          >
            Keep server
          </button>
          <button
            type="button"
            className="settings-btn settings-btn-ghost"
            onClick={() => void keepBoth(active)}
          >
            Keep both
          </button>
        </div>
      </div>
    </div>
  );
}
