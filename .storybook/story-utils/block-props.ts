import { fn } from "storybook/test";
import { createBlock, type Block, type BlockType } from "@/lib/blocks";
import type { BlockRenderProps, EditorCommands } from "@/editor/types";
import { noteId, sampleNotes } from "../fixtures";

export const noopEditorCommands: EditorCommands = {
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

export function blockRenderProps(
  block: Block,
  overrides: Partial<BlockRenderProps> = {},
): BlockRenderProps {
  return {
    block,
    index: 0,
    readOnly: false,
    isHovered: true,
    isFocused: false,
    commands: noopEditorCommands,
    linkablePages: sampleNotes().filter((n) => n.kind === "page"),
    onNavigate: fn(),
    onTextChange: fn(),
    onKeyDown: fn(),
    onPaste: fn(),
    onFocus: fn(),
    ...overrides,
  };
}

export function sampleBlock(
  type: BlockType,
  text = "Sample text",
  extras?: Parameters<typeof createBlock>[2],
): Block {
  return createBlock(type, text, extras);
}

export function pageLinkBlock(): Block {
  return createBlock("pagelink", "Storybook coverage", {
    pageId: noteId(1),
  });
}
