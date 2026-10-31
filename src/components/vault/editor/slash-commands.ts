"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Code2,
  Columns2,
  Columns3,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  ImageIcon,
  Info,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  ListTree,
  Minus,
  Quote,
  ShieldAlert,
  ShieldCheck,
  SquareCheck,
  Table2,
  TriangleAlert,
  Type,
} from "lucide-react";
import { toSafeHref, toSafeSlug } from "@/lib/editor/safe-url";
import { insertCallout } from "./callout-extension";
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
      title: "Heading 4",
      description: "Tiny section label.",
      icon: Heading4,
      group: "Basic blocks",
      keywords: "h4 label",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 4 })
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
      title: "Toggle list",
      description: "Collapsible section you can open and close.",
      icon: ListTree,
      group: "Basic blocks",
      keywords: "toggle details collapse accordion",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setDetails().run();
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
      title: "Info callout",
      description: "Neutral note or context block.",
      icon: Info,
      group: "Callouts",
      keywords: "callout info note",
      command: ({ editor, range }) => insertCallout(editor, range, "info"),
    },
    {
      title: "Tip callout",
      description: "Helpful tip or idea.",
      icon: Lightbulb,
      group: "Callouts",
      keywords: "callout tip idea hint",
      command: ({ editor, range }) => insertCallout(editor, range, "tip"),
    },
    {
      title: "Warning callout",
      description: "Caution or important warning.",
      icon: TriangleAlert,
      group: "Callouts",
      keywords: "callout warn warning caution",
      command: ({ editor, range }) => insertCallout(editor, range, "warning"),
    },
    {
      title: "Danger callout",
      description: "Critical alert or risk.",
      icon: ShieldAlert,
      group: "Callouts",
      keywords: "callout danger alert error critical",
      command: ({ editor, range }) => insertCallout(editor, range, "danger"),
    },
    {
      title: "Table",
      description: "Insert a 3×3 table.",
      icon: Table2,
      group: "Advanced",
      keywords: "grid spreadsheet matrix",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      title: "2 columns",
      description: "Side-by-side layout.",
      icon: Columns2,
      group: "Advanced",
      keywords: "columns two split layout",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setColumns(2).run();
      },
    },
    {
      title: "3 columns",
      description: "Three-column layout.",
      icon: Columns3,
      group: "Advanced",
      keywords: "columns three split layout",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setColumns(3).run();
      },
    },
    {
      title: "Checklist starter",
      description: "Three empty to-dos ready to fill.",
      icon: CheckSquare,
      group: "Advanced",
      keywords: "todo template checklist starter",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph" }],
              },
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph" }],
              },
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph" }],
              },
            ],
          })
          .run();
      },
    },
    {
      title: "Align left",
      description: "Left-align this block.",
      icon: AlignLeft,
      group: "Layout",
      keywords: "align left",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setTextAlign("left").run();
      },
    },
    {
      title: "Align center",
      description: "Center this block.",
      icon: AlignCenter,
      group: "Layout",
      keywords: "align center middle",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setTextAlign("center").run();
      },
    },
    {
      title: "Align right",
      description: "Right-align this block.",
      icon: AlignRight,
      group: "Layout",
      keywords: "align right",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setTextAlign("right").run();
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
      title: "Bookmark",
      description: "Paste a URL as a linked bookmark card.",
      icon: Link2,
      group: "Media",
      keywords: "bookmark card link preview",
      command: ({ editor, range }) => {
        const raw = window.prompt("Bookmark URL", "https://");
        if (raw === null) {
          editor.chain().focus().deleteRange(range).run();
          return;
        }
        const href = toSafeHref(raw);
        if (!href) {
          window.alert("Only http(s) URLs are allowed.");
          editor.chain().focus().deleteRange(range).run();
          return;
        }
        let host = href;
        try {
          host = new URL(href).hostname.replace(/^www\./, "");
        } catch {
          /* keep href */
        }
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "blockquote",
            attrs: {},
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `🔖 ${host}`,
                    marks: [{ type: "link", attrs: { href } }],
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: href,
                    marks: [{ type: "code" }],
                  },
                ],
              },
            ],
          })
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
        editor.chain().focus().deleteRange(range).insertContent(today).run();
      },
    },
    {
      title: "Now",
      description: "Insert date and time.",
      icon: CalendarClock,
      group: "Media",
      keywords: "datetime now timestamp time",
      command: ({ editor, range }) => {
        const stamp = new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date());
        editor.chain().focus().deleteRange(range).insertContent(stamp).run();
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
