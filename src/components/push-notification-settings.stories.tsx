import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Id } from "../../convex/_generated/dataModel";
import { ownerId } from "../../.storybook/fixtures";
import { PushNotificationSettings } from "./push-notification-settings";

const meta = {
  title: "Components/PushNotificationSettings",
  component: PushNotificationSettings,
  parameters: {
    layout: "padded",
    convex: {
      queries: {
        "push:getVapidPublicKey": "BPStorybookVapidPublicKeyPlaceholder0123456789",
        "push:listMine": [
          {
            _id: "push_storybook_1" as Id<"pushSubscriptions">,
            ownerId,
            endpoint: "https://example.com/push/storybook",
            userAgent: "Storybook",
          },
        ],
      },
    },
  },
} satisfies Meta<typeof PushNotificationSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: { ownerId },
};

export const Disabled: Story = {
  parameters: {
    convex: {
      queries: {
        "push:getVapidPublicKey": "BPStorybookVapidPublicKeyPlaceholder0123456789",
        "push:listMine": [],
      },
    },
  },
  args: { ownerId },
};
