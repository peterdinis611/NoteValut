"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sun,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  WEEKDAY_LABELS,
  formatDailyTitle,
  formatMonthLabel,
  isTodayKey,
  monthCursorFromKey,
  monthGridKeys,
  monthKeys,
  parseDailyKey,
  shiftMonth,
  toDailyKey,
} from "@/lib/daily";
import { easeOutSoft, fadeUpVariants } from "@/lib/motion";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  onClose: () => void;
  onNavigate: (id: Id<"notes">) => void;
};

function defaultRemindTime(dailyKey: string): string {
  const today = toDailyKey();
  if (dailyKey === today) {
    const d = new Date(Date.now() + 5 * 60_000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return "09:00";
}

function remindAtFromKeyAndTime(dailyKey: string, time: string): number {
  const [hh, mm] = time.split(":").map((v) => Number(v));
  const date = parseDailyKey(dailyKey) ?? new Date();
  date.setHours(hh || 0, mm || 0, 0, 0);
  return date.getTime();
}

export function CalendarPage({ ownerId, onClose, onNavigate }: Props) {
  const toast = useToast();
  const [cursor, setCursor] = useState(() => monthCursorFromKey());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [remindTime, setRemindTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const getOrCreate = useMutation(api.notes.getOrCreateDaily);
  const scheduleReminder = useMutation(api.reminders.schedule);
  const cancelReminder = useMutation(api.reminders.cancel);

  const keys = useMemo(
    () => monthKeys(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );
  const grid = useMemo(
    () => monthGridKeys(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );
  const existing = useQuery(
    api.notes.listDailyKeys,
    ownerId ? { ownerId, keys } : "skip",
  );
  const scheduled = useQuery(
    api.reminders.listScheduledForKeys,
    ownerId ? { ownerId, keys } : "skip",
  );

  const agenda = useMemo(() => {
    if (!existing) return [];
    return keys
      .filter((key) => existing[key])
      .map((key) => ({
        key,
        id: existing[key]!,
        title: formatDailyTitle(key),
        date: parseDailyKey(key),
        reminder: scheduled?.[key],
      }));
  }, [existing, keys, scheduled]);

  function selectDay(key: string) {
    setSelectedKey(key);
    setRemindTime(defaultRemindTime(key));
  }

  async function openDay(key: string, knownId?: Id<"notes">) {
    try {
      if (knownId) {
        onNavigate(knownId);
        return;
      }
      const id = await getOrCreate({ ownerId, dailyKey: key });
      onNavigate(id);
    } catch {
      toast.error("Couldn’t open daily note");
    }
  }

  function goToday() {
    const today = toDailyKey();
    setCursor(monthCursorFromKey(today));
    selectDay(today);
  }

  async function handleSetReminder() {
    if (!selectedKey) return;
    setBusy(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
      }
      const noteId = existing?.[selectedKey];
      const remindAt = remindAtFromKeyAndTime(selectedKey, remindTime);
      await scheduleReminder({
        ownerId,
        dailyKey: selectedKey,
        remindAt,
        noteId,
        title: formatDailyTitle(selectedKey),
      });
      toast.success(
        `Reminder set for ${new Date(remindAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t set reminder");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelReminder() {
    const id = selectedKey ? scheduled?.[selectedKey]?.id : null;
    if (!selectedKey || !id) return;
    setBusy(true);
    try {
      await cancelReminder({
        ownerId,
        reminderId: id as Id<"reminders">,
      });
      toast.success("Reminder cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t cancel");
    } finally {
      setBusy(false);
    }
  }

  const selectedReminder = selectedKey ? scheduled?.[selectedKey] : undefined;

  return (
    <motion.div
      className="calendar-page note-scroll"
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
      transition={easeOutSoft}
    >
      <header className="settings-header">
        <div>
          <p className="settings-kicker">
            <CalendarDays className="size-3.5" />
            Daily
          </p>
          <h1 className="settings-title">Calendar</h1>
          <p className="settings-subtitle">
            Select a day to open its note or set a reminder (notifies while the
            app is open)
          </p>
        </div>
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Close calendar"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="calendar-layout">
        <section className="calendar-month">
          <div className="calendar-month-head">
            <h2 className="calendar-month-title">
              {formatMonthLabel(cursor.year, cursor.month)}
            </h2>
            <div className="calendar-month-nav">
              <button
                type="button"
                className="topbar-btn"
                aria-label="Previous month"
                onClick={() =>
                  setCursor((c) => shiftMonth(c.year, c.month, -1))
                }
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="settings-btn"
                onClick={() => goToday()}
              >
                <Sun className="size-3.5" />
                Today
              </button>
              <button
                type="button"
                className="topbar-btn"
                aria-label="Next month"
                onClick={() =>
                  setCursor((c) => shiftMonth(c.year, c.month, 1))
                }
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="calendar-grid" role="grid" aria-label="Month">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="calendar-weekday" role="columnheader">
                {label}
              </div>
            ))}
            {grid.map((cell) => {
              const hasNote = !!existing?.[cell.key];
              const hasReminder = !!scheduled?.[cell.key];
              const today = isTodayKey(cell.key);
              const selected = selectedKey === cell.key;
              return (
                <button
                  key={cell.key}
                  type="button"
                  role="gridcell"
                  aria-pressed={selected}
                  className={[
                    "calendar-cell",
                    cell.inMonth ? "" : "calendar-cell-outside",
                    today ? "calendar-cell-today" : "",
                    hasNote ? "calendar-cell-filled" : "",
                    hasReminder ? "calendar-cell-remind" : "",
                    selected ? "calendar-cell-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={formatDailyTitle(cell.key)}
                  onClick={() => selectDay(cell.key)}
                  onDoubleClick={() =>
                    void openDay(cell.key, existing?.[cell.key])
                  }
                >
                  <span className="calendar-cell-num">{cell.day}</span>
                  <span className="calendar-cell-marks">
                    <span
                      className={`calendar-cell-dot ${hasNote ? "calendar-cell-dot-on" : ""}`}
                    />
                    {hasReminder && (
                      <Bell className="calendar-cell-bell" aria-hidden />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedKey && (
            <div className="calendar-remind-panel">
              <div className="calendar-remind-meta">
                <p className="calendar-remind-label">Selected</p>
                <p className="calendar-remind-title">
                  {formatDailyTitle(selectedKey)}
                </p>
                {selectedReminder && (
                  <p className="calendar-remind-scheduled">
                    Reminder at{" "}
                    {new Date(selectedReminder.remindAt).toLocaleString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                )}
              </div>
              <div className="calendar-remind-actions">
                <label className="calendar-remind-time">
                  Time
                  <input
                    type="time"
                    value={remindTime}
                    onChange={(e) => setRemindTime(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="vault-btn-primary"
                  disabled={busy}
                  onClick={() => void handleSetReminder()}
                >
                  <Bell className="size-3.5" />
                  {selectedReminder ? "Update reminder" : "Set reminder"}
                </button>
                {selectedReminder && (
                  <button
                    type="button"
                    className="settings-btn settings-btn-ghost"
                    disabled={busy}
                    onClick={() => void handleCancelReminder()}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className="settings-btn"
                  disabled={busy}
                  onClick={() =>
                    void openDay(selectedKey, existing?.[selectedKey])
                  }
                >
                  Open note
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="calendar-agenda">
          <div className="calendar-agenda-head">
            <h3>This month</h3>
            <p>
              {existing === undefined
                ? "Loading…"
                : agenda.length === 0
                  ? "No daily notes yet"
                  : `${agenda.length} note${agenda.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {existing === undefined ? (
            <p className="calendar-agenda-empty">Loading days…</p>
          ) : agenda.length === 0 ? (
            <p className="calendar-agenda-empty">
              Select a day, then open its note — or set a reminder for later.
            </p>
          ) : (
            <ul className="calendar-agenda-list">
              {agenda.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`calendar-agenda-item ${
                      isTodayKey(item.key) ? "calendar-agenda-item-today" : ""
                    } ${selectedKey === item.key ? "calendar-agenda-item-selected" : ""}`}
                    onClick={() => selectDay(item.key)}
                    onDoubleClick={() => void openDay(item.key, item.id)}
                  >
                    <span className="calendar-agenda-day">
                      {item.date?.toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                      }) ?? item.key}
                      {item.reminder && (
                        <Bell className="calendar-agenda-bell" aria-hidden />
                      )}
                    </span>
                    <span className="calendar-agenda-title">{item.title}</span>
                    {item.reminder && (
                      <span className="calendar-agenda-remind-at">
                        {new Date(item.reminder.remindAt).toLocaleTimeString(
                          undefined,
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
