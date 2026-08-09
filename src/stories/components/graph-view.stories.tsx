import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import { noteId, sampleNote, sampleNotes } from "../../../.storybook/fixtures";
import { GraphView } from "@/components/graph-view";

const linkedNotes = sampleNotes().map((n) => {
  if (n._id !== noteId(1)) return n;
  return {
    ...n,
    blocks: [
      ...(n.blocks ?? []),
      createBlock("pagelink", "Copper ink theme", { pageId: noteId(2) }),
    ],
  };
});

const sparseNotes = [
  sampleNote({
    _id: noteId(1),
    title: "Lone note",
    pinned: false,
    tags: [],
    blocks: [createBlock("paragraph", "Almost no links.")],
  }),
  sampleNote({
    _id: noteId(2),
    title: "Neighbor",
    pinned: false,
    tags: [],
    parentId: undefined,
    blocks: [createBlock("pagelink", "Lone note", { pageId: noteId(1) })],
  }),
];

const denseNotes = [
  sampleNote({
    _id: noteId(1),
    title: "Hub",
    pinned: true,
    blocks: [
      createBlock("pagelink", "A", { pageId: noteId(2) }),
      createBlock("pagelink", "B", { pageId: noteId(3) }),
      createBlock("pagelink", "C", { pageId: noteId(4) }),
      createBlock("pagelink", "D", { pageId: noteId(5) }),
    ],
  }),
  sampleNote({
    _id: noteId(2),
    title: "A",
    pinned: false,
    tags: [],
    blocks: [
      createBlock("pagelink", "Hub", { pageId: noteId(1) }),
      createBlock("pagelink", "B", { pageId: noteId(3) }),
    ],
  }),
  sampleNote({
    _id: noteId(3),
    title: "B",
    pinned: false,
    tags: [],
    blocks: [
      createBlock("pagelink", "Hub", { pageId: noteId(1) }),
      createBlock("pagelink", "C", { pageId: noteId(4) }),
    ],
  }),
  sampleNote({
    _id: noteId(4),
    title: "C",
    pinned: false,
    tags: [],
    blocks: [
      createBlock("pagelink", "Hub", { pageId: noteId(1) }),
      createBlock("pagelink", "D", { pageId: noteId(5) }),
    ],
  }),
  sampleNote({
    _id: noteId(5),
    title: "D",
    pinned: false,
    tags: [],
    blocks: [
      createBlock("pagelink", "Hub", { pageId: noteId(1) }),
      createBlock("pagelink", "A", { pageId: noteId(2) }),
    ],
  }),
];

const meta = {
  title: "Components/GraphView",
  component: GraphView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GraphView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    notes: linkedNotes,
    onNavigate: fn(),
  },
};

export const Sparse: Story = {
  args: {
    open: true,
    onClose: fn(),
    notes: sparseNotes,
    onNavigate: fn(),
  },
};

export const Dense: Story = {
  args: {
    open: true,
    onClose: fn(),
    notes: denseNotes,
    onNavigate: fn(),
  },
};
