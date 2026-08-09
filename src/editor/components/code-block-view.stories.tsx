import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import type { BlockRenderProps, EditorCommands } from "../types";
import { CodeBlockView } from "./code-block-view";

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

const jsSample = `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("NoteVault"));
`;

const codeBlock = createBlock("code", jsSample, { language: "javascript" });

function baseProps(overrides: Partial<BlockRenderProps> = {}): BlockRenderProps {
  return {
    block: codeBlock,
    index: 0,
    readOnly: false,
    isHovered: false,
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
  title: "Editor/CodeBlockView",
  component: CodeBlockView,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeBlockView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  args: baseProps({ readOnly: true }),
};

export const Editing: Story = {
  args: baseProps({
    readOnly: false,
    isFocused: true,
  }),
};
