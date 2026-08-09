import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import type { BlockRenderProps, EditorCommands } from "@/editor/types";
import { ImageBlockView } from "@/editor/components/image-block-view";

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

const imageBlock = createBlock("image", "Harbor at dusk", {
  url: "https://picsum.photos/seed/notevault-cover/1200/700",
  width: 80,
  align: "center",
});

function baseProps(overrides: Partial<BlockRenderProps> = {}): BlockRenderProps {
  return {
    block: imageBlock,
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
  title: "Editor/ImageBlockView",
  component: ImageBlockView,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImageBlockView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: baseProps(),
};

export const ReadOnly: Story = {
  args: baseProps({ readOnly: true, isHovered: false }),
};

export const Empty: Story = {
  args: baseProps({
    block: createBlock("image", "", { url: undefined }),
  }),
};
