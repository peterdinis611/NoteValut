const KEY = "notevault.cmd-recent.v1";
const MAX = 8;

export type RecentSearch = {
  q: string;
  at: number;
};

const EMPTY_RECENT: RecentSearch[] = [];

function read(): RecentSearch[] {
  if (typeof window === "undefined") return EMPTY_RECENT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_RECENT;
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : EMPTY_RECENT;
  } catch {
    return EMPTY_RECENT;
  }
}

/** Stable snapshot for SSR (`useSyncExternalStore` getServerSnapshot). */
export function getServerRecentSearches(): RecentSearch[] {
  return EMPTY_RECENT;
}

function write(items: RecentSearch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event("nv-cmd-recent"));
}

export function getRecentSearches(): RecentSearch[] {
  return read();
}

export function rememberSearch(q: string) {
  const trimmed = q.trim();
  if (trimmed.length < 2) return;
  const next = [
    { q: trimmed, at: Date.now() },
    ...read().filter((r) => r.q.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX);
  write(next);
}

export function clearRecentSearches() {
  write([]);
}

export function subscribeRecentSearches(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("nv-cmd-recent", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("nv-cmd-recent", handler);
    window.removeEventListener("storage", handler);
  };
}
