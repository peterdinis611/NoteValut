import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ownerId, sampleDailyKeysMap } from "../../.storybook/fixtures";
import { DailyCalendar } from "./daily-calendar";

const meta = {
  title: "Components/DailyCalendar",
  component: DailyCalendar,
  parameters: {
    layout: "padded",
    convex: {
      queries: {
        "notes:listDailyKeys": sampleDailyKeysMap(),
      },
    },
  },
} satisfies Meta<typeof DailyCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    onOpenNote: fn(),
  },
};

export const Compact: Story = {
  args: {
    ownerId,
    onOpenNote: fn(),
    compact: true,
  },
};
