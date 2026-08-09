import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import type { BlockRenderProps, EditorCommands } from "../types";
import { FileBlockView } from "./file-block-view";

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
    block: createBlock("file", "Q3 roadmap.xlsx", {
      url: "https://example.com/files/q3-roadmap.xlsx",
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
  title: "Editor/FileBlockView",
  component: FileBlockView,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileBlockView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spreadsheet: Story = {
  args: baseProps(),
};

export const Document: Story = {
  args: baseProps({
    block: createBlock("file", "Brief.pdf", {
      url: "https://example.com/files/brief.pdf",
    }),
  }),
};

export const Presentation: Story = {
  args: baseProps({
    block: createBlock("file", "Kickoff.pptx", {
      url: "https://example.com/files/kickoff.pptx",
    }),
  }),
};

export const Empty: Story = {
  args: baseProps({
    block: createBlock("file", "", { url: undefined }),
  }),
};

export const ReadOnly: Story = {
  args: baseProps({ readOnly: true, isHovered: false }),
};
