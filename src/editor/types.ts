import type { ReactNode, KeyboardEvent as ReactKeyboardEvent, ClipboardEvent as ReactClipboardEvent } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { Block, BlockType, CalloutVariant } from "@/lib/blocks";

export type SlashCommandDef = {
  id: string;
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
  calloutVariant?: CalloutVariant;
  group?: string;
};

export type EditorCommands = {
  getBlocks: () => Block[];
  getBlock: (id: string) => Block | undefined;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  setBlockType: (
    id: string,
    type: BlockType,
    extras?: Partial<
      Pick<Block, "checked" | "calloutVariant" | "pageId" | "language" | "url" | "label" | "rows" | "color" | "bgColor" | "width" | "align">
    >,
  ) => void;
  insertBlockAfter: (id: string, type?: BlockType, text?: string) => string;
  insertBlockBefore: (id: string, type?: BlockType) => string;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, direction: "up" | "down") => void;
  focusBlock: (id: string, caret?: "start" | "end") => void;
  applySlashCommand: (blockId: string, command: SlashCommandDef) => void;
  clearSlash: (blockId: string) => void;
};

export type BlockRenderProps = {
  block: Block;
  index: number;
  readOnly: boolean;
  isHovered: boolean;
  isFocused: boolean;
  commands: EditorCommands;
  linkablePages: Doc<"notes">[];
  onNavigate?: (id: Id<"notes">) => void;
  onTextChange: (text: string) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  onPaste: (e: ReactClipboardEvent<HTMLElement>) => void;
  onFocus: () => void;
};

export type KeyboardShortcutMap = Record<
  string,
  (ctx: { block: Block; event: ReactKeyboardEvent<HTMLElement>; commands: EditorCommands }) => boolean
>;

export type Extension = {
  name: string;
  /** Block types this extension owns */
  types?: BlockType[];
  /** Atom blocks (divider, pagelink) — no free text caret by default */
  atom?: boolean;
  slashCommands?: SlashCommandDef[];
  keyboardShortcuts?: KeyboardShortcutMap;
  render: (props: BlockRenderProps) => ReactNode;
  placeholder?: (block: Block) => string;
  inputTag?: "input" | "textarea" | "none";
};

export type EditorOptions = {
  extensions: Extension[];
  content: Block[];
  onUpdate: (blocks: Block[]) => void;
  readOnly?: boolean;
  linkablePages?: Doc<"notes">[];
  onNavigate?: (id: Id<"notes">) => void;
};
