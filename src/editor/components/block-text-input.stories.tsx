import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import { BlockTextInput } from "./block-text-input";

const meta = {
  title: "Editor/BlockTextInput",
  component: BlockTextInput,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BlockTextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onChange: fn(),
  onKeyDown: fn(),
  onPaste: fn(),
  onFocus: fn(),
};

export const Empty: Story = {
  args: {
    block: createBlock("paragraph", ""),
    placeholder: "Type something…",
    ...callbacks,
  },
};

export const WithText: Story = {
  args: {
    block: createBlock("paragraph", "Hello **bold** and *italic* text"),
    placeholder: "Type something…",
    ...callbacks,
  },
};

export const ReadOnly: Story = {
  args: {
    block: createBlock("paragraph", "Read-only content with `code` marks"),
    readOnly: true,
    ...callbacks,
  },
};

export const InputTag: Story = {
  args: {
    block: createBlock("heading1", "Heading as input"),
    tag: "input",
    placeholder: "Heading…",
    ...callbacks,
  },
};

export const RichPreviewOff: Story = {
  args: {
    block: createBlock("paragraph", "Raw markdown **without** rich preview"),
    richPreview: false,
    ...callbacks,
  },
};
