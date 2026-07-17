"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { Block } from "@/lib/blocks";
import { StarterKit } from "./extensions";
import type { Extension } from "./types";
import { useEditor } from "./use-editor";
import { BlockToolbar, canColorBlock } from "./components/block-toolbar";
import { EditorSlashMenu } from "./components/editor-slash-menu";

type Props = {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  extensions?: Extension[];
  linkablePages?: Doc<"notes">[];
  onNavigate?: (id: Id<"notes">) => void;
  readOnly?: boolean;
  placeholder?: string;
};

/**
 * NoteVault block editor — TipTap-inspired architecture.
 * Pass custom `extensions` to add or replace block types.
 */
export function VaultEditor({
  blocks,
  onChange,
  extensions = StarterKit,
  linkablePages = [],
  onNavigate,
  readOnly = false,
}: Props) {
  const editor = useEditor({
    extensions,
    content: blocks,
    onUpdate: onChange,
    readOnly,
    linkablePages,
    onNavigate,
  });

  return (
    <div className={`nv-editor ${readOnly ? "nv-editor-readonly" : ""}`}>
      {editor.blocks.map((block, index) => {
        const ext = editor.getExtension(block.type);
        const { isSlash, query } = editor.parseSlash(block.text);
        const slashOpen = editor.slashBlockId === block.id && isSlash;
        const slashCmds = slashOpen ? editor.filterSlash(query) : [];
        const isHovered = editor.hoveredId === block.id;
        const isFocused = editor.focusedId === block.id;
        const showChrome = isHovered || isFocused;
        const showToolbar =
          !readOnly && isFocused && !slashOpen && canColorBlock(block.type);
        const isEmptyHint =
          !readOnly &&
          !block.text &&
          block.type === "paragraph" &&
          index === editor.blocks.length - 1 &&
          !isSlash;

        return (
          <div
            key={block.id}
            className={`nv-row ${isFocused ? "nv-row-focused" : ""}`}
            onMouseEnter={() => editor.setHoveredId(block.id)}
            onMouseLeave={() => editor.setHoveredId(null)}
          >
            {!readOnly && (
              <div className={`nv-gutter ${showChrome ? "nv-gutter-visible" : ""}`}>
                <button
                  type="button"
                  className="nv-gutter-btn"
                  aria-label="Add block"
                  onClick={() => editor.commands.insertBlockAfter(block.id)}
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="nv-gutter-btn nv-gutter-grip"
                  aria-label="Move block"
                  title="⌘↑ / ⌘↓ to reorder"
                  onClick={() => editor.commands.moveBlock(block.id, "up")}
                >
                  <GripVertical className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="nv-gutter-btn nv-gutter-danger"
                  aria-label="Delete block"
                  title="Delete block"
                  onClick={() => editor.commands.deleteBlock(block.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}

            <div className="nv-content">
              {showToolbar && (
                <BlockToolbar
                  color={block.color}
                  bgColor={block.bgColor}
                  onColor={(color) =>
                    editor.commands.updateBlock(block.id, { color })
                  }
                  onBgColor={(bgColor) =>
                    editor.commands.updateBlock(block.id, { bgColor })
                  }
                />
              )}

              {ext ? (
                ext.render({
                  block,
                  index,
                  readOnly,
                  isHovered,
                  isFocused,
                  commands: editor.commands,
                  linkablePages,
                  onNavigate,
                  onTextChange: (text) => editor.handleTextChange(block, text),
                  onKeyDown: (e) => editor.handleKeyDown(block, e),
                  onPaste: (e) => {
                    const text = e.clipboardData.getData("text/plain");
                    if (text && editor.handlePasteMarkdown(block.id, text)) {
                      e.preventDefault();
                    }
                  },
                  onFocus: () => editor.setFocusedId(block.id),
                })
              ) : (
                <p className="nv-missing">Unknown block: {block.type}</p>
              )}

              {isEmptyHint && (
                <p className="nv-hint">
                  / commands · hover to delete · paste markdown
                </p>
              )}

              {slashOpen && (
                <div className="nv-slash-anchor">
                  <EditorSlashMenu
                    commands={slashCmds}
                    selectedIndex={editor.slashIndex}
                    query={query}
                    onHoverIndex={editor.setSlashIndex}
                    onSelect={(cmd) =>
                      editor.commands.applySlashCommand(block.id, cmd)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
