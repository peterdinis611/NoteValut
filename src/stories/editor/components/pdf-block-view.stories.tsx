import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import type { BlockRenderProps, EditorCommands } from "@/editor/types";
import { PdfBlockView } from "@/editor/components/pdf-block-view";

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
    block: createBlock("pdf", "Spec sheet", {
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
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
  title: "Editor/PdfBlockView",
  component: PdfBlockView,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PdfBlockView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPdf: Story = {
  args: baseProps(),
};

export const ReadOnly: Story = {
  args: baseProps({ readOnly: true, isHovered: false }),
};

export const Empty: Story = {
  args: baseProps({
    block: createBlock("pdf", "", { url: undefined }),
  }),
};
