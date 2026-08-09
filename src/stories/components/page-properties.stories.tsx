import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ownerId, sampleTags } from "../../../.storybook/fixtures";
import { PageProperties } from "@/components/page-properties";

const meta = {
  title: "Components/PageProperties",
  component: PageProperties,
  parameters: {
    layout: "padded",
    convex: {
      queries: {
        "notes:listTags": sampleTags(),
      },
    },
  },
} satisfies Meta<typeof PageProperties>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ["storybook", "design"],
    updatedAt: Date.now() - 3_600_000,
    ownerId,
    onChange: fn(),
    onOpenTag: fn(),
  },
};

export const ReadOnly: Story = {
  args: {
    tags: ["storybook"],
    updatedAt: Date.now() - 86_400_000,
    readOnly: true,
    onChange: fn(),
  },
};

export const ManyTags: Story = {
  args: {
    tags: ["storybook", "design", "daily", "work", "research", "inbox", "review"],
    updatedAt: Date.now() - 600_000,
    ownerId,
    onChange: fn(),
    onOpenTag: fn(),
  },
};

export const NoTags: Story = {
  args: {
    tags: [],
    updatedAt: Date.now() - 3_600_000,
    ownerId,
    onChange: fn(),
    onOpenTag: fn(),
  },
};
