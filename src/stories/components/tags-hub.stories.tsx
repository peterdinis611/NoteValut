import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ownerId, sampleNotes, sampleTags } from "../../../.storybook/fixtures";
import { TagsHub } from "@/components/tags-hub";

const meta = {
  title: "Components/TagsHub",
  component: TagsHub,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:listTags": sampleTags(),
        "notes:list": sampleNotes(),
      },
    },
  },
} satisfies Meta<typeof TagsHub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
    initialTag: "storybook",
  },
};

export const Empty: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:listTags": [],
        "notes:list": [],
      },
    },
  },
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
};

export const WithActiveTag: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
    initialTag: "design",
  },
};
