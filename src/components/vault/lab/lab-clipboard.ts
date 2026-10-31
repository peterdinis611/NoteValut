const STORAGE_KEY = "notevalut.lab.clipboard.session";
const EVENT = "notevalut:lab-clipboard";
export const CLIPBOARD_LIMIT = 24;

export type ClipboardEntry = {
  id: string;
  text: string;
  at: number;
};

function read(): ClipboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ClipboardEntry =>
        item != null &&
        typeof item === "object" &&
        typeof (item as ClipboardEntry).id === "string" &&
        typeof (item as ClipboardEntry).text === "string" &&
        typeof (item as ClipboardEntry).at === "number",
    );
  } catch {
    return [];
  }
}

function write(entries: ClipboardEntry[]) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { entries } satisfies { entries: ClipboardEntry[] } }),
  );
}

export function listClipboardHistory(): ClipboardEntry[] {
  return read();
}

export function pushClipboardHistory(text: string) {
  const trimmed = text;
  if (!trimmed) return;
  const prev = read().filter((entry) => entry.text !== trimmed);
  const next: ClipboardEntry[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      at: Date.now(),
    },
    ...prev,
  ].slice(0, CLIPBOARD_LIMIT);
  write(next);
}

export function removeClipboardEntry(id: string) {
  write(read().filter((entry) => entry.id !== id));
}

export function clearClipboardHistory() {
  write([]);
}

export function subscribeClipboardHistory(
  listener: (entries: ClipboardEntry[]) => void,
) {
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ entries: ClipboardEntry[] }>).detail;
    listener(detail?.entries ?? read());
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener(read());
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

/** Capture vault/lab writeText calls into session history for this tab. */
export function installClipboardCapture(): () => void {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return () => {};
  }
  const original = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = async (data: string) => {
    const result = await original(data);
    try {
      pushClipboardHistory(String(data));
    } catch {
      // ignore history failures
    }
    return result;
  };
  return () => {
    navigator.clipboard.writeText = original;
  };
}

export async function copyWithHistory(text: string) {
  await navigator.clipboard.writeText(text);
}
