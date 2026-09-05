/**
 * Offline-first queue for note update patches.
 * Flushes when the browser is online again.
 */

export type QueuedNotePatch = {
  id: string;
  noteId: string;
  ownerId: string;
  patch: Record<string, unknown>;
  queuedAt: number;
};

const KEY = "notevault.offline-queue.v1";

function read(): QueuedNotePatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedNotePatch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: QueuedNotePatch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("nv-offline-queue", { detail: { count: items.length } }));
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function enqueueNotePatch(
  noteId: string,
  ownerId: string,
  patch: Record<string, unknown>,
): QueuedNotePatch {
  const items = read().filter((q) => q.noteId !== noteId);
  const entry: QueuedNotePatch = {
    id: `${noteId}-${Date.now()}`,
    noteId,
    ownerId,
    patch,
    queuedAt: Date.now(),
  };
  items.push(entry);
  write(items);
  return entry;
}

export function listQueuedPatches(): QueuedNotePatch[] {
  return read();
}

export function queuedPatchCount(): number {
  return read().length;
}

export function clearQueuedPatch(id: string) {
  write(read().filter((q) => q.id !== id));
}

export function clearAllQueuedPatches() {
  write([]);
}

/** Merge latest patch per noteId and return in queue order. */
export function drainQueuedPatches(): QueuedNotePatch[] {
  const items = read();
  write([]);
  return items;
}

export function subscribeOfflineQueue(cb: (count: number) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(queuedPatchCount());
  window.addEventListener("nv-offline-queue", handler);
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  return () => {
    window.removeEventListener("nv-offline-queue", handler);
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
}
