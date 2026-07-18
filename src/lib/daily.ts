/** Local calendar helpers for daily notes (YYYY-MM-DD). */

export function toDailyKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDailyKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDailyTitle(key: string): string {
  const date = parseDailyKey(key);
  if (!date) return `Daily · ${key}`;
  return `Daily · ${date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function shiftDailyKey(key: string, days: number): string {
  const date = parseDailyKey(key) ?? new Date();
  date.setDate(date.getDate() + days);
  return toDailyKey(date);
}

/** Build a week strip centered around a key (Sun–Sat or Mon–Sun local). */
export function weekKeysAround(centerKey: string): string[] {
  const date = parseDailyKey(centerKey) ?? new Date();
  const day = date.getDay(); // 0 Sun
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDailyKey(d);
  });
}

export function isTodayKey(key: string): boolean {
  return key === toDailyKey();
}
