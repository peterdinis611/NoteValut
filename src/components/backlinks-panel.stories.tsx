import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noteId, ownerId } from "../../.storybook/fixtures";
import { BacklinksPanel } from "./backlinks-panel";

const meta = {
  title: "Components/BacklinksPanel",
  component: BacklinksPanel,
  parameters: {
    layout: "padded",
    convex: {
      queries: {
        "notes:listBacklinks": [
          {
            _id: noteId(2),
            title: "Copper ink theme",
            icon: "🎨",
            updatedAt: Date.now() - 3_600_000,
            count: 2,
          },
          {
            _id: noteId(3),
            title: "Daily — 2026-08-09",
            icon: "☀️",
            updatedAt: Date.now() - 86_400_000,
            count: 1,
          },
        ],
      },
    },
  },
} satisfies Meta<typeof BacklinksPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    noteId: noteId(1),
    onNavigate: fn(),
  },
};

export const Empty: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:listBacklinks": [],
      },
    },
  },
  args: {
    ownerId,
    noteId: noteId(1),
    onNavigate: fn(),
  },
};
