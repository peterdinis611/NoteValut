import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ownerId } from "../../../.storybook/fixtures";
import { SettingsPage } from "@/components/settings-page";

const meta = {
  title: "App/SettingsPage",
  component: SettingsPage,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "push:getVapidPublicKey": null,
        "push:listMine": [],
      },
    },
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    onClose: fn(),
    onExport: fn(),
    onExportMarkdown: fn(),
    onStartTour: fn(),
  },
};

export const WithPushReady: Story = {
  parameters: {
    convex: {
      queries: {
        "push:getVapidPublicKey": "BFakeVapidPublicKeyForStorybookPreviewOnly",
        "push:listMine": [
          {
            _id: "push_story_1",
            endpoint: "https://push.example/story",
            userAgent: "Storybook",
            createdAt: Date.now() - 86_400_000,
          },
        ],
      },
    },
  },
  args: {
    ownerId,
    onClose: fn(),
    onExport: fn(),
    onExportMarkdown: fn(),
    onStartTour: fn(),
  },
};
