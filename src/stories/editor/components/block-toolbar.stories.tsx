import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { BlockToolbar } from "@/editor/components/block-toolbar";

const meta = {
  title: "Editor/BlockToolbar",
  component: BlockToolbar,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BlockToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onColor: fn(),
    onBgColor: fn(),
  },
};

export const WithActiveColors: Story = {
  args: {
    color: "amber",
    bgColor: "sky",
    onColor: fn(),
    onBgColor: fn(),
  },
};
