import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { FormatToolbar } from "./format-toolbar";

const meta = {
  title: "Editor/FormatToolbar",
  component: FormatToolbar,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormatToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onFormat: fn(),
  },
};
