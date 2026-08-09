import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";

export type DueTaskHit = {
  noteId: Id<"notes">;
  noteTitle: string;
  noteIcon: string;
  blockId: string;
  text: string;
  dueAt: number;
  overdue: boolean;
  isToday: boolean;
  upcoming: boolean;
};

export type DueBucket = "overdue" | "today" | "upcoming" | "later";

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function endOfLocalDay(d = new Date()) {
  return startOfLocalDay(d) + 24 * 60 * 60 * 1000 - 1;
}

export function dueBucket(dueAt: number, now = Date.now()): DueBucket {
  const start = startOfLocalDay(new Date(now));
  const end = endOfLocalDay(new Date(now));
  if (dueAt < start) return "overdue";
  if (dueAt <= end) return "today";
  const week = start + 7 * 24 * 60 * 60 * 1000;
  if (dueAt < week) return "upcoming";
  return "later";
}

/** Collect open todos with due dates from active notes (incl. folderBlocks). */
export function collectDueTasks(
  notes: Doc<"notes">[] | undefined,
  now = Date.now(),
  opts?: { includeLater?: boolean },
): DueTaskHit[] {
  if (!notes) return [];
  const includeLater = opts?.includeLater ?? true;
  const hits: DueTaskHit[] = [];

  for (const note of notes) {
    if (note.trashed || note.archived) continue;
    const scan = isFolder(note)
      ? (note.folderBlocks ?? [])
      : [...(note.blocks ?? []), ...(note.folderBlocks ?? [])];

    for (const block of scan) {
      if (block.type !== "todo" || block.checked || block.dueAt === undefined) continue;
      const bucket = dueBucket(block.dueAt, now);
      if (!includeLater && bucket === "later") continue;
      hits.push({
        noteId: note._id,
        noteTitle: note.title || "Untitled",
        noteIcon: note.icon || "📝",
        blockId: block.id,
        text: block.text.trim() || "Untitled task",
        dueAt: block.dueAt,
        overdue: bucket === "overdue",
        isToday: bucket === "today",
        upcoming: bucket === "upcoming" || bucket === "later",
      });
    }
  }

  return hits.sort((a, b) => a.dueAt - b.dueAt);
}

export function groupDueTasks(hits: DueTaskHit[], now = Date.now()) {
  const groups: Record<DueBucket, DueTaskHit[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    later: [],
  };
  for (const hit of hits) {
    groups[dueBucket(hit.dueAt, now)].push(hit);
  }
  return groups;
}

export function formatDueLabel(dueAt: number, now = Date.now()) {
  const bucket = dueBucket(dueAt, now);
  if (bucket === "overdue") return "Overdue";
  if (bucket === "today") return "Today";
  return new Date(dueAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
