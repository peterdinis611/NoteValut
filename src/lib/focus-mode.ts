const STORAGE_KEY = "notevault.focus-mode";

type Listener = () => void;

const listeners = new Set<Listener>();

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let cached = false;
let hydrated = false;

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  cached = readStored();
  hydrated = true;
}

export function getFocusMode(): boolean {
  ensureHydrated();
  return cached;
}

export function getServerFocusMode(): boolean {
  return false;
}

export function setFocusMode(on: boolean) {
  ensureHydrated();
  cached = on;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore quota */
  }
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("nv-focus-mode", on);
  }
  for (const l of listeners) l();
}

export function toggleFocusMode(): boolean {
  const next = !getFocusMode();
  setFocusMode(next);
  return next;
}

export function subscribeFocusMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
