import Fuse, { type IFuseOptions } from "fuse.js";
import type { Doc } from "../../convex/_generated/dataModel";
import { PAGE_ICON_GROUPS } from "@/lib/icons";

export type NoteSearchHit = Doc<"notes">;

const NOTE_FUSE_OPTIONS: IFuseOptions<NoteSearchHit> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "tags", weight: 0.2 },
    { name: "content", weight: 0.15 },
    { name: "icon", weight: 0.05 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  includeScore: true,
};

export function searchNotes(
  notes: NoteSearchHit[],
  query: string,
): NoteSearchHit[] {
  const q = query.trim();
  if (!q) return notes;
  const fuse = new Fuse(notes, NOTE_FUSE_OPTIONS);
  return fuse.search(q).map((hit) => hit.item);
}

export type IconSearchItem = {
  icon: string;
  groupId: string;
  groupLabel: string;
};

const ICON_INDEX: IconSearchItem[] = PAGE_ICON_GROUPS.flatMap((g) =>
  g.icons.map((icon) => ({
    icon,
    groupId: g.id,
    groupLabel: g.label,
  })),
);

const ICON_FUSE = new Fuse(ICON_INDEX, {
  keys: [
    { name: "groupLabel", weight: 0.45 },
    { name: "groupId", weight: 0.35 },
    { name: "icon", weight: 0.2 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
});

export type IconGroupResult = {
  id: string;
  label: string;
  icons: string[];
};

export function searchIcons(query: string): IconGroupResult[] {
  const q = query.trim();
  if (!q) {
    return PAGE_ICON_GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      icons: [...g.icons],
    }));
  }

  const hits = ICON_FUSE.search(q);
  const byGroup = new Map<string, IconGroupResult>();

  for (const hit of hits) {
    const { groupId, groupLabel, icon } = hit.item;
    let group = byGroup.get(groupId);
    if (!group) {
      group = { id: groupId, label: groupLabel, icons: [] };
      byGroup.set(groupId, group);
    }
    if (!group.icons.includes(icon)) group.icons.push(icon);
  }

  return [...byGroup.values()];
}

export function searchIconsFlat(query: string): IconSearchItem[] {
  const q = query.trim();
  if (!q) return ICON_INDEX;
  return ICON_FUSE.search(q).map((hit) => hit.item);
}
