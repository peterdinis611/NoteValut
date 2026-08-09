import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import type { BlockRenderProps, EditorCommands } from "../types";
import { VideoBlockView } from "./video-block-view";

const noopCommands: EditorCommands = {
  getBlocks: () => [],
  getBlock: () => undefined,
  updateBlock: fn(),
  setBlockType: fn(),
  insertBlockAfter: () => "",
  insertBlockBefore: () => "",
  deleteBlock: fn(),
  moveBlock: fn(),
  reorderBlocks: fn(),
  focusBlock: fn(),
  applySlashCommand: fn(),
  applyMention: fn(),
  clearSlash: fn(),
};

function baseProps(overrides: Partial<BlockRenderProps> = {}): BlockRenderProps {
  return {
    block: createBlock("video", "Product walkthrough", {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }),
    index: 0,
    readOnly: false,
    isHovered: true,
    isFocused: false,
    commands: noopCommands,
    linkablePages: [],
    onTextChange: fn(),
    onKeyDown: fn(),
    onPaste: fn(),
    onFocus: fn(),
    ...overrides,
  };
}

const meta = {
  title: "Editor/VideoBlockView",
  component: VideoBlockView,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoBlockView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTube: Story = {
  args: baseProps(),
};

export const ReadOnly: Story = {
  args: baseProps({ readOnly: true, isHovered: false }),
};

export const Empty: Story = {
  args: baseProps({
    block: createBlock("video", "", { url: undefined }),
  }),
};

export const UnsupportedUrl: Story = {
  args: baseProps({
    block: createBlock("video", "Odd link", {
      url: "https://example.com/not-a-video",
    }),
  }),
};
