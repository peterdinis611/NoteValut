import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  noteId,
  sampleNotes,
  sampleSharedVault,
  sampleTags,
} from "../../.storybook/fixtures";
import { SharedVaultApp } from "./shared-vault-app";

const notes = sampleNotes().filter((n) => !n.archived && !n.trashed);

const sharedQueries = {
  "notes:get": notes.find((n) => n._id === noteId(1)) ?? notes[1],
  "notes:listChildren": [],
  "notes:list": notes,
  "notes:getBreadcrumbs": [
    { id: noteId(10), title: "Projects", icon: "📁" },
    { id: noteId(1), title: "Storybook coverage", icon: "📚" },
  ],
  "notes:listBacklinks": [],
  "notes:listTags": sampleTags(),
  "shares:list": [],
  "vaultSettings:get": {
    ownerId: "owner_storybook",
    sharingEnabled: true,
    publicReadonly: true,
    updatedAt: Date.now(),
  },
  "versions:listForNote": [],
};

const meta = {
  title: "App/SharedVaultApp",
  component: SharedVaultApp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SharedVaultApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { token: "share_loading" },
  parameters: {
    convex: { queries: { "shares:getSharedVault": undefined } },
  },
};

export const Unauthorized: Story = {
  args: { token: "share_bad" },
  parameters: {
    convex: { queries: { "shares:getSharedVault": null } },
  },
};

export const Viewer: Story = {
  args: { token: "share_ok" },
  parameters: {
    convex: {
      queries: {
        "shares:getSharedVault": sampleSharedVault({
          permission: "read",
          label: "Team preview",
          notes,
        }),
        ...sharedQueries,
      },
    },
  },
};

export const Editor: Story = {
  args: { token: "share_write" },
  parameters: {
    convex: {
      queries: {
        "shares:getSharedVault": sampleSharedVault({
          permission: "write",
          label: "Team editor",
          notes,
        }),
        ...sharedQueries,
      },
    },
  },
};

export const SingleEntry: Story = {
  args: { token: "share_entry" },
  parameters: {
    convex: {
      queries: {
        "shares:getSharedVault": sampleSharedVault({
          permission: "read",
          scope: "entry",
          label: "One page",
          noteId: noteId(1),
          notes: notes.filter((n) => n._id === noteId(1) || n._id === noteId(10)),
        }),
        ...sharedQueries,
      },
    },
  },
};
