import type { Doc, Id } from "../convex/_generated/dataModel";
import { createBlock, type Block } from "../src/lib/blocks";

export const ownerId = "owner_storybook";

export function noteId(n = 1): Id<"notes"> {
  return `notes_storybook_${n}` as Id<"notes">;
}

export function sampleBlocks(): Block[] {
  return [
    createBlock("heading1", "Welcome to NoteVault"),
    createBlock("paragraph", "A short paragraph with some context for the story."),
    createBlock("heading2", "Checklist"),
    { ...createBlock("todo", "Ship Storybook coverage", { checked: true }), pinned: true },
    createBlock("todo", "Polish theme presets", { checked: false }),
    createBlock("bullet", "Copper ink default"),
    createBlock("bullet", "Harbor / Olive / Stone themes"),
    createBlock("heading3", "Details"),
    createBlock("callout", "Tip: use the Theme toolbar to preview presets."),
    createBlock("code", "const accent = '#e2a45a';", { language: "ts" }),
  ];
}

export function sampleNote(overrides: Partial<Doc<"notes">> = {}): Doc<"notes"> {
  const now = Date.now();
  return {
    _id: noteId(1),
    _creationTime: now - 86_400_000,
    ownerId,
    title: "Storybook notes",
    content: "",
    blocks: sampleBlocks(),
    icon: "📚",
    coverColor: "from-amber-500/40 to-orange-700/25",
    parentId: undefined,
    sortOrder: 0,
    kind: "page",
    pinned: true,
    archived: false,
    trashed: false,
    tags: ["storybook", "design"],
    updatedAt: now,
    ...overrides,
  };
}

export function sampleFolder(overrides: Partial<Doc<"notes">> = {}): Doc<"notes"> {
  return sampleNote({
    _id: noteId(10),
    title: "Projects",
    icon: "📁",
    kind: "folder",
    blocks: [],
    folderBlocks: [createBlock("paragraph", "Collection description")],
    pinned: false,
    tags: ["work"],
    ...overrides,
  });
}

export function sampleNotes(): Doc<"notes">[] {
  const folder = sampleFolder();
  return [
    folder,
    sampleNote({
      _id: noteId(1),
      title: "Storybook coverage",
      parentId: folder._id,
      pinned: true,
    }),
    sampleNote({
      _id: noteId(2),
      title: "Copper ink theme",
      icon: "🎨",
      parentId: folder._id,
      pinned: false,
      tags: ["design"],
      coverColor: undefined,
    }),
    sampleNote({
      _id: noteId(3),
      title: "Daily — 2026-08-09",
      icon: "☀️",
      dailyKey: "2026-08-09",
      parentId: undefined,
      pinned: false,
      tags: ["daily"],
      blocks: [
        createBlock("todo", "Write stories", { checked: true }),
        createBlock("todo", "Review a11y", { checked: false }),
      ],
    }),
    sampleNote({
      _id: noteId(4),
      title: "Archived draft",
      icon: "🗄️",
      archived: true,
      pinned: false,
      tags: [],
    }),
  ];
}

export const sampleSlashCommands = [
  {
    type: "paragraph" as const,
    label: "Text",
    description: "Plain paragraph",
    icon: "¶",
    keywords: ["text"],
  },
  {
    type: "heading1" as const,
    label: "Heading 1",
    description: "Large section title",
    icon: "H1",
    keywords: ["h1"],
  },
  {
    type: "todo" as const,
    label: "To-do",
    description: "Checkbox item",
    icon: "☑",
    keywords: ["todo"],
  },
  {
    type: "callout" as const,
    label: "Callout",
    description: "Highlighted tip",
    icon: "💡",
    keywords: ["callout"],
  },
];

export const breadcrumbCrumbs = [
  { id: noteId(10), title: "Projects", icon: "📁" },
  { id: noteId(1), title: "Storybook coverage", icon: "📚" },
];

export const vaultStats = {
  entries: 12,
  collections: 3,
  favorites: 2,
  openTasks: 5,
  trashed: 0,
};

export function sampleVaultSettings(overrides: Record<string, unknown> = {}) {
  return {
    ownerId,
    sharingEnabled: true,
    publicReadonly: true,
    backgroundImage: undefined as string | undefined,
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function sampleShares() {
  return [
    {
      _id: "shares_storybook_1" as Id<"shares">,
      _creationTime: Date.now() - 86_400_000,
      ownerId,
      token: "storybookshare01",
      scope: "vault" as const,
      permission: "read" as const,
      label: "Vault viewer",
      enabled: true,
      createdAt: Date.now() - 86_400_000,
    },
    {
      _id: "shares_storybook_2" as Id<"shares">,
      _creationTime: Date.now() - 43_200_000,
      ownerId,
      token: "storybookshare02",
      scope: "entry" as const,
      noteId: noteId(1),
      permission: "write" as const,
      label: "Entry editor",
      enabled: true,
      createdAt: Date.now() - 43_200_000,
    },
  ];
}

export function sampleVersions() {
  const now = Date.now();
  return [
    {
      _id: "noteVersions_1" as Id<"noteVersions">,
      title: "Storybook notes",
      createdAt: now - 3_600_000,
      preview: "Welcome to NoteVault…",
      blockCount: 8,
    },
    {
      _id: "noteVersions_2" as Id<"noteVersions">,
      title: "Draft title",
      createdAt: now - 86_400_000,
      preview: "Earlier draft…",
      blockCount: 3,
    },
  ];
}

export function sampleTags() {
  return [
    { tag: "storybook", count: 2, key: "storybook" },
    { tag: "design", count: 2, key: "design" },
    { tag: "daily", count: 1, key: "daily" },
    { tag: "work", count: 1, key: "work" },
  ];
}

/** Shape returned by `shares.getSharedVault`. */
export function sampleSharedVault(
  overrides: {
    permission?: "read" | "write";
    scope?: "vault" | "collection" | "entry";
    label?: string;
    notes?: ReturnType<typeof sampleNotes>;
    noteId?: Id<"notes">;
  } = {},
) {
  const permission = overrides.permission ?? "read";
  const scope = overrides.scope ?? "vault";
  const role = permission === "write" ? ("editor" as const) : ("viewer" as const);
  const notes =
    overrides.notes ??
    sampleNotes().filter((n) => !n.archived && !n.trashed);
  return {
    share: {
      token: "storybookshare01",
      scope,
      permission,
      role,
      label: overrides.label ?? "Shared vault",
      noteId: overrides.noteId,
    },
    ownerId,
    role,
    readOnly: permission !== "write",
    settings: { sharingEnabled: true, publicReadonly: true },
    notes,
    rootNote: overrides.noteId
      ? (notes.find((n) => n._id === overrides.noteId) ?? null)
      : null,
  };
}

export function sampleDailyKeysMap(): Record<string, Id<"notes">> {
  const found: Record<string, Id<"notes">> = {};
  const start = new Date();
  start.setDate(start.getDate() - 20);
  for (let i = 0; i < 50; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    if (i % 3 === 0) found[key] = noteId(50 + i);
  }
  return found;
}
