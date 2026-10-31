"use client";

import { Placeholder } from "@tiptap/extensions";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { normalizeEditorContent } from "@/lib/editor/content";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import { toSafeHref } from "@/lib/editor/safe-url";
import { BubbleToolbar } from "./bubble-toolbar";
import { Callout } from "./callout-extension";
import { Column, Columns } from "./columns-extension";
import { SlashCommands } from "./slash-commands";

export function NotionEditor({
  noteId,
  content,
  editable = true,
  spellCheck = true,
  className,
  onChange,
}: {
  noteId: string;
  content: string;
  editable?: boolean;
  spellCheck?: boolean;
  className?: string;
  onChange: (html: string) => void;
}) {
  const activeNoteId = useRef(noteId);
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
        underline: false,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: "nv-editor-highlight",
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "nv-editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https"],
        isAllowedUri: (url) => toSafeHref(url) != null,
        HTMLAttributes: {
          class: "nv-editor-link",
          rel: "noopener noreferrer nofollow",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "nv-editor-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Callout,
      Columns,
      Column,
      Details.configure({
        persist: true,
        HTMLAttributes: {
          class: "nv-editor-toggle",
        },
      }),
      DetailsSummary,
      DetailsContent.configure({
        HTMLAttributes: {
          class: "nv-editor-toggle-content",
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading";
          }
          if (node.type.name === "detailsSummary") {
            return "Toggle title";
          }
          return "Type '/' for commands…";
        },
        includeChildren: true,
      }),
      SlashCommands,
    ],
    content: normalizeEditorContent(content),
    editorProps: {
      attributes: {
        class: "nv-editor focus:outline-none",
        spellcheck: spellCheck ? "true" : "false",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(sanitizeEditorHtml(current.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: "nv-editor focus:outline-none",
          spellcheck: spellCheck ? "true" : "false",
        },
      },
    });
  }, [editor, spellCheck]);

  useEffect(() => {
    if (!editor) return;
    const next = normalizeEditorContent(content);
    const current = editor.getHTML();
    const switchedNote = activeNoteId.current !== noteId;

    if (switchedNote) {
      activeNoteId.current = noteId;
      editor.commands.setContent(next, { emitUpdate: false });
      return;
    }

    if (next === current) return;
    // Avoid clobbering while the user is typing the same note.
    if (editor.isFocused) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [content, editor, noteId]);

  if (!editor) {
    return (
      <div className={className}>
        <div className="min-h-[12rem] animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  return (
    <div className={className}>
      <BubbleToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
