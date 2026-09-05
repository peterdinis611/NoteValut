/** Recent + favorite Google Fonts (client localStorage). */

export type FontRef = {
  family: string;
  cssUrl: string;
  weight?: number;
};

type FontHistoryStore = {
  recent: Array<FontRef & { at: number }>;
  favorites: FontRef[];
};

const KEY = "notevault.font-history.v1";
const MAX_RECENT = 8;
const MAX_FAVORITES = 24;

const EMPTY: FontHistoryStore = { recent: [], favorites: [] };

function read(): FontHistoryStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as FontHistoryStore;
    return {
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, MAX_RECENT) : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.slice(0, MAX_FAVORITES) : [],
    };
  } catch {
    return EMPTY;
  }
}

function write(store: FontHistoryStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("nv-font-history"));
}

export function getFontHistory(): FontHistoryStore {
  return read();
}

export function rememberRecentFont(ref: FontRef) {
  const store = read();
  const nextRecent = [
    { ...ref, at: Date.now() },
    ...store.recent.filter((r) => r.family !== ref.family),
  ].slice(0, MAX_RECENT);
  write({ ...store, recent: nextRecent });
}

export function toggleFavoriteFont(ref: FontRef): boolean {
  const store = read();
  const exists = store.favorites.some((f) => f.family === ref.family);
  const favorites = exists
    ? store.favorites.filter((f) => f.family !== ref.family)
    : [{ family: ref.family, cssUrl: ref.cssUrl, weight: ref.weight }, ...store.favorites].slice(
        0,
        MAX_FAVORITES,
      );
  write({ ...store, favorites });
  return !exists;
}

export function isFavoriteFont(family: string): boolean {
  return read().favorites.some((f) => f.family === family);
}

export function subscribeFontHistory(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("nv-font-history", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("nv-font-history", handler);
    window.removeEventListener("storage", handler);
  };
}
