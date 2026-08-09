import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  ownerId,
  sampleDailyKeysMap,
  sampleNotes,
  sampleVaultSettings,
  vaultStats,
} from "../../../.storybook/fixtures";
import { VaultHome } from "@/components/vault-home";

const meta = {
  title: "App/VaultHome",
  component: VaultHome,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:getVaultStats": vaultStats,
        "notes:list": sampleNotes(),
        "vaultSettings:get": sampleVaultSettings(),
        "notes:listDailyKeys": sampleDailyKeysMap(),
      },
    },
  },
} satisfies Meta<typeof VaultHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
    onQuickCapture: fn(),
    onOpenGraph: fn(),
    onOpenCalendar: fn(),
    onOpenDueInbox: fn(),
  },
};

export const Empty: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:getVaultStats": {
          entries: 0,
          collections: 0,
          favorites: 0,
          openTasks: 0,
          trashed: 0,
        },
        "notes:list": [],
        "vaultSettings:get": sampleVaultSettings(),
        "notes:listDailyKeys": {},
      },
    },
  },
  args: {
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
    onQuickCapture: fn(),
    onOpenGraph: fn(),
    onOpenCalendar: fn(),
    onOpenDueInbox: fn(),
  },
};

export const WithBackground: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:getVaultStats": vaultStats,
        "notes:list": sampleNotes(),
        "vaultSettings:get": sampleVaultSettings({
          backgroundImage:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
        }),
        "notes:listDailyKeys": sampleDailyKeysMap(),
      },
    },
  },
  args: {
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
    onQuickCapture: fn(),
    onOpenGraph: fn(),
    onOpenCalendar: fn(),
    onOpenDueInbox: fn(),
  },
};
