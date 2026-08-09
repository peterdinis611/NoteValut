import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import { noteId, ownerId, sampleNote, sampleNotes } from "../../../.storybook/fixtures";
import { DueInbox } from "@/components/due-inbox";

const now = Date.now();
const day = 86_400_000;

const notesWithDue = [
  ...sampleNotes(),
  sampleNote({
    _id: noteId(20),
    title: "Tasks with due dates",
    icon: "✅",
    tags: ["tasks"],
    pinned: false,
    blocks: [
      createBlock("todo", "Overdue review", { checked: false, dueAt: now - 2 * day }),
      createBlock("todo", "Due today", { checked: false, dueAt: now + 2 * 3_600_000 }),
      createBlock("todo", "Next week", { checked: false, dueAt: now + 5 * day }),
      createBlock("todo", "Done already", { checked: true, dueAt: now - day }),
    ],
  }),
];

const overdueHeavy = [
  sampleNote({
    _id: noteId(30),
    title: "Sprint leftovers",
    icon: "🔥",
    pinned: false,
    tags: ["sprint"],
    blocks: [
      createBlock("todo", "Fix auth regression", { checked: false, dueAt: now - 5 * day }),
      createBlock("todo", "Write release notes", { checked: false, dueAt: now - 3 * day }),
      createBlock("todo", "Update docs", { checked: false, dueAt: now - 2 * day }),
      createBlock("todo", "Triage bugs", { checked: false, dueAt: now - day }),
      createBlock("todo", "Ship hotfix", { checked: false, dueAt: now - 12 * 3_600_000 }),
    ],
  }),
  sampleNote({
    _id: noteId(31),
    title: "Personal backlog",
    icon: "📌",
    pinned: false,
    tags: [],
    blocks: [
      createBlock("todo", "Renew domain", { checked: false, dueAt: now - 10 * day }),
      createBlock("todo", "Backup vault", { checked: false, dueAt: now - 7 * day }),
    ],
  }),
];

const meta = {
  title: "Components/DueInbox",
  component: DueInbox,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:list": notesWithDue,
      },
    },
  },
} satisfies Meta<typeof DueInbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
};

export const Empty: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:list": sampleNotes().map((n) => ({
          ...n,
          blocks: (n.blocks ?? []).map((b) =>
            b.type === "todo" ? { ...b, dueAt: undefined } : b,
          ),
        })),
      },
    },
  },
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
};

export const OverdueHeavy: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:list": overdueHeavy,
      },
    },
  },
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
};
