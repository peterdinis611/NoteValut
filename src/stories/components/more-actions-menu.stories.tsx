import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Trash2 } from "lucide-react";
import { fn } from "storybook/test";
import { MoreActionIcons, MoreActionsMenu } from "@/components/more-actions-menu";

const meta = {
  title: "Components/MoreActionsMenu",
  component: MoreActionsMenu,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex justify-end p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoreActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: "duplicate",
        label: "Duplicate",
        icon: MoreActionIcons.copy,
        onClick: fn(),
      },
      {
        id: "move",
        label: "Move to…",
        icon: MoreActionIcons.move,
        onClick: fn(),
      },
      {
        id: "history",
        label: "Version history",
        icon: MoreActionIcons.history,
        onClick: fn(),
      },
      {
        id: "export",
        label: "Export markdown",
        icon: MoreActionIcons.markdown,
        onClick: fn(),
      },
      {
        id: "archive",
        label: "Archive",
        icon: MoreActionIcons.archive,
        onClick: fn(),
      },
      {
        id: "trash",
        label: "Move to bin",
        icon: <Trash2 className="size-3.5" />,
        onClick: fn(),
        danger: true,
      },
    ],
  },
};

export const EmptyItems: Story = {
  args: {
    items: [],
  },
};

export const DangerOnly: Story = {
  args: {
    items: [
      {
        id: "trash",
        label: "Move to bin",
        icon: <Trash2 className="size-3.5" />,
        onClick: fn(),
        danger: true,
      },
      {
        id: "purge",
        label: "Delete forever",
        icon: <Trash2 className="size-3.5" />,
        onClick: fn(),
        danger: true,
      },
    ],
  },
};
