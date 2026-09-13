import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { SlashCommandDef } from "@/editor/types";
import { EditorSlashMenu } from "@/editor/components/editor-slash-menu";

const sampleCommands: SlashCommandDef[] = [
  {
    id: "paragraph",
    type: "paragraph",
    label: "Text",
    description: "Plain text block",
    icon: "¶",
    keywords: ["text", "paragraph", "p"],
    group: "Basic",
  },
  {
    id: "heading1",
    type: "heading1",
    label: "Title",
    description: "Large heading",
    icon: "H1",
    keywords: ["h1", "title", "heading"],
    group: "Basic",
  },
  {
    id: "heading2",
    type: "heading2",
    label: "Heading",
    description: "Section heading",
    icon: "H2",
    keywords: ["h2", "heading"],
    group: "Basic",
  },
  {
    id: "heading3",
    type: "heading3",
    label: "Subheading",
    description: "Smaller heading",
    icon: "H3",
    keywords: ["h3", "subheading"],
    group: "Basic",
  },
  {
    id: "todo",
    type: "todo",
    label: "To-do",
    description: "Checkbox item",
    icon: "☑",
    keywords: ["todo", "task", "checkbox"],
    group: "Lists",
  },
  {
    id: "bullet",
    type: "bullet",
    label: "Bullet list",
    description: "Unordered list",
    icon: "•",
    keywords: ["bullet", "ul", "list"],
    group: "Lists",
  },
  {
    id: "numbered",
    type: "numbered",
    label: "Numbered list",
    description: "Ordered list",
    icon: "1.",
    keywords: ["numbered", "ol", "list"],
    group: "Lists",
  },
  {
    id: "code",
    type: "code",
    label: "Code",
    description: "Code block with highlighting",
    icon: "</>",
    keywords: ["code", "snippet"],
    group: "Basic",
  },
  {
    id: "quote",
    type: "quote",
    label: "Quote",
    description: "Quoted text",
    icon: "❝",
    keywords: ["quote", "blockquote"],
    group: "Basic",
  },
  {
    id: "callout-info",
    type: "callout",
    label: "Info box",
    description: "Info callout",
    icon: "ℹ",
    keywords: ["callout", "info"],
    calloutVariant: "info",
    group: "Callouts",
  },
  {
    id: "callout-tip",
    type: "callout",
    label: "Tip box",
    description: "Helpful tip",
    icon: "💡",
    keywords: ["tip", "hint"],
    calloutVariant: "tip",
    group: "Callouts",
  },
  {
    id: "image",
    type: "image",
    label: "Image",
    description: "Upload or embed an image",
    icon: "🖼",
    keywords: ["image", "photo", "picture"],
    group: "Media",
  },
  {
    id: "table",
    type: "table",
    label: "Table",
    description: "Rows and columns",
    icon: "▦",
    keywords: ["table", "grid"],
    group: "Media",
  },
  {
    id: "video",
    type: "video",
    label: "Video",
    description: "Embed a video",
    icon: "🎬",
    keywords: ["video", "film"],
    group: "Media",
  },
  {
    id: "divider",
    type: "divider",
    label: "Divider",
    description: "Visual separator",
    icon: "—",
    keywords: ["divider", "hr", "line"],
    group: "Media",
  },
  {
    id: "toggle",
    type: "toggle",
    label: "Toggle",
    description: "Collapsible section",
    icon: "▸",
    keywords: ["toggle", "collapse"],
    group: "Basic",
  },
];

const meta = {
  title: "Editor/EditorSlashMenu",
  component: EditorSlashMenu,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative max-w-sm p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorSlashMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    commands: sampleCommands,
    selectedIndex: 0,
    onSelect: fn(),
    onHoverIndex: fn(),
  },
};

export const Filtered: Story = {
  args: {
    commands: sampleCommands.filter(
      (c) => c.keywords.some((k) => k.includes("head")) || c.label.toLowerCase().includes("head"),
    ),
    query: "head",
    selectedIndex: 0,
    onSelect: fn(),
    onHoverIndex: fn(),
  },
};

export const Empty: Story = {
  args: {
    commands: [],
    query: "zzzz",
    selectedIndex: 0,
    onSelect: fn(),
  },
};
