import type { ComponentType } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { VaultAccessProvider } from "@/context/vault-access";
import {
  breadcrumbCrumbs,
  noteId,
  ownerId,
  sampleFolder,
  sampleNote,
  sampleNotes,
  sampleTags,
  sampleVaultSettings,
} from "../../../.storybook/fixtures";
import { NoteEditor } from "@/components/note-editor";

const note = sampleNote();
const children = sampleNotes().filter((n) => n.parentId === note._id);
const folder = sampleFolder();
const folderChildren = sampleNotes().filter((n) => n.parentId === folder._id);
const archived = sampleNote({
  _id: noteId(4),
  title: "Archived draft",
  archived: true,
  pinned: false,
  tags: [],
});
const locked = sampleFolder({
  _id: noteId(12),
  title: "Locked collection",
  isLocked: true,
  pinned: false,
});
const lockedChildren = sampleNotes().filter((n) => n.parentId === folder._id);
const daily = sampleNote({
  _id: noteId(3),
  title: "Daily — 2026-08-09",
  icon: "☀️",
  dailyKey: "2026-08-09",
  parentId: undefined,
  pinned: false,
  tags: ["daily"],
});

const editorShell = (Story: ComponentType) => (
  <div className="app-main note-scroll h-[100vh] overflow-y-auto">
    <Story />
  </div>
);

const defaultArgs = {
  noteId: noteId(1),
  ownerId,
  onNavigate: fn(),
  onToggleSidebar: fn(),
  sidebarCollapsed: false,
  onCreateEntry: fn(),
  onCreateCollection: fn(),
  onOpenTag: fn(),
};

const meta = {
  title: "App/NoteEditor",
  component: NoteEditor,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:get": note,
        "notes:listChildren": children,
        "notes:list": sampleNotes(),
        "notes:getBreadcrumbs": breadcrumbCrumbs,
        "notes:listBacklinks": [],
        "notes:listTags": sampleTags(),
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
        "versions:listForNote": [],
      },
    },
  },
  decorators: [editorShell],
} satisfies Meta<typeof NoteEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultArgs,
};

export const Folder: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:get": folder,
        "notes:listChildren": folderChildren,
        "notes:list": sampleNotes(),
        "notes:getBreadcrumbs": [{ id: folder._id, title: folder.title, icon: folder.icon }],
        "notes:listBacklinks": [],
        "notes:listTags": sampleTags(),
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
        "versions:listForNote": [],
      },
    },
  },
  args: {
    ...defaultArgs,
    noteId: folder._id,
  },
};

export const Archived: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:get": archived,
        "notes:listChildren": [],
        "notes:list": sampleNotes(),
        "notes:getBreadcrumbs": [],
        "notes:listBacklinks": [],
        "notes:listTags": sampleTags(),
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
        "versions:listForNote": [],
      },
    },
  },
  args: {
    ...defaultArgs,
    noteId: archived._id,
  },
};

export const Locked: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:get": locked,
        "notes:listChildren": lockedChildren,
        "notes:list": sampleNotes(),
        "notes:getBreadcrumbs": [{ id: locked._id, title: locked.title, icon: locked.icon }],
        "notes:listBacklinks": [],
        "notes:listTags": sampleTags(),
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
        "versions:listForNote": [],
      },
    },
  },
  args: {
    ...defaultArgs,
    noteId: locked._id,
  },
};

export const ReadOnlyShare: Story = {
  decorators: [
    (Story) => (
      <VaultAccessProvider role="viewer" sharePermission="read" shareScope="vault">
        <div className="app-main note-scroll h-[100vh] overflow-y-auto">
          <Story />
        </div>
      </VaultAccessProvider>
    ),
  ],
  args: defaultArgs,
};

export const DailyNote: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:get": daily,
        "notes:listChildren": [],
        "notes:list": sampleNotes(),
        "notes:getBreadcrumbs": [],
        "notes:listBacklinks": [],
        "notes:listTags": sampleTags(),
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
        "versions:listForNote": [],
      },
    },
  },
  args: {
    ...defaultArgs,
    noteId: daily._id,
  },
};
