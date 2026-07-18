import Fuse, { type IFuseOptions } from "fuse.js";
import type { Doc } from "../../convex/_generated/dataModel";
import { blocksToSearchText, snippetAround } from "@/lib/block-search";
import { PAGE_ICON_GROUPS } from "@/lib/icons";

export type NoteSearchHit = Doc<"notes"> & {
  searchBody?: string;
  snippet?: string | null;
};

type IndexedNote = NoteSearchHit & { searchBody: string };

const NOTE_FUSE_OPTIONS: IFuseOptions<IndexedNote> = {
  keys: [
    { name: "title", weight: 0.35 },
    { name: "description", weight: 0.15 },
    { name: "tags", weight: 0.15 },
    { name: "content", weight: 0.15 },
    { name: "searchBody", weight: 0.25 },
    { name: "status", weight: 0.08 },
    { name: "icon", weight: 0.02 },
  ],
  threshold: 0.36,
  ignoreLocation: true,
  includeScore: true,
  includeMatches: true,
};

function indexNotes(notes: NoteSearchHit[]): IndexedNote[] {
  return notes.map((n) => ({
    ...n,
    searchBody: [n.content, blocksToSearchText(n.blocks), blocksToSearchText(n.folderBlocks)]
      .filter(Boolean)
      .join("\n"),
  }));
}

export function searchNotes(
  notes: NoteSearchHit[],
  query: string,
): NoteSearchHit[] {
  const q = query.trim();
  if (!q) return notes;
  const indexed = indexNotes(notes);
  const fuse = new Fuse(indexed, NOTE_FUSE_OPTIONS);
  return fuse.search(q).map((hit) => {
    const item = hit.item;
    const snip =
      snippetAround(item.searchBody, q) ||
      snippetAround(item.content || "", q) ||
      snippetAround(item.title || "", q);
    return { ...item, snippet: snip };
  });
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
