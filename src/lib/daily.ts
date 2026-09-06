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

/** Build a week strip centered around a key (Sun–Sat local). */
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

export type MonthCursor = { year: number; month: number };

/** 0-based month. */
export function monthCursorFromKey(key = toDailyKey()): MonthCursor {
  const date = parseDailyKey(key) ?? new Date();
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function shiftMonth(year: number, month: number, delta: number): MonthCursor {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** All YYYY-MM-DD keys in a month (0-based month). */
export function monthKeys(year: number, month: number): string[] {
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => toDailyKey(new Date(year, month, i + 1)));
}

export type MonthGridCell = {
  key: string;
  inMonth: boolean;
  day: number;
};

/**
 * Sun–Sat padded month grid cells for a calendar view.
 * Leading/trailing cells belong to adjacent months (`inMonth: false`).
 */
export function monthGridKeys(year: number, month: number): MonthGridCell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: MonthGridCell[] = [];

  for (let i = 0; i < total; i++) {
    const date = new Date(year, month, 1 - startOffset + i);
    cells.push({
      key: toDailyKey(date),
      inMonth: date.getMonth() === month,
      day: date.getDate(),
    });
  }

  return cells;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
