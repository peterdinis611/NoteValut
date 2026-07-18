"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bookmark, GripVertical, Paintbrush, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { clampIndent, type Block } from "@/lib/blocks";
import { mediaKindFromFile, useVaultUpload } from "@/hooks/use-vault-upload";
import { StarterKit } from "./extensions";
import type { Extension } from "./types";
import { useEditor } from "./use-editor";
import { BlockToolbar, canColorBlock } from "./components/block-toolbar";
import { EditorMentionMenu } from "./components/editor-mention-menu";
import { EditorSlashMenu } from "./components/editor-slash-menu";
import { useToast } from "@/components/toast";

type Props = {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  extensions?: Extension[];
  linkablePages?: Doc<"notes">[];
  onNavigate?: (id: Id<"notes">) => void;
  readOnly?: boolean;
  placeholder?: string;
};

export function VaultEditor({
  blocks,
  onChange,
  extensions = StarterKit,
  linkablePages = [],
  onNavigate,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const { uploadFile } = useVaultUpload();
  const editor = useEditor({
    extensions,
    content: blocks,
    onUpdate: onChange,
    readOnly,
    linkablePages,
    onNavigate,
  });
  const [colorToolbarId, setColorToolbarId] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);

  useEffect(() => {
    if (colorToolbarId && editor.focusedId !== colorToolbarId) {
      setColorToolbarId(null);
    }
  }, [editor.focusedId, colorToolbarId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    editor.commands.reorderBlocks(String(active.id), String(over.id));
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (readOnly) return;
    const files = [...fileList];
    if (!files.length) return;
    const anchor =
      editor.focusedId ?? editor.blocks[editor.blocks.length - 1]?.id;
    if (!anchor) return;

    let afterId = anchor;
    for (const file of files) {
      const kind = mediaKindFromFile(file);
      if (!kind) {
        toast.error(`Unsupported file: ${file.name}`);
        continue;
      }
      try {
        const uploaded = await uploadFile(file);
        const title =
          kind === "file" ? file.name : file.name.replace(/\.[^.]+$/, "");
        const id = editor.commands.insertBlockAfter(afterId, kind, title);
        editor.commands.updateBlock(id, { url: uploaded.url });
        afterId = id;
        toast.success(`Uploaded ${file.name}`);
      } catch {
        toast.error(`Couldn’t upload ${file.name}`);
      }
    }
  }

  return (
    <div
      className={`nv-editor ${readOnly ? "nv-editor-readonly" : ""} ${draggingOver ? "nv-editor-drop" : ""}`}
      onDragEnter={(e) => {
        if (readOnly) return;
        if ([...e.dataTransfer.types].includes("Files")) setDraggingOver(true);
      }}
      onDragOver={(e) => {
        if (readOnly) return;
        if ([...e.dataTransfer.types].includes("Files")) {
          e.preventDefault();
          setDraggingOver(true);
        }
      }}
      onDragLeave={() => setDraggingOver(false)}
      onDrop={(e) => {
        if (readOnly) return;
        if (!e.dataTransfer.files?.length) return;
        e.preventDefault();
        setDraggingOver(false);
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={editor.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
          disabled={readOnly}
        >
          {groupEditorBlocks(editor.blocks).map((group) => {
            if (group.kind === "columns") {
              const cols = group.blocks[0]?.columnCount ?? group.blocks.length;
              return (
                <div
                  key={group.blocks[0].layoutGroupId}
                  className="nv-columns"
                  style={{ "--nv-cols": cols } as CSSProperties}
                >
                  {group.blocks.map((block) => {
                    const index = editor.blocks.findIndex((b) => b.id === block.id);
                    return (
                      <div key={block.id} className="nv-column">
                        <SortableBlockRow
                          block={block}
                          index={index}
                          editor={editor}
                          readOnly={readOnly}
                          colorToolbarId={colorToolbarId}
                          setColorToolbarId={setColorToolbarId}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            }
            const block = group.blocks[0];
            const index = editor.blocks.findIndex((b) => b.id === block.id);
            return (
              <SortableBlockRow
                key={block.id}
                block={block}
                index={index}
                editor={editor}
                readOnly={readOnly}
                colorToolbarId={colorToolbarId}
                setColorToolbarId={setColorToolbarId}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {!readOnly && (
        <button
          type="button"
          className="nv-editor-continue"
          aria-label="Continue writing"
          onClick={() => {
            const list = editor.blocks;
            const last = list[list.length - 1];
            if (!last) return;
            if (editor.getExtension(last.type)?.atom || last.type !== "paragraph") {
              editor.commands.insertBlockAfter(last.id, "paragraph");
              return;
            }
            editor.commands.focusBlock(last.id, "end");
          }}
        />
      )}

      {draggingOver && !readOnly && (
        <div className="nv-editor-drop-hint">Drop images, PDFs, or videos</div>
      )}
    </div>
  );
}

function SortableBlockRow({
  block,
  index,
  editor,
  readOnly,
  colorToolbarId,
  setColorToolbarId,
}: {
  block: Block;
  index: number;
  editor: ReturnType<typeof useEditor>;
  readOnly: boolean;
  colorToolbarId: string | null;
  setColorToolbarId: (id: string | null | ((prev: string | null) => string | null)) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: readOnly,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : undefined,
    paddingLeft: clampIndent(block.indent) * 1.25 + "rem",
  };

  const ext = editor.getExtension(block.type);
  const { isSlash, query } = editor.parseSlash(block.text);
  const slashOpen = editor.slashBlockId === block.id && isSlash;
  const slashCmds = slashOpen ? editor.filterSlash(query) : [];
  const { isMention, query: mentionQuery } = editor.parseMention(block.text);
  const mentionOpen = editor.mentionBlockId === block.id && isMention;
  const mentionPages = mentionOpen ? editor.filterMentions(mentionQuery) : [];
  const isHovered = editor.hoveredId === block.id;
  const isFocused = editor.focusedId === block.id;
  const showChrome = isHovered || isFocused;
  const canColor = !readOnly && canColorBlock(block.type);
  const showToolbar = canColor && colorToolbarId === block.id && !slashOpen && !mentionOpen;
  const isEmptyHint =
    !readOnly &&
    !block.text &&
    block.type === "paragraph" &&
    index === editor.blocks.length - 1 &&
    !isSlash &&
    !isMention;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`nv-row ${isFocused ? "nv-row-focused" : ""} ${isDragging ? "nv-row-dragging" : ""} ${isEmptyHint ? "nv-row-empty" : ""} ${block.pinned ? "nv-row-pinned" : ""}`}
      onMouseEnter={() => editor.setHoveredId(block.id)}
      onMouseLeave={() => editor.setHoveredId(null)}
    >
      {!readOnly && (
        <div className={`nv-gutter ${showChrome ? "nv-gutter-visible" : ""}`} role="toolbar" aria-label="Block actions">
          <button
            type="button"
            className="nv-gutter-btn"
            aria-label="Add block"
            title="Add block below"
            onClick={() => editor.commands.insertBlockAfter(block.id)}
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            className="nv-gutter-btn nv-gutter-grip"
            aria-label="Drag block"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3.5" />
          </button>
          <span className="nv-gutter-sep" aria-hidden />
          {canColor && (
            <button
              type="button"
              className={`nv-gutter-btn ${showToolbar ? "nv-gutter-btn-active" : ""}`}
              aria-label="Text color"
              aria-expanded={showToolbar}
              title="Text & fill color"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.setFocusedId(block.id);
                setColorToolbarId((id) => (id === block.id ? null : block.id));
              }}
            >
              <Paintbrush className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            className={`nv-gutter-btn ${block.pinned ? "nv-gutter-btn-active" : ""}`}
            aria-label={block.pinned ? "Unpin block" : "Pin block"}
            title={block.pinned ? "Unpin bookmark" : "Bookmark on this page"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.commands.updateBlock(block.id, { pinned: !block.pinned })
            }
          >
            <Bookmark className={`size-3.5 ${block.pinned ? "fill-current" : ""}`} />
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
            onColor={(color) => editor.commands.updateBlock(block.id, { color })}
            onBgColor={(bgColor) => editor.commands.updateBlock(block.id, { bgColor })}
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
            linkablePages: editor.linkablePages,
            onNavigate: editor.onNavigate,
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
          <div className="nv-hint" aria-hidden>
            <span className="nv-hint-chip">
              <kbd>/</kbd> commands
            </span>
            <span className="nv-hint-chip">
              <kbd>[[</kbd> link page
            </span>
            <span className="nv-hint-chip">drop files</span>
            <span className="nv-hint-chip">paste markdown</span>
          </div>
        )}

        {slashOpen && (
          <div className="nv-slash-anchor">
            <EditorSlashMenu
              commands={slashCmds}
              selectedIndex={editor.slashIndex}
              query={query}
              onHoverIndex={editor.setSlashIndex}
              onSelect={(cmd) => editor.commands.applySlashCommand(block.id, cmd)}
            />
          </div>
        )}

        {mentionOpen && (
          <div className="nv-slash-anchor">
            <EditorMentionMenu
              pages={mentionPages}
              query={mentionQuery}
              selectedIndex={editor.mentionIndex}
              onHoverIndex={editor.setMentionIndex}
              onSelect={(page) =>
                editor.commands.applyMention(block.id, page._id, page.title || "Untitled")
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function groupEditorBlocks(blocks: Block[]) {
  const groups: { kind: "single" | "columns"; blocks: Block[] }[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.layoutGroupId) {
      const gid = block.layoutGroupId;
      const chunk: Block[] = [];
      while (i < blocks.length && blocks[i].layoutGroupId === gid) {
        chunk.push(blocks[i]);
        i += 1;
      }
      groups.push({ kind: "columns", blocks: chunk });
    } else {
      groups.push({ kind: "single", blocks: [block] });
      i += 1;
    }
  }
  return groups;
}
