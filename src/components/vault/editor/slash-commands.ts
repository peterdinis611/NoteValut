"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import {
  CalendarDays,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  MessageSquareQuote,
  Minus,
  Quote,
  ShieldCheck,
  SquareCheck,
  Type,
} from "lucide-react";
import { toSafeHref, toSafeSlug } from "@/lib/editor/safe-url";
import {
  SlashCommandList,
  type SlashCommandItem,
  type SlashCommandListRef,
} from "./slash-command-list";

const getSuggestionItems = ({
  query,
}: {
  query: string;
}): SlashCommandItem[] => {
  const items: SlashCommandItem[] = [
    {
      title: "Text",
      description: "Just start writing with plain text.",
      icon: Type,
      group: "Basic blocks",
      keywords: "paragraph plain",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading.",
      icon: Heading1,
      group: "Basic blocks",
      keywords: "h1 title",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading.",
      icon: Heading2,
      group: "Basic blocks",
      keywords: "h2 subtitle",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading.",
      icon: Heading3,
      group: "Basic blocks",
      keywords: "h3",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 3 })
          .run();
      },
    },
    {
      title: "Bullet list",
      description: "Create a simple bullet list.",
      icon: List,
      group: "Basic blocks",
      keywords: "unordered ul",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered list",
      description: "Create a list with numbering.",
      icon: ListOrdered,
      group: "Basic blocks",
      keywords: "ordered ol",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "To-do list",
      description: "Track tasks with a checklist.",
      icon: SquareCheck,
      group: "Basic blocks",
      keywords: "todo task checkbox",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quote.",
      icon: Quote,
      group: "Basic blocks",
      keywords: "blockquote",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Callout",
      description: "Highlighted note or tip block.",
      icon: MessageSquareQuote,
      group: "Basic blocks",
      keywords: "callout tip note info",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "💡 " }],
              },
            ],
          })
          .run();
      },
    },
    {
      title: "Code",
      description: "Capture a code snippet.",
      icon: Code2,
      group: "Basic blocks",
      keywords: "codeblock pre",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Divider",
      description: "Visually divide blocks.",
      icon: Minus,
      group: "Basic blocks",
      keywords: "hr horizontal rule",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Highlight",
      description: "Mark text with a highlight.",
      icon: Highlighter,
      group: "Inline",
      keywords: "mark yellow highlight",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setParagraph()
          .toggleHighlight()
          .insertContent("Highlighted text")
          .run();
      },
    },
    {
      title: "Link",
      description: "Add a safe http(s) link.",
      icon: Link2,
      group: "Inline",
      keywords: "url href anchor",
      command: ({ editor, range }) => {
        const raw = window.prompt("Link URL", "https://");
        if (raw === null) {
          editor.chain().focus().deleteRange(range).run();
          return;
        }
        const href = toSafeHref(raw);
        if (!href) {
          window.alert("Only http(s), /path, or #hash links are allowed.");
          editor.chain().focus().deleteRange(range).run();
          return;
        }
        const label = href.replace(/^https?:\/\//, "");
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "text",
            text: label,
            marks: [{ type: "link", attrs: { href } }],
          })
          .run();
      },
    },
    {
      title: "Safe URL",
      description: "Slugify text into a URL-safe path.",
      icon: ShieldCheck,
      group: "Inline",
      keywords: "slug safe url readonly slugify",
      command: ({ editor, range }) => {
        const raw =
          window.prompt(
            "Text to turn into a safe URL slug",
            "My note title",
          ) ?? "";
        const slug = toSafeSlug(raw);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "text",
            text: slug,
            marks: [{ type: "code" }],
          })
          .run();
      },
    },
    {
      title: "Image",
      description: "Embed an image from a URL.",
      icon: ImageIcon,
      group: "Media",
      keywords: "img picture photo media",
      command: ({ editor, range }) => {
        const raw = window.prompt("Image URL", "https://");
        if (raw === null) {
          editor.chain().focus().deleteRange(range).run();
          return;
        }
        const src = toSafeHref(raw);
        if (!src) {
          window.alert("Only http(s) image URLs are allowed.");
          editor.chain().focus().deleteRange(range).run();
          return;
        }
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setImage({ src, alt: "Image" })
          .run();
      },
    },
    {
      title: "Today",
      description: "Insert today’s date.",
      icon: CalendarDays,
      group: "Media",
      keywords: "date today timestamp",
      command: ({ editor, range }) => {
        const today = new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
        }).format(new Date());
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(today)
          .run();
      },
    },
  ];

  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.keywords ?? "").includes(q) ||
      (item.group ?? "").toLowerCase().includes(q),
  );
};

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        allowSpaces: false,
        allowedPrefixes: null,
        allow: ({
          state,
          range,
        }: {
          state: import("@tiptap/pm/state").EditorState;
          range: Range;
        }) => {
          const $from = state.doc.resolve(range.from);
          const parent = $from.parent;
          if (
            parent.type.name !== "paragraph" &&
            parent.type.name !== "heading"
          ) {
            return false;
          }
          const textBefore = parent.textBetween(
            0,
            $from.parentOffset,
            undefined,
            "\0",
          );
          return textBefore.trim() === "";
        },
        items: ({ query }: { query: string }) => getSuggestionItems({ query }),
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
        render: () => {
          let component: ReactRenderer<SlashCommandListRef> | null = null;
          let unmount: (() => void) | null = null;

          return {
            onStart: (props: SuggestionProps<SlashCommandItem>) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  command: (item: SlashCommandItem) => props.command(item),
                },
                editor: props.editor,
              });
              unmount = props.mount(component.element);
            },
            onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
              component?.updateProps({
                items: props.items,
                command: (item: SlashCommandItem) => props.command(item),
              });
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "Escape") {
                unmount?.();
                unmount = null;
                component?.destroy();
                component = null;
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              unmount = null;
              component?.destroy();
              component = null;
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
