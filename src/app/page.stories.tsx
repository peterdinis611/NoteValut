import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ownerId,
  sampleNotes,
  sampleTags,
  vaultStats,
} from "../../.storybook/fixtures";
import Home from "./page";

const notes = sampleNotes();

const meta = {
  title: "App/Routes/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:list": notes.filter((n) => !n.trashed && !n.archived),
        "notes:listTrashed": [],
        "notes:listArchived": notes.filter((n) => n.archived),
        "notes:exportVault": null,
        "notes:getVaultStats": vaultStats,
        "vaultSettings:get": {
          ownerId,
          sharingEnabled: true,
          publicReadonly: false,
          updatedAt: Date.now(),
        },
        "reminders:listFired": [],
        "notes:listDailyKeys": {},
        "reminders:listScheduledForKeys": {},
        "notes:listTags": sampleTags(),
        "notes:get": notes[1],
        "notes:listChildren": [],
        "notes:getBreadcrumbs": [],
        "notes:listBacklinks": [],
        "notes:search": [],
      },
    },
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
