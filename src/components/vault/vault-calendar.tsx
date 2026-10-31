"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent, EventTone } from "@/domain/shelf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollPane } from "./scroll-to-top";
import { cn } from "cn";

const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WEEKDAYS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const TONES: Array<{
  value: EventTone;
  label: string;
  hint: string;
  chip: string;
  dot: string;
  panel: string;
}> = [
  {
    value: "normal",
    label: "Normal",
    hint: "Everyday",
    chip: "bg-[oklch(0.9_0.04_70)] text-[oklch(0.35_0.05_55)] dark:bg-[oklch(0.34_0.05_60)] dark:text-[oklch(0.92_0.03_80)]",
    dot: "bg-[oklch(0.68_0.11_65)]",
    panel:
      "border-border/80 bg-[oklch(0.97_0.02_80)] dark:bg-[oklch(0.24_0.025_55)]",
  },
  {
    value: "focus",
    label: "Focus",
    hint: "Deep work",
    chip: "bg-[oklch(0.9_0.03_240)] text-[oklch(0.35_0.05_250)] dark:bg-[oklch(0.32_0.05_245)] dark:text-[oklch(0.9_0.03_240)]",
    dot: "bg-[oklch(0.58_0.11_250)]",
    panel:
      "border-border/80 bg-[oklch(0.96_0.015_240)] dark:bg-[oklch(0.24_0.03_250)]",
  },
  {
    value: "urgent",
    label: "Urgent",
    hint: "Priority",
    chip: "bg-[oklch(0.91_0.05_30)] text-[oklch(0.4_0.1_28)] dark:bg-[oklch(0.34_0.07_28)] dark:text-[oklch(0.93_0.03_40)]",
    dot: "bg-[oklch(0.62_0.16_28)]",
    panel:
      "border-[oklch(0.78_0.08_28/0.45)] bg-[oklch(0.97_0.02_30)] dark:bg-[oklch(0.25_0.04_28)]",
  },
  {
    value: "calm",
    label: "Calm",
    hint: "Personal",
    chip: "bg-[oklch(0.92_0.03_150)] text-[oklch(0.35_0.05_150)] dark:bg-[oklch(0.32_0.04_150)] dark:text-[oklch(0.9_0.03_145)]",
    dot: "bg-[oklch(0.58_0.1_150)]",
    panel:
      "border-border/80 bg-[oklch(0.97_0.015_150)] dark:bg-[oklch(0.24_0.03_150)]",
  },
];

const QUICK_ADD: Array<{ title: string; tone: EventTone }> = [
  { title: "Deep work", tone: "focus" },
  { title: "Standup", tone: "normal" },
  { title: "Deadline", tone: "urgent" },
  { title: "Buffer", tone: "calm" },
];

const toneMeta = (tone: EventTone | undefined) =>
  TONES.find((item) => item.value === (tone ?? "normal")) ?? TONES[0]!;

const toDayKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const parseDayKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const startOfMonthGrid = (
  year: number,
  month: number,
  weekStartsOn: "monday" | "sunday",
) => {
  const first = new Date(year, month, 1);
  const offset =
    weekStartsOn === "monday" ? (first.getDay() + 6) % 7 : first.getDay();
  return new Date(year, month, 1 - offset);
};

const addDays = (key: string, delta: number) => {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + delta);
  return toDayKey(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatDayLabel = (key: string, todayKey: string) => {
  if (key === todayKey) return "Today";
  if (key === addDays(todayKey, 1)) return "Tomorrow";
  if (key === addDays(todayKey, -1)) return "Yesterday";
  return parseDayKey(key).toLocaleDateString("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const TONE_ORDER: Record<EventTone, number> = {
  urgent: 0,
  focus: 1,
  normal: 2,
  calm: 3,
};

export function VaultCalendar({
  events,
  weekStartsOn = "monday",
  onAddEvent,
  onDeleteEvent,
  onOpenNote,
}: {
  events: readonly CalendarEvent[];
  weekStartsOn?: "monday" | "sunday";
  onAddEvent: (input: {
    title: string;
    day: string;
    tone: EventTone;
  }) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenNote: (noteId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date();
    return toDayKey(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTone, setDraftTone] = useState<EventTone>("normal");
  const [toneFilter, setToneFilter] = useState<EventTone | "all">("all");

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDayKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const weekdays = weekStartsOn === "sunday" ? WEEKDAYS_SUN : WEEKDAYS_MON;

  const cells = useMemo(() => {
    const start = startOfMonthGrid(cursor.year, cursor.month, weekStartsOn);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDayKey(date.getFullYear(), date.getMonth(), date.getDate());
      const day = date.getDay();
      return {
        key,
        date,
        inMonth: date.getMonth() === cursor.month,
        dayNumber: date.getDate(),
        isToday: key === todayKey,
        isWeekend: day === 0 || day === 6,
      };
    });
  }, [cursor.month, cursor.year, todayKey, weekStartsOn]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      if (toneFilter !== "all" && event.tone !== toneFilter) continue;
      const list = map.get(event.day) ?? [];
      list.push(event);
      map.set(event.day, list);
    }
    for (const [key, list] of map) {
      list.sort(
        (a, b) =>
          TONE_ORDER[a.tone] - TONE_ORDER[b.tone] ||
          a.title.localeCompare(b.title),
      );
      map.set(key, list);
    }
    return map;
  }, [events, toneFilter]);

  const selectedEvents = eventsByDay.get(selectedDay) ?? [];

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString(
    "en",
    { month: "long", year: "numeric" },
  );

  const monthStats = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    const counts: Record<EventTone, number> = {
      normal: 0,
      focus: 0,
      urgent: 0,
      calm: 0,
    };
    let total = 0;
    for (const event of events) {
      if (!event.day.startsWith(prefix)) continue;
      counts[event.tone] += 1;
      total += 1;
    }
    return { total, counts };
  }, [cursor.month, cursor.year, events]);

  const upcoming = useMemo(() => {
    const keys = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i));
    return keys.flatMap((day) =>
      (eventsByDay.get(day) ?? []).map((event) => ({ day, event })),
    );
  }, [eventsByDay, todayKey]);

  const goMonth = (delta: number) => {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const jumpToday = () => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(toDayKey(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const focusComposer = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("vault-calendar-composer")?.focus();
    });
  };

  const selectDay = (key: string, openComposer = false) => {
    setSelectedDay(key);
    const date = parseDayKey(key);
    if (
      date.getMonth() !== cursor.month ||
      date.getFullYear() !== cursor.year
    ) {
      setCursor({ year: date.getFullYear(), month: date.getMonth() });
    }
    if (openComposer) focusComposer();
  };

  const submit = (title = draftTitle, tone = draftTone) => {
    const next = title.trim();
    if (!next) {
      focusComposer();
      return;
    }
    onAddEvent({ title: next, day: selectedDay, tone });
    setDraftTitle("");
    focusComposer();
  };

  const shiftSelectedDay = (delta: number) => {
    selectDay(addDays(selectedDay, delta));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectDay(addDays(selectedDay, -1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        selectDay(addDays(selectedDay, 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectDay(addDays(selectedDay, -7));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        selectDay(addDays(selectedDay, 7));
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        jumpToday();
      } else if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        focusComposer();
      } else if (event.key === "Escape" && toneFilter !== "all") {
        setToneFilter("all");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDay, toneFilter]);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 48% 32% at 8% -4%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 58%), radial-gradient(ellipse 36% 28% at 96% 8%, color-mix(in oklch, var(--accent) 40%, transparent), transparent 62%)",
        }}
      />

      <header className="relative z-10 border-b border-border px-5 pt-5 pb-4 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Schedule
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={monthLabel}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  className="font-display text-[2rem] leading-none font-semibold tracking-tight text-foreground md:text-[2.35rem]"
                >
                  {monthLabel}
                </motion.h1>
              </AnimatePresence>
              <Badge
                variant="secondary"
                className="rounded-md font-mono text-[10px]"
              >
                <CalendarDays className="size-3" />
                {monthStats.total}
              </Badge>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Pick a day, add a block. Arrow keys move ·{" "}
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">
                N
              </kbd>{" "}
              new ·{" "}
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">
                T
              </kbd>{" "}
              today
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-8 rounded-md"
              onClick={() => goMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-md px-3"
              onClick={jumpToday}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-8 rounded-md"
              onClick={() => goMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setToneFilter("all")}
            className={cn(
              "inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium transition-colors",
              toneFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            All
          </button>
          {TONES.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() =>
                setToneFilter((prev) =>
                  prev === tone.value ? "all" : tone.value,
                )
              }
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                toneFilter === tone.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", tone.dot)} />
              {tone.label}
              <span className="text-[10px] opacity-60">
                {monthStats.counts[tone.value]}
              </span>
            </button>
          ))}
        </div>
      </header>

      <ScrollPane className="relative z-10 px-5 py-5 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.78fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm">
              <div className="mb-2 grid grid-cols-7">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="h-8 text-center text-[0.8rem] font-normal text-muted-foreground"
                  >
                    {day.slice(0, 2)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell) => {
                  const dayEvents = eventsByDay.get(cell.key) ?? [];
                  const selected = cell.key === selectedDay;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => selectDay(cell.key)}
                      onDoubleClick={() => selectDay(cell.key, true)}
                      className={cn(
                        "group relative flex min-h-[5.5rem] flex-col rounded-md p-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground",
                        !cell.inMonth && "opacity-45",
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-md text-[0.8rem] font-normal tabular-nums",
                            cell.isToday &&
                              !selected &&
                              "bg-primary text-primary-foreground",
                            selected &&
                              cell.isToday &&
                              "bg-primary text-primary-foreground",
                            selected &&
                              !cell.isToday &&
                              "bg-foreground text-background",
                            !selected &&
                              !cell.isToday &&
                              "text-foreground group-hover:text-accent-foreground",
                            !cell.inMonth && !selected && "text-muted-foreground",
                          )}
                        >
                          {cell.dayNumber}
                        </span>
                        {dayEvents.length > 0 ? (
                          <span className="text-[10px] text-muted-foreground tabular-nums group-hover:text-accent-foreground/70">
                            {dayEvents.length}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <p
                            key={event.id}
                            className={cn(
                              "truncate rounded-sm px-1 py-0.5 text-[10px] leading-tight font-medium",
                              selected
                                ? "bg-background/70 text-foreground"
                                : toneMeta(event.tone).chip,
                            )}
                          >
                            {event.title}
                          </p>
                        ))}
                        {dayEvents.length > 3 ? (
                          <p className="px-1 text-[10px] text-muted-foreground">
                            +{dayEvents.length - 3}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium leading-none">
                    Next 7 days
                  </h2>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Upcoming from today
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-md text-[10px]">
                  {upcoming.length}
                </Badge>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Open week — double-click a day to start an event.
                </p>
              ) : (
                <ul className="space-y-1">
                  {upcoming.slice(0, 7).map(({ day, event }) => {
                    const meta = toneMeta(event.tone);
                    return (
                      <li key={`${day}-${event.id}`}>
                        <button
                          type="button"
                          onClick={() => selectDay(day)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              meta.dot,
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {event.title}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatDayLabel(day, todayKey)} · {meta.label}
                            </span>
                          </span>
                          {event.noteId ? (
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenNote(event.noteId!);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenNote(event.noteId!);
                                }
                              }}
                              aria-label="Open linked note"
                            >
                              <Link2 className="size-3.5" />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-3 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex items-start justify-between gap-2 border-b border-border p-4">
                <div>
                  <h2 className="text-base font-semibold leading-none tracking-tight">
                    {formatDayLabel(selectedDay, todayKey)}
                  </h2>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {selectedDay} · {selectedEvents.length} event
                    {selectedEvents.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="size-8 rounded-md"
                    onClick={() => shiftSelectedDay(-1)}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="size-8 rounded-md"
                    onClick={() => shiftSelectedDay(1)}
                    aria-label="Next day"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3">
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {selectedEvents.length === 0 ? (
                      <motion.li
                        key="empty"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-md border border-dashed border-border px-3 py-8 text-center"
                      >
                        <p className="text-sm text-muted-foreground">
                          Nothing scheduled.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 h-8 rounded-md"
                          onClick={focusComposer}
                        >
                          <Plus data-icon="inline-start" />
                          Add event
                        </Button>
                      </motion.li>
                    ) : (
                      selectedEvents.map((event) => {
                        const meta = toneMeta(event.tone);
                        return (
                          <motion.li
                            key={event.id}
                            layout
                            initial={
                              reduceMotion ? false : { opacity: 0, y: 6 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                              reduceMotion
                                ? undefined
                                : { opacity: 0, scale: 0.98 }
                            }
                            className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2.5"
                          >
                            <span
                              className={cn(
                                "mt-1.5 size-2 shrink-0 rounded-full",
                                meta.dot,
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {event.title}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="rounded-md px-1.5 py-0 text-[10px]"
                                >
                                  {meta.label}
                                </Badge>
                                {event.noteId ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenNote(event.noteId!)}
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    <Link2 className="size-3" />
                                    Note
                                  </button>
                                ) : null}
                              </div>
                            </div>
                            {onDeleteEvent ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 rounded-md"
                                onClick={() => onDeleteEvent(event.id)}
                                aria-label={`Delete ${event.title}`}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            ) : null}
                          </motion.li>
                        );
                      })
                    )}
                  </AnimatePresence>
                </ul>
              </div>

              <div className="space-y-3 border-t border-border p-4">
                <div>
                  <p className="text-sm font-medium">New event</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a tone, then add a title.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TONES.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setDraftTone(tone.value)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
                        draftTone === tone.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          draftTone === tone.value
                            ? "bg-primary-foreground"
                            : tone.dot,
                        )}
                      />
                      {tone.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_ADD.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => submit(item.title, item.tone)}
                      className="inline-flex h-7 items-center rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      + {item.title}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="vault-calendar-composer"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="What’s happening?"
                    className="h-9 flex-1 rounded-md"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="size-9 shrink-0 rounded-md"
                    onClick={() => submit()}
                    aria-label="Add event"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </ScrollPane>
    </motion.section>
  );
}
