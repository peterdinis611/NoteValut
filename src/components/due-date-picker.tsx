"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  WEEKDAY_LABELS,
  formatMonthLabel,
  isTodayKey,
  monthCursorFromKey,
  monthGridKeys,
  shiftMonth,
  toDailyKey,
} from "@/lib/daily";

type Props = {
  value?: number;
  overdue?: boolean;
  readOnly?: boolean;
  onChange: (dueAt: number | undefined) => void;
};

function noonFromKey(key: string): number {
  return new Date(`${key}T12:00:00`).getTime();
}

function formatChip(dueAt: number) {
  const key = toDailyKey(new Date(dueAt));
  if (isTodayKey(key)) return "Today";
  const tomorrow = toDailyKey(new Date(Date.now() + 86_400_000));
  if (key === tomorrow) return "Tomorrow";
  return new Date(dueAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Phosphor-styled due date chip + mini month popover (replaces native date input). */
export function DueDatePicker({ value, overdue, readOnly, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selectedKey = value ? toDailyKey(new Date(value)) : null;
  const [cursor, setCursor] = useState(() => monthCursorFromKey(selectedKey ?? toDailyKey()));
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const grid = useMemo(() => monthGridKeys(cursor.year, cursor.month), [cursor.year, cursor.month]);

  useEffect(() => {
    if (!open) return;
    setCursor(monthCursorFromKey(selectedKey ?? toDailyKey()));
  }, [open, selectedKey]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (readOnly) {
    if (!value) return null;
    return (
      <span className={`nv-due-chip nv-due-chip-ro ${overdue ? "is-overdue" : ""}`}>
        <CalendarDays className="size-3" />
        {formatChip(value)}
      </span>
    );
  }

  return (
    <div className="nv-due" ref={rootRef}>
      <button
        type="button"
        className={`nv-due-chip ${value ? "has-value" : ""} ${overdue ? "is-overdue" : ""} ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        title="Due date"
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarDays className="size-3.5" />
        <span>{value ? formatChip(value) : "Due"}</span>
        {value ? (
          <span
            className="nv-due-clear"
            role="button"
            tabIndex={-1}
            aria-label="Clear due date"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
              setOpen(false);
            }}
          >
            <X className="size-3" />
          </span>
        ) : null}
      </button>

      {open && (
        <div id={panelId} className="nv-due-pop" role="dialog" aria-label="Pick due date">
          <div className="nv-due-presets">
            <button
              type="button"
              onClick={() => {
                onChange(noonFromKey(toDailyKey()));
                setOpen(false);
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(noonFromKey(toDailyKey(new Date(Date.now() + 86_400_000))));
                setOpen(false);
              }}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(noonFromKey(toDailyKey(new Date(Date.now() + 7 * 86_400_000))));
                setOpen(false);
              }}
            >
              +1 week
            </button>
          </div>

          <div className="nv-due-month-head">
            <button
              type="button"
              className="nv-due-nav"
              aria-label="Previous month"
              onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="nv-due-month-label">{formatMonthLabel(cursor.year, cursor.month)}</p>
            <button
              type="button"
              className="nv-due-nav"
              aria-label="Next month"
              onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="nv-due-grid" role="grid">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d} className="nv-due-weekday">
                {d.slice(0, 2)}
              </span>
            ))}
            {grid.map((cell) => {
              const selected = selectedKey === cell.key;
              const today = isTodayKey(cell.key);
              return (
                <button
                  key={cell.key}
                  type="button"
                  role="gridcell"
                  className={`nv-due-day ${!cell.inMonth ? "is-outside" : ""} ${today ? "is-today" : ""} ${selected ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(noonFromKey(cell.key));
                    setOpen(false);
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
