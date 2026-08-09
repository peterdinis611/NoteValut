import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Home, Plus, Settings2, Zap } from "lucide-react";
import { fn } from "storybook/test";
import { ownerId, sampleNotes } from "../../../.storybook/fixtures";
import { CommandPalette, type CommandAction } from "@/components/command-palette";

const actions: CommandAction[] = [
  {
    id: "home",
    label: "Go home",
    hint: "Vault overview",
    icon: <Home className="size-4" />,
    keywords: ["home"],
    run: fn(),
  },
  {
    id: "new",
    label: "New entry",
    hint: "⌘ N",
    icon: <Plus className="size-4" />,
    keywords: ["create", "new"],
    run: fn(),
  },
  {
    id: "capture",
    label: "Quick capture",
    icon: <Zap className="size-4" />,
    run: fn(),
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings2 className="size-4" />,
    run: fn(),
  },
];

const meta = {
  title: "Components/CommandPalette",
  component: CommandPalette,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:search": sampleNotes().filter((n) => n.kind === "page").slice(0, 4),
      },
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    notes: sampleNotes(),
    actions,
    onNavigate: fn(),
    ownerId,
  },
};

export const EmptyNotes: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:search": [],
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    notes: [],
    actions,
    onNavigate: fn(),
    ownerId,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
    notes: sampleNotes(),
    actions,
    onNavigate: fn(),
    ownerId,
  },
};
