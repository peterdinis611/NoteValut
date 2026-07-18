"use client";

import { useMutation, useQuery } from "convex/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  formatDailyTitle,
  isTodayKey,
  parseDailyKey,
  shiftDailyKey,
  toDailyKey,
  weekKeysAround,
} from "@/lib/daily";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  onOpenNote: (id: Id<"notes">) => void;
  compact?: boolean;
};

export function DailyCalendar({ ownerId, onOpenNote, compact = false }: Props) {
  const toast = useToast();
  const [centerKey, setCenterKey] = useState(() => toDailyKey());
  const week = useMemo(() => weekKeysAround(centerKey), [centerKey]);
  const existing = useQuery(api.notes.listDailyKeys, { ownerId, keys: week });
  const getOrCreate = useMutation(api.notes.getOrCreateDaily);

  async function openDay(key: string) {
    try {
      const id = await getOrCreate({ ownerId, dailyKey: key });
      onOpenNote(id);
    } catch {
      toast.error("Couldn’t open daily note");
    }
  }

  return (
    <section className={`daily-calendar ${compact ? "daily-calendar-compact" : ""}`}>
      <div className="daily-calendar-head">
        <div className="daily-calendar-title">
          <CalendarDays className="size-4 text-accent" />
          <div>
            <h2>Daily notes</h2>
            {!compact && <p>Jump to today or any day this week</p>}
          </div>
        </div>
        <div className="daily-calendar-nav">
          <button
            type="button"
            className="topbar-btn"
            aria-label="Previous week"
            onClick={() => setCenterKey(shiftDailyKey(centerKey, -7))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={() => void openDay(toDailyKey())}
          >
            Today
          </button>
          <button
            type="button"
            className="topbar-btn"
            aria-label="Next week"
            onClick={() => setCenterKey(shiftDailyKey(centerKey, 7))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="daily-week">
        {week.map((key) => {
          const date = parseDailyKey(key);
          const hasNote = !!existing?.[key];
          const today = isTodayKey(key);
          return (
            <button
              key={key}
              type="button"
              className={`daily-day ${today ? "daily-day-today" : ""} ${
                hasNote ? "daily-day-filled" : ""
              }`}
              title={formatDailyTitle(key)}
              onClick={() => void openDay(key)}
            >
              <span className="daily-day-name">
                {date?.toLocaleDateString(undefined, { weekday: "short" }) ?? "—"}
              </span>
              <span className="daily-day-num">{date?.getDate() ?? "—"}</span>
              <span className={`daily-day-dot ${hasNote ? "daily-day-dot-on" : ""}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
