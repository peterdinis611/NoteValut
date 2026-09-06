import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SharedVaultApp } from "@/components/shared-vault-app";
import {
  noteId,
  sampleNotes,
  sampleSharedVault,
  sampleTags,
} from "../../../../../.storybook/fixtures";

/**
 * `share/[token]/page.tsx` is an async Server Component.
 * Story renders the same client tree it mounts (`SharedVaultApp`).
 */
const notes = sampleNotes().filter((n) => !n.archived && !n.trashed);

const meta = {
  title: "App/Routes/SharePage",
  component: SharedVaultApp,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Route `app/share/[token]/page.tsx` awaits params and renders SharedVaultApp.",
      },
    },
  },
  args: { token: "storybookshare01" },
} satisfies Meta<typeof SharedVaultApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    convex: {
      queries: {
        "shares:getSharedVault": sampleSharedVault({
          permission: "read",
          label: "Shared route",
          notes,
        }),
        "notes:get": notes.find((n) => n._id === noteId(1)),
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
      },
    },
  },
};
