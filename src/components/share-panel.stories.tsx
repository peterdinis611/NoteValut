import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  noteId,
  ownerId,
  sampleShares,
  sampleVaultSettings,
} from "../../.storybook/fixtures";
import { SharePanel } from "./share-panel";

const meta = {
  title: "Components/SharePanel",
  component: SharePanel,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "shares:list": sampleShares(),
        "vaultSettings:get": sampleVaultSettings({ sharingEnabled: true }),
      },
    },
  },
} satisfies Meta<typeof SharePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VaultOpen: Story = {
  args: {
    ownerId,
    open: true,
    onClose: fn(),
    scope: "vault",
    title: "My vault",
  },
};

export const EntryOpen: Story = {
  args: {
    ownerId,
    open: true,
    onClose: fn(),
    scope: "entry",
    noteId: noteId(1),
    title: "Storybook coverage",
  },
};

export const SharingDisabled: Story = {
  parameters: {
    convex: {
      queries: {
        "shares:list": sampleShares(),
        "vaultSettings:get": sampleVaultSettings({ sharingEnabled: false }),
      },
    },
  },
  args: {
    ownerId,
    open: true,
    onClose: fn(),
    scope: "vault",
    title: "My vault",
  },
};

export const EmptyShares: Story = {
  parameters: {
    convex: {
      queries: {
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings({ sharingEnabled: true }),
      },
    },
  },
  args: {
    ownerId,
    open: true,
    onClose: fn(),
    scope: "vault",
    title: "My vault",
  },
};
