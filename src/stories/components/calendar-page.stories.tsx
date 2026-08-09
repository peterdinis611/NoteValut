import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noteId, ownerId, sampleDailyKeysMap } from "../../../.storybook/fixtures";
import { CalendarPage } from "@/components/calendar-page";

const dailyMap = sampleDailyKeysMap();
const scheduled = Object.fromEntries(
  Object.keys(dailyMap)
    .slice(0, 4)
    .map((key, i) => [
      key,
      {
        id: `reminders_cal_${i}`,
        remindAt: Date.now() + (i + 1) * 3_600_000,
        title: `Reminder ${i + 1}`,
      },
    ]),
);

const meta = {
  title: "App/CalendarPage",
  component: CalendarPage,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:listDailyKeys": dailyMap,
        "reminders:listScheduledForKeys": scheduled,
      },
    },
  },
} satisfies Meta<typeof CalendarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
};

export const EmptyMonth: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
  parameters: {
    convex: {
      queries: {
        "notes:listDailyKeys": {},
        "reminders:listScheduledForKeys": {},
      },
    },
  },
};

export const WithReminders: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onNavigate: fn(),
  },
};
