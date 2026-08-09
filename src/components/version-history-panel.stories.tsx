import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noteId, sampleVersions } from "../../.storybook/fixtures";
import { VersionHistoryPanel } from "./version-history-panel";

const meta = {
  title: "Components/VersionHistoryPanel",
  component: VersionHistoryPanel,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "versions:listForNote": sampleVersions(),
      },
    },
  },
} satisfies Meta<typeof VersionHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    noteId: noteId(1),
  },
};

export const Empty: Story = {
  parameters: {
    convex: {
      queries: {
        "versions:listForNote": [],
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    noteId: noteId(1),
  },
};

export const ReadOnly: Story = {
  args: {
    open: true,
    onClose: fn(),
    noteId: noteId(1),
    readOnly: true,
  },
};
