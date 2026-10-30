"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarEvent, EventTone } from "@/domain/shelf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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

const toneMeta = (tone: EventTone | undefined) =>
  TONES.find((item) => item.value === (tone ?? "normal")) ?? TONES[0]!;

const toDayKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const startOfMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const mondayBased = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayBased);
  return start;
};

export function VaultCalendar({
  events,
  onAddEvent,
  onOpenNote,
}: {
  events: readonly CalendarEvent[];
  onAddEvent: (input: {
    title: string;
    day: string;
    tone: EventTone;
  }) => void;
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

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDayKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const cells = useMemo(() => {
    const start = startOfMonthGrid(cursor.year, cursor.month);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDayKey(date.getFullYear(), date.getMonth(), date.getDate());
      return {
        key,
        date,
        inMonth: date.getMonth() === cursor.month,
        dayNumber: date.getDate(),
        isToday: key === todayKey,
      };
    });
  }, [cursor.month, cursor.year, todayKey]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.day) ?? [];
      list.push(event);
      map.set(event.day, list);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selectedDay) ?? [];
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString(
    "en",
    { month: "long", year: "numeric" },
  );

  const submit = () => {
    const title = draftTitle.trim();
    if (!title) return;
    onAddEvent({ title, day: selectedDay, tone: draftTone });
    setDraftTitle("");
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3 md:px-8">
        <div>
          <p className="text-[12px] font-medium tracking-[0.04em] text-foreground/55 uppercase">
            Calendar
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={monthLabel}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              className="font-display text-[28px] font-semibold tracking-tight text-foreground"
            >
              {monthLabel}
            </motion.h1>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setCursor((prev) => {
                const date = new Date(prev.year, prev.month - 1, 1);
                return { year: date.getFullYear(), month: date.getMonth() };
              })
            }
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const now = new Date();
              setCursor({ year: now.getFullYear(), month: now.getMonth() });
              setSelectedDay(
                toDayKey(now.getFullYear(), now.getMonth(), now.getDate()),
              );
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setCursor((prev) => {
                const date = new Date(prev.year, prev.month + 1, 1);
                return { year: date.getFullYear(), month: date.getMonth() };
              })
            }
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 px-6 pb-3 md:px-8">
        <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
          Legend
        </p>
        {TONES.map((tone) => (
          <span
            key={tone.value}
            className="inline-flex items-center gap-1.5 text-[11px] text-foreground/70"
          >
            <span className={cn("size-2 rounded-full", tone.dot)} />
            {tone.label}
          </span>
        ))}
      </div>

      <div className="grid flex-1 gap-6 overflow-y-auto px-6 pb-8 md:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)] md:px-8">
        <div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-1 py-1 text-center text-[11px] font-medium text-foreground/45"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
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
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : Math.min(index * 0.008, 0.2),
                    duration: 0.25,
                  }}
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => setSelectedDay(cell.key)}
                  className={cn(
                    "relative min-h-[78px] rounded-xl border px-1.5 py-1.5 text-left transition-colors",
                    selected
                      ? "border-primary/45 bg-accent shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
                      : "border-transparent hover:bg-muted",
                    hasUrgent && !selected && "bg-[oklch(0.97_0.02_25)] dark:bg-[oklch(0.22_0.03_25)]",
                    cell.inMonth
                      ? "text-foreground"
                      : "text-muted-foreground/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-[12px] font-medium",
                        cell.isToday &&
                          "bg-primary text-primary-foreground shadow-sm",
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
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[9px] text-foreground/55"
                      >
                        +{dayEvents.length - 2}
                      </Badge>
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <Card className="border-border bg-muted/40 shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Selected day</CardDescription>
            <CardTitle className="font-display text-xl tracking-tight text-foreground">
              {selectedDay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {selectedEvents.length === 0 ? (
                  <motion.li
                    key="empty"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[13px] text-foreground/55"
                  >
                    No events yet.
                  </motion.li>
                ) : (
                  selectedEvents.map((event) => {
                    const meta = toneMeta(event.tone);
                    return (
                      <motion.li
                        key={event.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          reduceMotion ? undefined : { opacity: 0, y: -4 }
                        }
                        className={cn(
                          "rounded-xl border px-3 py-2",
                          meta.panel,
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("size-2 shrink-0 rounded-full", meta.dot)}
                          />
                          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                            {event.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[9px] uppercase tracking-wide"
                          >
                            {meta.label}
                          </Badge>
                        </div>
                        {event.noteId ? (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto px-0 text-[11px] text-primary"
                            onClick={() => onOpenNote(event.noteId!)}
                          >
                            Open linked note
                          </Button>
                        ) : null}
                      </motion.li>
                    );
                  })
                )}
              </AnimatePresence>
            </ul>

            <Separator className="my-4 bg-border" />

            <div className="space-y-3">
              <p className="text-[12px] font-medium text-foreground/60">
                Add event
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map((tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => setDraftTone(tone.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-left transition-colors",
                      draftTone === tone.value
                        ? "border-primary/40 bg-background shadow-sm"
                        : "border-border/80 bg-card/60 hover:bg-card",
                    )}
                  >
                    <span className={cn("size-2.5 rounded-full", tone.dot)} />
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
              <Input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Event title"
                className="h-10 rounded-xl border-border bg-card"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              <Button
                type="button"
                onClick={submit}
                className="h-10 w-full rounded-xl"
              >
                <Plus data-icon="inline-start" />
                Add to calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}
