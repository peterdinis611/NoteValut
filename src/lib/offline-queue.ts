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
  /** Note.updatedAt when the offline edit started — used for conflict detection. */
  baseUpdatedAt?: number;
};

export type ConflictItem = {
  noteId: string;
  ownerId: string;
  title: string;
  serverUpdatedAt: number;
  localPatch: Record<string, unknown>;
  baseUpdatedAt?: number;
};

const KEY = "notevault.offline-queue.v1";
const CONFLICT_KEY = "notevault.offline-conflicts.v1";
const EMPTY_CONFLICTS: ConflictItem[] = [];

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
  baseUpdatedAt?: number,
): QueuedNotePatch {
  const items = read().filter((q) => q.noteId !== noteId);
  const entry: QueuedNotePatch = {
    id: `${noteId}-${Date.now()}`,
    noteId,
    ownerId,
    patch,
    queuedAt: Date.now(),
    baseUpdatedAt,
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

function readConflicts(): ConflictItem[] {
  if (typeof window === "undefined") return EMPTY_CONFLICTS;
  try {
    const raw = localStorage.getItem(CONFLICT_KEY);
    if (!raw) return EMPTY_CONFLICTS;
    const parsed = JSON.parse(raw) as ConflictItem[];
    return Array.isArray(parsed) ? parsed : EMPTY_CONFLICTS;
  } catch {
    return EMPTY_CONFLICTS;
  }
}

/** Stable snapshot for SSR (`useSyncExternalStore` getServerSnapshot). */
export function getServerConflicts(): ConflictItem[] {
  return EMPTY_CONFLICTS;
}

function writeConflicts(items: ConflictItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFLICT_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("nv-offline-conflicts", { detail: { count: items.length } }));
}

export function pushConflict(item: ConflictItem) {
  const next = [...readConflicts().filter((c) => c.noteId !== item.noteId), item];
  writeConflicts(next);
}

export function listConflicts(): ConflictItem[] {
  return readConflicts();
}

export function clearConflict(noteId: string) {
  writeConflicts(readConflicts().filter((c) => c.noteId !== noteId));
}

export function subscribeConflicts(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("nv-offline-conflicts", handler);
  return () => window.removeEventListener("nv-offline-conflicts", handler);
}

export function parseConflictError(message: string): {
  serverUpdatedAt: number;
  title: string;
} | null {
  if (!message.startsWith("CONFLICT:")) return null;
  const parts = message.split(":");
  const serverUpdatedAt = Number(parts[1]);
  const title = parts.slice(2).join(":") || "Untitled";
  if (!Number.isFinite(serverUpdatedAt)) return null;
  return { serverUpdatedAt, title };
}
