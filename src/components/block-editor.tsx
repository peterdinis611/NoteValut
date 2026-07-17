"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, GripVertical, Plus } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  type Block,
  type BlockType,
  CALLOUT_STYLES,
  createBlock,
  defaultBlocks,
  filterSlashCommands,
  parseSlashInput,
  type SlashCommand,
} from "@/lib/blocks";
import { SlashMenu } from "./slash-menu";

type Props = {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  linkablePages?: Doc<"notes">[];
  onNavigate?: (id: Id<"notes">) => void;
  readOnly?: boolean;
};

export function BlockEditor({ blocks, onChange, linkablePages = [], onNavigate, readOnly }: Props) {
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const focusBlockId = useRef<string | null>(null);

  useEffect(() => {
    if (!focusBlockId.current) return;
    const el = document.querySelector<HTMLElement>(`[data-block-id="${focusBlockId.current}"]`);
    el?.focus();
    focusBlockId.current = null;
  }, [blocks]);

  function updateBlock(id: string, patch: Partial<Block>) {
    if (readOnly) return;
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function insertBlockAfter(id: string, type: BlockType = "paragraph") {
    if (readOnly) return;
    const index = blocks.findIndex((b) => b.id === id);
    const next = [...blocks];
    const newBlock = createBlock(type, "");
    next.splice(index + 1, 0, newBlock);
    focusBlockId.current = newBlock.id;
    onChange(next);
  }

  function removeBlock(id: string) {
    if (readOnly) return;
    if (blocks.length <= 1) {
      onChange(defaultBlocks());
      return;
    }
    const index = blocks.findIndex((b) => b.id === id);
    const prev = blocks[index - 1];
    if (prev) focusBlockId.current = prev.id;
    onChange(blocks.filter((b) => b.id !== id));
  }

  function applySlashCommand(blockId: string, command: SlashCommand) {
    if (readOnly) return;
    const next = blocks.map((b) => {
      if (b.id !== blockId) return b;
      if (command.type === "divider") {
        return { ...b, type: "divider" as const, text: "" };
      }
      return {
        ...b,
        type: command.type,
        text: "",
        checked: command.type === "todo" ? false : undefined,
        calloutVariant: command.calloutVariant ?? (command.type === "callout" ? "info" : undefined),
        pageId: command.type === "pagelink" ? linkablePages[0]?._id : undefined,
      };
    });
    setActiveSlashBlockId(null);
    setSlashIndex(0);
    focusBlockId.current = blockId;
    onChange(next);
  }

  function handleKeyDown(block: Block, e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (readOnly) return;
    const { isSlash, query } = parseSlashInput(block.text);

    if (activeSlashBlockId === block.id && isSlash) {
      const commands = filterSlashCommands(query);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % Math.max(commands.length, 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + Math.max(commands.length, 1)) % Math.max(commands.length, 1));
        return;
      }
      if (e.key === "Enter" && commands.length) {
        e.preventDefault();
        applySlashCommand(block.id, commands[slashIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setActiveSlashBlockId(null);
        updateBlock(block.id, { text: "" });
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && block.type !== "code" && block.type !== "callout") {
      e.preventDefault();
      insertBlockAfter(block.id);
      setActiveSlashBlockId(null);
      return;
    }

    if (e.key === "Backspace" && !block.text && block.type !== "divider" && block.type !== "pagelink") {
      e.preventDefault();
      removeBlock(block.id);
      setActiveSlashBlockId(null);
    }
  }

  function handleTextChange(block: Block, text: string) {
    if (readOnly) return;
    updateBlock(block.id, { text });
    const { isSlash } = parseSlashInput(text);
    if (isSlash) {
      setActiveSlashBlockId(block.id);
      setSlashIndex(0);
    } else if (activeSlashBlockId === block.id) {
      setActiveSlashBlockId(null);
    }
  }

  return (
    <div className="block-editor">
      {blocks.map((block, index) => {
        const { isSlash, query } = parseSlashInput(block.text);
        const slashCommands = isSlash ? filterSlashCommands(query) : [];
        const isHovered = hoveredId === block.id;
        const isEmpty = !block.text && block.type === "paragraph" && index === blocks.length - 1;

        if (block.type === "divider") {
          return (
            <div
              key={block.id}
              className="block-row group/block"
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <BlockGutter visible={!readOnly && isHovered} onAdd={() => insertBlockAfter(block.id)} />
              <div className="block-content py-3">
                <hr className="block-divider" />
              </div>
            </div>
          );
        }

        if (block.type === "callout") {
          const variant = block.calloutVariant ?? "info";
          const style = CALLOUT_STYLES[variant];
          return (
            <div
              key={block.id}
              className="block-row group/block"
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <BlockGutter visible={!readOnly && isHovered} onAdd={() => insertBlockAfter(block.id)} />
              <div className="block-content relative">
                <div className={`callout-block ${style.class}`}>
                  <span className="callout-icon">{style.icon}</span>
                  <textarea
                    data-block-id={block.id}
                    value={block.text}
                    rows={1}
                    readOnly={readOnly}
                    className="block-input callout-input"
                    placeholder="Callout text…"
                    onChange={(e) => handleTextChange(block, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(block, e)}
                  />
                </div>
                {activeSlashBlockId === block.id && isSlash && (
                  <SlashMenuPopup
                    commands={slashCommands}
                    slashIndex={slashIndex}
                    onSelect={(cmd) => applySlashCommand(block.id, cmd)}
                  />
                )}
              </div>
            </div>
          );
        }

        if (block.type === "pagelink") {
          const linked = linkablePages.find((p) => p._id === block.pageId);
          return (
            <div
              key={block.id}
              className="block-row group/block"
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <BlockGutter visible={!readOnly && isHovered} onAdd={() => insertBlockAfter(block.id)} />
              <div className="block-content">
                <div className="pagelink-block">
                  <select
                    className="pagelink-select"
                    disabled={readOnly}
                    value={block.pageId ?? ""}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        pageId: e.target.value || undefined,
                        text: linkablePages.find((p) => p._id === e.target.value)?.title ?? block.text,
                      })
                    }
                  >
                    <option value="">Select entry…</option>
                    {linkablePages.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.icon} {p.title || "Untitled"}
                      </option>
                    ))}
                  </select>
                  {linked && onNavigate && (
                    <button type="button" className="pagelink-open" onClick={() => onNavigate(linked._id)}>
                      <span>{linked.icon}</span>
                      <span className="truncate">{linked.title || "Untitled"}</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            className="block-row group/block"
            onMouseEnter={() => setHoveredId(block.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <BlockGutter visible={!readOnly && isHovered} onAdd={() => insertBlockAfter(block.id)} />
            <div className="block-content relative">
              <div className={`flex items-start gap-1.5 ${block.type === "todo" && block.checked ? "opacity-50" : ""}`}>
                {block.type === "todo" && (
                  <input
                    type="checkbox"
                    checked={!!block.checked}
                    onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
                    className="block-checkbox"
                  />
                )}
                {block.type === "bullet" && <span className="block-bullet">•</span>}

                <BlockInput
                  block={block}
                  readOnly={readOnly}
                  data-block-id={block.id}
                  onChange={(text) => handleTextChange(block, text)}
                  onKeyDown={(e) => handleKeyDown(block, e)}
                />
              </div>

              {isEmpty && !isSlash && (
                <p className="block-hint">Press Enter for a new block, or type / for commands</p>
              )}

              {activeSlashBlockId === block.id && isSlash && (
                <SlashMenuPopup
                  commands={slashCommands}
                  slashIndex={slashIndex}
                  onSelect={(cmd) => applySlashCommand(block.id, cmd)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SlashMenuPopup({
  commands,
  slashIndex,
  onSelect,
}: {
  commands: SlashCommand[];
  slashIndex: number;
  onSelect: (cmd: SlashCommand) => void;
}) {
  return (
    <div className="absolute left-0 top-full z-20 mt-1">
      <SlashMenu commands={commands} selectedIndex={slashIndex} onSelect={onSelect} />
    </div>
  );
}

function BlockGutter({ visible, onAdd }: { visible: boolean; onAdd: () => void }) {
  return (
    <div className={`block-gutter ${visible ? "block-gutter-visible" : ""}`}>
      <button type="button" className="block-gutter-btn" aria-label="Add block" onClick={onAdd}>
        <Plus className="size-4" />
      </button>
      <span className="block-gutter-grip" aria-hidden>
        <GripVertical className="size-3.5" />
      </span>
    </div>
  );
}

function BlockInput({
  block,
  onChange,
  onKeyDown,
  readOnly,
  ...props
}: {
  block: Block;
  onChange: (text: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  "data-block-id"?: string;
}) {
  const shared = {
    value: block.text,
    readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    onKeyDown,
    placeholder:
      block.type === "paragraph"
        ? "Type '/' for commands"
        : block.type === "heading1"
          ? "Title"
          : block.type === "heading2"
            ? "Section"
            : block.type === "heading3"
              ? "Subsection"
              : "",
    ...props,
  };

  if (block.type === "code") {
    return (
      <textarea
        {...shared}
        rows={Math.max(3, block.text.split("\n").length)}
        className="block-input block-input-code"
        spellCheck={false}
      />
    );
  }

  if (block.type === "paragraph" || block.type === "quote" || block.type === "bullet" || block.type === "todo") {
    return <textarea {...shared} rows={1} className={`block-input block-input-${block.type}`} />;
  }

  return <input type="text" {...shared} className={`block-input block-input-${block.type}`} />;
}
