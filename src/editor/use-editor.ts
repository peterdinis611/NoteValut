"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createBlock,
  defaultBlocks,
  emptyTable,
  markdownToBlocks,
  matchMarkdownShortcut,
  type Block,
  type BlockType,
} from "@/lib/blocks";
import {
  collectSlashCommands,
  getExtensionForType,
  mergeExtensions,
} from "./create-extension";
import type {
  EditorCommands,
  EditorOptions,
  SlashCommandDef,
} from "./types";
import { loadCustomBlockTemplates } from "./custom-blocks";

export function useEditor(options: EditorOptions) {
  const {
    extensions: rawExtensions,
    content,
    onUpdate,
    readOnly = false,
    linkablePages = [],
    onNavigate,
  } = options;

  const extensions = useMemo(() => mergeExtensions(rawExtensions), [rawExtensions]);
  const [customTick, setCustomTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setCustomTick((n) => n + 1);
    }
    window.addEventListener("nv-custom-blocks-changed", refresh);
    return () => window.removeEventListener("nv-custom-blocks-changed", refresh);
  }, []);

  const slashCommands = useMemo(() => {
    const base = collectSlashCommands(extensions);
    const saved = loadCustomBlockTemplates().map(
      (t): SlashCommandDef => ({
        id: `custom-${t.id}`,
        type: "custom",
        label: t.label,
        description: t.description ?? "Saved custom block",
        icon: t.icon ?? "✦",
        keywords: [t.label.toLowerCase(), "custom", "saved"],
        group: "Yours",
      }),
    );
    return [...base, ...saved];
  }, [extensions, customTick]);

  const [blocks, setBlocks] = useState<Block[]>(
    content.length ? content : defaultBlocks(),
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [slashBlockId, setSlashBlockId] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);

  const focusTarget = useRef<{ id: string; caret: "start" | "end" } | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Sync external content when note changes (by identity of first/last + length heuristic)
  const contentKey = content.map((b) => b.id).join("|");
  useEffect(() => {
    setBlocks(content.length ? content : defaultBlocks());
    setSlashBlockId(null);
  }, [contentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!focusTarget.current) return;
    const { id, caret } = focusTarget.current;
    focusTarget.current = null;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
      if (!el) return;
      el.focus();
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const pos = caret === "start" ? 0 : el.value.length;
        el.setSelectionRange(pos, pos);
      }
    });
  }, [blocks]);

  const commit = useCallback(
    (next: Block[]) => {
      const base = next.length ? next : defaultBlocks();
      const last = base[base.length - 1];
      const endsWithAtom =
        !!last && !!getExtensionForType(extensions, last.type)?.atom;
      const safe = endsWithAtom ? [...base, createBlock("paragraph", "")] : base;
      setBlocks(safe);
      onUpdate(safe);
    },
    [onUpdate, extensions],
  );

  // Notes that already end on an atom get a writable line below on load.
  useEffect(() => {
    if (readOnly) return;
    const list = blocksRef.current;
    const last = list[list.length - 1];
    if (!last || !getExtensionForType(extensions, last.type)?.atom) return;
    commit(list);
  }, [contentKey, readOnly, commit, extensions]);

  const commands: EditorCommands = useMemo(() => {
    const api: EditorCommands = {
      getBlocks: () => blocksRef.current,
      getBlock: (id) => blocksRef.current.find((b) => b.id === id),
      updateBlock: (id, patch) => {
        if (readOnly) return;
        commit(blocksRef.current.map((b) => (b.id === id ? { ...b, ...patch } : b)));
      },
      setBlockType: (id, type, extras) => {
        if (readOnly) return;
        commit(
          blocksRef.current.map((b) =>
            b.id === id
              ? {
                  ...b,
                  type,
                  text: type === "divider" || type === "image" ? b.text : b.text,
                  checked:
                    type === "todo"
                      ? (extras?.checked ?? false)
                      : type === "toggle"
                        ? (extras?.checked ?? true)
                        : undefined,
                  calloutVariant:
                    type === "callout"
                      ? (extras?.calloutVariant ?? "info")
                      : undefined,
                  pageId: type === "pagelink" ? extras?.pageId : undefined,
                  language: type === "code" ? (extras?.language ?? "auto") : undefined,
                  url:
                    type === "image" || type === "video" || type === "link" || type === "pdf"
                      ? extras?.url
                      : undefined,
                  label:
                    type === "custom" || type === "link"
                      ? (extras?.label ?? (type === "custom" ? "Custom block" : undefined))
                      : undefined,
                  rows: type === "table" ? (extras?.rows ?? emptyTable()) : undefined,
                }
              : b,
          ),
        );
      },
      insertBlockAfter: (id, type = "paragraph", text = "") => {
        if (readOnly) return id;
        const index = blocksRef.current.findIndex((b) => b.id === id);
        const newBlock = createBlock(type, text);
        const next = [...blocksRef.current];
        next.splice(index + 1, 0, newBlock);
        focusTarget.current = { id: newBlock.id, caret: "start" };
        commit(next);
        return newBlock.id;
      },
      insertBlockBefore: (id, type = "paragraph") => {
        if (readOnly) return id;
        const index = blocksRef.current.findIndex((b) => b.id === id);
        const newBlock = createBlock(type, "");
        const next = [...blocksRef.current];
        next.splice(Math.max(0, index), 0, newBlock);
        focusTarget.current = { id: newBlock.id, caret: "start" };
        commit(next);
        return newBlock.id;
      },
      deleteBlock: (id) => {
        if (readOnly) return;
        const list = blocksRef.current;
        if (list.length <= 1) {
          commit(defaultBlocks());
          return;
        }
        const index = list.findIndex((b) => b.id === id);
        const prev = list[index - 1] ?? list[index + 1];
        if (prev) focusTarget.current = { id: prev.id, caret: "end" };
        commit(list.filter((b) => b.id !== id));
      },
      moveBlock: (id, direction) => {
        if (readOnly) return;
        const list = [...blocksRef.current];
        const index = list.findIndex((b) => b.id === id);
        const target = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        commit(list);
      },
      focusBlock: (id, caret = "end") => {
        focusTarget.current = { id, caret };
        setFocusedId(id);
        // trigger effect even if blocks unchanged
        setBlocks((b) => [...b]);
      },
      applySlashCommand: (blockId, command) => {
        if (readOnly) return;
        const pages = linkablePages;
        const saved =
          command.id.startsWith("custom-")
            ? loadCustomBlockTemplates().find((t) => `custom-${t.id}` === command.id)
            : undefined;
        commit(
          blocksRef.current.map((b) =>
            b.id !== blockId
              ? b
              : {
                  ...b,
                  type: command.type,
                  text: saved?.body ?? "",
                  checked:
                    command.type === "todo"
                      ? false
                      : command.type === "toggle"
                        ? true
                        : undefined,
                  calloutVariant:
                    command.type === "callout"
                      ? (command.calloutVariant ?? "info")
                      : undefined,
                  pageId:
                    command.type === "pagelink" ? pages[0]?._id : undefined,
                  language: command.type === "code" ? "auto" : undefined,
                  url: undefined,
                  label:
                    command.type === "custom"
                      ? (saved?.label ?? "Custom block")
                      : command.type === "link"
                        ? "Link"
                        : undefined,
                  rows: command.type === "table" ? emptyTable() : undefined,
                },
          ),
        );
        setSlashBlockId(null);
        setSlashIndex(0);
        focusTarget.current = { id: blockId, caret: "start" };
      },
      clearSlash: (blockId) => {
        commit(
          blocksRef.current.map((b) => (b.id === blockId ? { ...b, text: "" } : b)),
        );
        setSlashBlockId(null);
      },
    };
    return api;
  }, [readOnly, commit, linkablePages]);

  function filterSlash(query: string): SlashCommandDef[] {
    const q = query.trim().toLowerCase();
    if (!q) return slashCommands;
    return slashCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.type.includes(q) ||
        cmd.keywords.some((k) => k.includes(q)),
    );
  }

  function parseSlash(text: string) {
    if (!text.startsWith("/")) return { isSlash: false as const, query: "" };
    return { isSlash: true as const, query: text.slice(1) };
  }

  function handleTextChange(block: Block, text: string) {
    if (readOnly) return;

    if (block.type === "paragraph") {
      const shortcut = matchMarkdownShortcut(text);
      if (shortcut) {
        commands.setBlockType(block.id, shortcut.type, {
          ...shortcut.extras,
          ...(shortcut.type === "code" ? { language: "auto" } : {}),
        });
        commands.updateBlock(block.id, { text: shortcut.rest });
        setSlashBlockId(null);
        return;
      }
    }

    commands.updateBlock(block.id, { text });
    const { isSlash } = parseSlash(text);
    if (isSlash) {
      setSlashBlockId(block.id);
      setSlashIndex(0);
    } else if (slashBlockId === block.id) {
      setSlashBlockId(null);
    }
  }

  function handlePasteMarkdown(blockId: string, clipboardText: string): boolean {
    if (readOnly) return false;
    const current = blocksRef.current.find((b) => b.id === blockId);
    if (!current || current.type === "code") return false;

    const looksLikeMd =
      /(^|\n)(#{1,6}\s|```|\|?.+\|.+\n\|?\s*[-:| ]+\||^\s*[-*]\s|\d+\.\s)/m.test(
        clipboardText,
      ) || clipboardText.includes("\n\n");
    if (!looksLikeMd || clipboardText.length < 8) return false;

    const parsed = markdownToBlocks(clipboardText);
    if (parsed.length <= 1 && parsed[0]?.type === "paragraph") return false;

    const list = [...blocksRef.current];
    const index = list.findIndex((b) => b.id === blockId);
    if (index < 0) return false;

    const keepPrefix =
      current.type === "paragraph" && current.text.trim()
        ? [createBlock("paragraph", current.text)]
        : [];
    list.splice(index, 1, ...keepPrefix, ...parsed);
    focusTarget.current = { id: parsed[parsed.length - 1].id, caret: "end" };
    commit(list);
    setSlashBlockId(null);
    return true;
  }

  function handleKeyDown(block: Block, e: React.KeyboardEvent<HTMLElement>) {
    if (readOnly) return;

    const { isSlash, query } = parseSlash(block.text);
    const filtered = isSlash ? filterSlash(query) : [];

    if (slashBlockId === block.id && isSlash) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % Math.max(filtered.length, 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex(
          (i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1),
        );
        return;
      }
      if (e.key === "Enter" && filtered.length) {
        e.preventDefault();
        commands.applySlashCommand(block.id, filtered[slashIndex % filtered.length]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        commands.clearSlash(block.id);
        return;
      }
    }

    // Extension shortcuts (e.g. Mod-Alt-1 → heading)
    const ext = getExtensionForType(extensions, block.type);
    if (ext?.keyboardShortcuts) {
      const mod = e.metaKey || e.ctrlKey;
      const key = [
        mod ? "Mod" : "",
        e.altKey ? "Alt" : "",
        e.shiftKey ? "Shift" : "",
        e.key,
      ]
        .filter(Boolean)
        .join("-");
      const handler = ext.keyboardShortcuts[key] ?? ext.keyboardShortcuts[e.key];
      if (handler?.({ block, event: e, commands })) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && block.type !== "code" && block.type !== "callout") {
      e.preventDefault();
      setSlashBlockId(null);
      const nextType: BlockType =
        block.type === "bullet" || block.type === "todo" || block.type === "numbered"
          ? block.type
          : "paragraph";
      commands.insertBlockAfter(block.id, nextType);
      return;
    }

    if (
      e.key === "Backspace" &&
      !block.text &&
      block.type !== "divider" &&
      block.type !== "pagelink" &&
      block.type !== "table" &&
      block.type !== "video" &&
      block.type !== "link" &&
      block.type !== "image" &&
      block.type !== "pdf"
    ) {
      e.preventDefault();
      setSlashBlockId(null);
      if (block.type !== "paragraph") {
        commands.setBlockType(block.id, "paragraph");
        return;
      }
      commands.deleteBlock(block.id);
      return;
    }

    if (e.key === "ArrowUp" && !isSlash && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commands.moveBlock(block.id, "up");
      return;
    }
    if (e.key === "ArrowDown" && !isSlash && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commands.moveBlock(block.id, "down");
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const el = e.currentTarget;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
      const atEnd =
        el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
      const index = blocksRef.current.findIndex((b) => b.id === block.id);
      if (e.key === "ArrowUp" && atStart && index > 0) {
        e.preventDefault();
        commands.focusBlock(blocksRef.current[index - 1].id, "end");
      }
      if (e.key === "ArrowDown" && atEnd && index < blocksRef.current.length - 1) {
        e.preventDefault();
        commands.focusBlock(blocksRef.current[index + 1].id, "start");
      }
    }
  }

  return {
    blocks,
    extensions,
    commands,
    slashCommands,
    slashBlockId,
    slashIndex,
    setSlashIndex,
    focusedId,
    setFocusedId,
    hoveredId,
    setHoveredId,
    readOnly,
    linkablePages,
    onNavigate,
    filterSlash,
    parseSlash,
    handleTextChange,
    handleKeyDown,
    handlePasteMarkdown,
    getExtension: (type: BlockType) => getExtensionForType(extensions, type),
  };
}

export type EditorInstance = ReturnType<typeof useEditor>;
