"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Link2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
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
    chip: "bg-[oklch(0.88_0.06_65)] text-[oklch(0.32_0.05_55)] dark:bg-[oklch(0.38_0.06_65)] dark:text-[oklch(0.92_0.04_75)]",
    dot: "bg-[oklch(0.68_0.12_65)]",
    panel:
      "border-[oklch(0.78_0.08_65/0.55)] bg-[oklch(0.96_0.03_75)] dark:border-[oklch(0.5_0.07_65/0.45)] dark:bg-[oklch(0.28_0.04_65)]",
  },
  {
    value: "focus",
    label: "Focus",
    hint: "Deep work",
    chip: "bg-[oklch(0.88_0.05_240)] text-[oklch(0.32_0.06_250)] dark:bg-[oklch(0.36_0.06_250)] dark:text-[oklch(0.9_0.03_240)]",
    dot: "bg-[oklch(0.58_0.12_250)]",
    panel:
      "border-[oklch(0.72_0.08_250/0.5)] bg-[oklch(0.95_0.02_240)] dark:border-[oklch(0.48_0.08_250/0.45)] dark:bg-[oklch(0.27_0.04_250)]",
  },
  {
    value: "urgent",
    label: "Urgent",
    hint: "Priority",
    chip: "bg-[oklch(0.88_0.08_25)] text-[oklch(0.38_0.12_25)] dark:bg-[oklch(0.38_0.1_25)] dark:text-[oklch(0.93_0.04_40)]",
    dot: "bg-[oklch(0.62_0.18_25)]",
    panel:
      "border-[oklch(0.72_0.12_25/0.55)] bg-[oklch(0.96_0.03_30)] dark:border-[oklch(0.52_0.12_25/0.5)] dark:bg-[oklch(0.28_0.06_25)]",
  },
  {
    value: "calm",
    label: "Calm",
    hint: "Personal",
    chip: "bg-[oklch(0.9_0.05_150)] text-[oklch(0.32_0.06_150)] dark:bg-[oklch(0.36_0.06_150)] dark:text-[oklch(0.9_0.04_145)]",
    dot: "bg-[oklch(0.58_0.12_150)]",
    panel:
      "border-[oklch(0.74_0.08_150/0.5)] bg-[oklch(0.96_0.02_150)] dark:border-[oklch(0.48_0.07_150/0.45)] dark:bg-[oklch(0.27_0.04_150)]",
  },
];

const QUICK_ADD: Array<{ title: string; tone: EventTone }> = [
  { title: "Deep work block", tone: "focus" },
  { title: "Standup", tone: "normal" },
  { title: "Ship deadline", tone: "urgent" },
  { title: "Personal buffer", tone: "calm" },
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
    weekStartsOn === "monday"
      ? (first.getDay() + 6) % 7
      : first.getDay();
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

  const weekdays =
    weekStartsOn === "sunday" ? WEEKDAYS_SUN : WEEKDAYS_MON;

  const cells = useMemo(() => {
    const start = startOfMonthGrid(cursor.year, cursor.month, weekStartsOn);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDayKey(date.getFullYear(), date.getMonth(), date.getDate());
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6;
      return {
        key,
        date,
        inMonth: date.getMonth() === cursor.month,
        dayNumber: date.getDate(),
        isToday: key === todayKey,
        isWeekend,
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
    return keys.flatMap((day) => {
      const list = (eventsByDay.get(day) ?? []).slice();
      return list.map((event) => ({ day, event }));
    });
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

  const submit = (title = draftTitle, tone = draftTone) => {
    const next = title.trim();
    if (!next) return;
    onAddEvent({ title: next, day: selectedDay, tone });
    setDraftTitle("");
  };

  const shiftSelectedDay = (delta: number) => {
    const next = addDays(selectedDay, delta);
    setSelectedDay(next);
    const date = parseDayKey(next);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 35% at 12% 0%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 55%), radial-gradient(ellipse 40% 30% at 90% 10%, color-mix(in oklch, var(--accent) 55%, transparent), transparent 60%)",
        }}
      />

      <header className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 pt-5 pb-4 md:px-8">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.18em] text-foreground/55 uppercase">
            Calendar
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={monthLabel}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              className="font-display text-[30px] font-semibold tracking-tight text-foreground md:text-[34px]"
            >
              {monthLabel}
            </motion.h1>
          </AnimatePresence>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full font-mono text-[10px]"
            >
              <CalendarDays className="size-3" />
              {monthStats.total} this month
            </Badge>
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
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  toneFilter === tone.value
                    ? "border-primary/40 bg-accent text-accent-foreground"
                    : "border-border bg-card/70 text-foreground/70 hover:bg-muted",
                )}
              >
                <span className={cn("size-2 rounded-full", tone.dot)} />
                {tone.label}
                <span className="font-mono text-[10px] text-foreground/45">
                  {monthStats.counts[tone.value]}
                </span>
              </button>
            ))}
            {toneFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setToneFilter("all")}
                className="text-[11px] text-foreground/50 underline-offset-2 hover:underline"
              >
                Clear filter
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => goMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full px-3"
            onClick={jumpToday}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => goMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <ScrollPane className="relative z-10 px-6 py-6 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[22px] border border-border bg-card/80 shadow-sm">
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="px-1 py-2.5 text-center font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border/60 p-px">
                {cells.map((cell, index) => {
                  const dayEvents = eventsByDay.get(cell.key) ?? [];
                  const selected = cell.key === selectedDay;
                  const hasUrgent = dayEvents.some(
                    (event) => event.tone === "urgent",
                  );
                  return (
                    <motion.button
                      key={cell.key}
                      type="button"
                      initial={
                        reduceMotion ? false : { opacity: 0, scale: 0.97 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: reduceMotion ? 0 : Math.min(index * 0.006, 0.18),
                        duration: 0.22,
                      }}
                      whileHover={reduceMotion ? undefined : { y: -1 }}
                      onClick={() => setSelectedDay(cell.key)}
                      className={cn(
                        "relative min-h-[92px] bg-card px-1.5 py-1.5 text-left transition-colors",
                        selected &&
                          "z-[1] bg-accent ring-1 ring-primary/35 ring-inset",
                        !selected && hasUrgent && "bg-[oklch(0.985_0.015_25)] dark:bg-[oklch(0.22_0.03_25)]",
                        !selected &&
                          cell.isWeekend &&
                          cell.inMonth &&
                          "bg-muted/25",
                        !selected && "hover:bg-muted/50",
                        cell.inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/35",
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full text-[12px] font-medium",
                            cell.isToday &&
                              "bg-primary text-primary-foreground shadow-sm",
                            selected &&
                              !cell.isToday &&
                              "bg-foreground text-background",
                          )}
                        >
                          {cell.dayNumber}
                        </span>
                        {dayEvents.length > 0 ? (
                          <span className="flex items-center gap-0.5">
                            {[...new Set(dayEvents.map((event) => event.tone))]
                              .slice(0, 3)
                              .map((tone) => (
                                <span
                                  key={tone}
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    toneMeta(tone).dot,
                                  )}
                                />
                              ))}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <p
                            key={event.id}
                            className={cn(
                              "truncate rounded-md px-1 py-0.5 text-[10px] font-medium",
                              toneMeta(event.tone).chip,
                            )}
                          >
                            {event.title}
                          </p>
                        ))}
                        {dayEvents.length > 2 ? (
                          <p className="px-1 font-mono text-[9px] text-foreground/45">
                            +{dayEvents.length - 2} more
                          </p>
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[20px] border border-border bg-card/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-foreground/45 uppercase">
                    Next 7 days
                  </p>
                  <p className="font-display text-lg tracking-tight text-foreground">
                    Upcoming
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full font-mono text-[10px]">
                  {upcoming.length}
                </Badge>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-[13px] text-foreground/55">
                  Quiet week ahead — add a focus block or personal buffer.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {upcoming.slice(0, 8).map(({ day, event }) => {
                    const meta = toneMeta(event.tone);
                    return (
                      <li
                        key={`${day}-${event.id}`}
                        className="flex items-center gap-2 rounded-[12px] border border-border/80 bg-background/70 px-2.5 py-2"
                      >
                        <span
                          className={cn("size-2 shrink-0 rounded-full", meta.dot)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDay(day);
                            const date = parseDayKey(day);
                            setCursor({
                              year: date.getFullYear(),
                              month: date.getMonth(),
                            });
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {event.title}
                          </p>
                          <p className="font-mono text-[10px] text-foreground/45">
                            {formatDayLabel(day, todayKey)} · {meta.label}
                          </p>
                        </button>
                        {event.noteId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            onClick={() => onOpenNote(event.noteId!)}
                            aria-label="Open linked note"
                          >
                            <Link2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="overflow-hidden rounded-[22px] border border-border bg-muted/35 shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.16em] text-foreground/45 uppercase">
                      Selected day
                    </p>
                    <h2 className="mt-1 font-display text-2xl tracking-tight text-foreground">
                      {formatDayLabel(selectedDay, todayKey)}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] text-foreground/50">
                      {selectedDay}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() => shiftSelectedDay(-1)}
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() => shiftSelectedDay(1)}
                      aria-label="Next day"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-4">
                <ul className="space-y-2">
                  <AnimatePresence initial={false} mode="popLayout">
                    {selectedEvents.length === 0 ? (
                      <motion.li
                        key="empty"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-[14px] border border-dashed border-border bg-background/50 px-3 py-6 text-center text-[13px] text-foreground/55"
                      >
                        No events yet — pick a tone and add one below.
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
                                : { opacity: 0, y: -4 }
                            }
                            className={cn(
                              "rounded-[14px] border px-3 py-2.5",
                              meta.panel,
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={cn(
                                  "mt-1.5 size-2 shrink-0 rounded-full",
                                  meta.dot,
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium text-foreground">
                                  {event.title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full text-[9px] uppercase tracking-wide"
                                  >
                                    {meta.label}
                                  </Badge>
                                  {event.noteId ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenNote(event.noteId!)
                                      }
                                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                    >
                                      <Link2 className="size-3" />
                                      Open note
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              {onDeleteEvent ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="shrink-0"
                                  onClick={() => onDeleteEvent(event.id)}
                                  aria-label={`Delete ${event.title}`}
                                >
                                  <Trash2 className="size-3.5 text-destructive" />
                                </Button>
                              ) : null}
                            </div>
                          </motion.li>
                        );
                      })
                    )}
                  </AnimatePresence>
                </ul>

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-foreground/45" />
                    <p className="text-[12px] font-medium text-foreground/65">
                      Add event
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {TONES.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => setDraftTone(tone.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-[12px] border px-2.5 py-2 text-left transition-colors",
                          draftTone === tone.value
                            ? "border-primary/40 bg-background shadow-sm"
                            : "border-border/80 bg-card/60 hover:bg-card",
                        )}
                      >
                        <span
                          className={cn("size-2.5 rounded-full", tone.dot)}
                        />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-medium text-foreground">
                            {tone.label}
                          </span>
                          <span className="block text-[10px] text-foreground/50">
                            {tone.hint}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ADD.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => submit(item.title, item.tone)}
                        className="rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-foreground/65 transition-colors hover:border-primary/35 hover:bg-background hover:text-foreground"
                      >
                        + {item.title}
                      </button>
                    ))}
                  </div>

                  <Input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Event title"
                    className="h-10 rounded-xl border-border bg-background"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => submit()}
                    className="h-10 w-full rounded-xl"
                  >
                    <Plus data-icon="inline-start" />
                    Add to {formatDayLabel(selectedDay, todayKey).toLowerCase()}
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
