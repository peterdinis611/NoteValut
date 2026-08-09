import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noteId, ownerId, sampleNotes } from "../../../.storybook/fixtures";
import { MoveDialog } from "@/components/move-dialog";

const meta = {
  title: "Components/MoveDialog",
  component: MoveDialog,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:list": sampleNotes(),
      },
    },
  },
} satisfies Meta<typeof MoveDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    onMoved: fn(),
    ownerId,
    noteId: noteId(1),
    noteTitle: "Storybook coverage",
    currentParentId: noteId(10),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
    onMoved: fn(),
    ownerId,
    noteId: noteId(1),
    noteTitle: "Storybook coverage",
    currentParentId: noteId(10),
  },
};
