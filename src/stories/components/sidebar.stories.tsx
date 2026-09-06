import type { ComponentType } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
import { noteId, ownerId, sampleNotes, sampleVaultSettings } from "../../../.storybook/fixtures";
import { Sidebar } from "@/components/sidebar";

const notes = sampleNotes();
const trashed = [
  {
    ...notes[0]!,
    _id: noteId(99),
    title: "Deleted draft",
    trashed: true,
    pinned: false,
  },
];
const archived = notes.filter((n) => n.archived);

const sidebarShell = (Story: ComponentType) => (
  <div className="flex h-[100vh] bg-background">
    <div className="h-full w-[280px] shrink-0 border-r border-border">
      <Story />
    </div>
  </div>
);

const defaultArgs = {
  ownerId,
  activeId: noteId(1),
  onSelect: fn(),
  onGoHome: fn(),
  onOpenSettings: fn(),
  onOpenTags: fn(),
  onOpenCalendar: fn(),
  onOpenDueInbox: fn(),
  onCollapse: fn(),
  onCreateEntry: fn(),
  onCreateCollection: fn(),
  onQuickCapture: fn(),
};

const meta = {
  title: "App/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:list": notes,
        "notes:listTrashed": trashed,
        "notes:listArchived": archived,
        "notes:listDailyKeys": {},
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
      },
    },
  },
  decorators: [sidebarShell],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultArgs,
};

export const EmptyVault: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:list": [],
        "notes:listTrashed": [],
        "notes:listArchived": [],
        "notes:listDailyKeys": {},
        "shares:list": [],
        "vaultSettings:get": sampleVaultSettings(),
      },
    },
  },
  args: {
    ...defaultArgs,
    activeId: null,
  },
};

export const TrashFocused: Story = {
  args: {
    ...defaultArgs,
    // Sidebar shows Trash section when dueActive/tags aren't set; open via UI.
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trashButtons = canvas.getAllByRole("button", { name: /^trash$/i });
    await userEvent.click(trashButtons[trashButtons.length - 1]!);
  },
};

export const NoActive: Story = {
  args: {
    ...defaultArgs,
    activeId: null,
  },
};
