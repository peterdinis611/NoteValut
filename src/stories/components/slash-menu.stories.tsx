import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { sampleSlashCommands } from "../../../.storybook/fixtures";
import { SlashMenu } from "@/components/slash-menu";

const meta = {
  title: "Components/SlashMenu",
  component: SlashMenu,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative max-w-sm p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SlashMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    commands: sampleSlashCommands,
    selectedIndex: 1,
    onSelect: fn(),
  },
};

export const Empty: Story = {
  args: {
    commands: [],
    selectedIndex: 0,
    onSelect: fn(),
  },
};

export const SelectedLast: Story = {
  args: {
    commands: sampleSlashCommands,
    selectedIndex: sampleSlashCommands.length - 1,
    onSelect: fn(),
  },
};
