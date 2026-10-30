"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  Check,
  Copy,
  FileText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Note } from "@/domain/note";
import type { CalendarEvent, EventTone } from "@/domain/shelf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";

const TONE_ORDER: Record<EventTone, number> = {
  urgent: 0,
  focus: 1,
  normal: 2,
  calm: 3,
};

const TONE_META: Record<
  EventTone,
  { label: string; chip: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    chip: "bg-[oklch(0.88_0.08_25)] text-[oklch(0.38_0.12_25)] dark:bg-[oklch(0.38_0.1_25)] dark:text-[oklch(0.93_0.04_40)]",
    dot: "bg-[oklch(0.62_0.18_25)]",
  },
  focus: {
    label: "Focus",
    chip: "bg-[oklch(0.88_0.05_240)] text-[oklch(0.32_0.06_250)] dark:bg-[oklch(0.36_0.06_250)] dark:text-[oklch(0.9_0.03_240)]",
    dot: "bg-[oklch(0.58_0.12_250)]",
  },
  normal: {
    label: "Normal",
    chip: "bg-[oklch(0.88_0.06_65)] text-[oklch(0.32_0.05_55)] dark:bg-[oklch(0.38_0.06_65)] dark:text-[oklch(0.92_0.04_75)]",
    dot: "bg-[oklch(0.68_0.12_65)]",
  },
  calm: {
    label: "Calm",
    chip: "bg-[oklch(0.9_0.05_150)] text-[oklch(0.32_0.06_150)] dark:bg-[oklch(0.36_0.06_150)] dark:text-[oklch(0.9_0.04_145)]",
    dot: "bg-[oklch(0.58_0.12_150)]",
  },
};

type BriefItem =
  | {
      kind: "event";
      id: string;
      title: string;
      tone: EventTone;
      noteId: string | null;
    }
  | {
      kind: "page";
      id: string;
      noteId: string;
      title: string;
      activity: "created" | "updated";
    }
  | {
      kind: "trash";
      id: string;
      title: string;
    };

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayBounds(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const start = new Date(y!, m! - 1, d!, 0, 0, 0, 0).getTime();
  const end = new Date(y!, m! - 1, d!, 23, 59, 59, 999).getTime();
  return { start, end };
}

function buildBrief(
  day: string,
  events: readonly CalendarEvent[],
  notes: readonly Note[],
): BriefItem[] {
  const { start, end } = dayBounds(day);
  const items: BriefItem[] = [];

  const dayEvents = events
    .filter((event) => event.day === day)
    .slice()
    .sort(
      (a, b) =>
        TONE_ORDER[a.tone] - TONE_ORDER[b.tone] ||
        a.title.localeCompare(b.title),
    );

  for (const event of dayEvents) {
    items.push({
      kind: "event",
      id: `event-${event.id}`,
      title: event.title,
      tone: event.tone,
      noteId: event.noteId,
    });
  }

  for (const note of notes) {
    if (note.deletedAt != null && note.deletedAt >= start && note.deletedAt <= end) {
      items.push({
        kind: "trash",
        id: `trash-${note.id}`,
        title: note.title,
      });
      continue;
    }
    if (note.deletedAt != null) continue;

    if (note.createdAt >= start && note.createdAt <= end) {
      items.push({
        kind: "page",
        id: `created-${note.id}`,
        noteId: note.id,
        title: note.title,
        activity: "created",
      });
    } else if (note.updatedAt >= start && note.updatedAt <= end) {
      items.push({
        kind: "page",
        id: `updated-${note.id}`,
        noteId: note.id,
        title: note.title,
        activity: "updated",
      });
    }
  }

  return items;
}

function formatBriefText(day: string, items: readonly BriefItem[]) {
  if (items.length === 0) {
    return `# ${day}\n\nNothing notable for this day.`;
  }

  const lines = [`# ${day}`, ""];
  for (const item of items) {
    if (item.kind === "event") {
      lines.push(`- [event · ${item.tone}] ${item.title}`);
    } else if (item.kind === "page") {
      lines.push(`- [page · ${item.activity}] ${item.title}`);
    } else {
      lines.push(`- [trash] ${item.title}`);
    }
  }
  return lines.join("\n");
}

export function DayBriefWidget({
  events,
  notes,
  onOpenNote,
}: {
  events: readonly CalendarEvent[];
  notes: readonly Note[];
  onOpenNote: (noteId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const today = useMemo(() => toDayKey(new Date()), []);
  const [day, setDay] = useState(today);
  const [items, setItems] = useState<BriefItem[] | null>(null);
  const [copied, setCopied] = useState(false);

  const reveal = (nextDay = day) => {
    const safe = /^\d{4}-\d{2}-\d{2}$/.test(nextDay) ? nextDay : today;
    setDay(safe);
    setItems(buildBrief(safe, events, notes));
  };

  const copyBrief = async () => {
    if (!items) return;
    try {
      await navigator.clipboard.writeText(formatBriefText(day, items));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const urgentCount =
    items?.filter((item) => item.kind === "event" && item.tone === "urgent")
      .length ?? 0;

  return (
    <LabWidgetFrame
      icon={CalendarDays}
      title="Day brief"
      subtitle="calendar · pages · trash"
      badge={items ? `${items.length} items` : "idle"}
      iconClassName="bg-[oklch(0.9_0.05_45)] text-[oklch(0.38_0.09_45)] dark:bg-[oklch(0.34_0.05_45)] dark:text-[oklch(0.9_0.04_55)]"
      preview={
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
          <AnimatePresence mode="wait" initial={false}>
            {items == null ? (
              <motion.div
                key="idle"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-[14px] border border-dashed border-border bg-muted/40 text-foreground/50">
                  <Sparkles className="size-5" />
                </span>
                <p className="max-w-xs text-[13px] text-foreground/55">
                  Pick a day, then hit Reveal — urgent calendar items first,
                  then pages touched and trash from that date.
                </p>
              </motion.div>
            ) : items.length === 0 ? (
              <motion.p
                key="empty"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="m-auto px-4 text-center text-[13px] text-foreground/55"
              >
                Quiet day — no calendar events, page edits, or trash for{" "}
                <span className="font-mono text-foreground/70">{day}</span>.
              </motion.p>
            ) : (
              <motion.ul
                key={day}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1.5"
              >
                {items.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.03 }}
                    className="flex items-start gap-2.5 rounded-[10px] border border-border bg-background/80 px-3 py-2.5"
                  >
                    {item.kind === "event" ? (
                      <>
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            TONE_META[item.tone].dot,
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {item.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "rounded-full text-[9px] uppercase tracking-wide",
                                TONE_META[item.tone].chip,
                              )}
                            >
                              {TONE_META[item.tone].label}
                            </Badge>
                            {item.noteId ? (
                              <button
                                type="button"
                                onClick={() => onOpenNote(item.noteId!)}
                                className="text-[11px] text-primary hover:underline"
                              >
                                Open note
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </>
                    ) : item.kind === "page" ? (
                      <>
                        <FileText className="mt-0.5 size-3.5 shrink-0 text-foreground/45" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] tracking-wide text-foreground/45 uppercase">
                            page · {item.activity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenNote(item.noteId)}
                          className="shrink-0 text-[11px] text-primary hover:underline"
                        >
                          Open
                        </button>
                      </>
                    ) : (
                      <>
                        <Trash2 className="mt-0.5 size-3.5 shrink-0 text-foreground/45" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] tracking-wide text-foreground/45 uppercase">
                            moved to trash
                          </p>
                        </div>
                      </>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      }
      controls={
        <>
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Day controls
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Pull what matters for one calendar day from this workspace —
              events, edited pages, and trash.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-foreground/60">Day</span>
            <Input
              type="date"
              value={day}
              onChange={(event) => setDay(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setDay(today);
                reveal(today);
              }}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground/70 transition-colors hover:bg-muted",
                day === today &&
                  "border-primary/40 bg-accent text-accent-foreground",
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                const key = toDayKey(d);
                setDay(key);
                reveal(key);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground/70 transition-colors hover:bg-muted"
            >
              Tomorrow
            </button>
          </div>

          {items != null ? (
            <p className="font-mono text-[11px] text-foreground/45">
              {items.length} item{items.length === 1 ? "" : "s"}
              {urgentCount > 0 ? ` · ${urgentCount} urgent` : ""}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => reveal(day)}
            >
              <Sparkles data-icon="inline-start" />
              Reveal day
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!items}
              onClick={() => void copyBrief()}
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </>
      }
    />
  );
}
