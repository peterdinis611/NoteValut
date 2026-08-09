import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InlineFormattedText } from "./inline-formatted-text";

const meta = {
  title: "Editor/InlineFormattedText",
  component: InlineFormattedText,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-8 text-base leading-relaxed">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InlineFormattedText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  args: {
    text: "A plain paragraph with no formatting markers.",
  },
};

export const BoldItalicCode: Story = {
  args: {
    text: "Use **bold**, *italic*, and `inline code` together.",
  },
};

export const Highlight: Story = {
  args: {
    text: "Mark important bits with ==highlight== spans.",
  },
};

export const Placeholder: Story = {
  args: {
    text: "",
    placeholder: "Type something…",
  },
};
