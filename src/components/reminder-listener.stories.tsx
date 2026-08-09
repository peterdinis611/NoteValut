import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ReminderListener } from "./reminder-listener";
import { noteId, ownerId } from "../../.storybook/fixtures";

const meta = {
  title: "Components/ReminderListener",
  component: ReminderListener,
  args: {
    ownerId,
    onOpenNote: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Headless listener — fires toasts/notifications when reminders are in `fired` state. Open the Storybook toast viewport after load.",
      },
    },
  },
} satisfies Meta<typeof ReminderListener>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  parameters: {
    convex: { queries: { "reminders:listFired": [] } },
  },
};

export const WithFiredReminder: Story = {
  parameters: {
    convex: {
      queries: {
        "reminders:listFired": [
          {
            _id: "reminders_1",
            ownerId,
            dailyKey: "2026-08-09",
            noteId: noteId(3),
            title: "Morning standup",
            remindAt: Date.now() - 60_000,
            status: "fired",
            createdAt: Date.now() - 3_600_000,
            firedAt: Date.now() - 60_000,
          },
        ],
      },
    },
  },
  render: (args) => (
    <div className="p-6 text-sm text-muted">
      <p className="mb-4">Listener mounted — a toast should appear for the fired reminder.</p>
      <ReminderListener {...args} />
    </div>
  ),
};
