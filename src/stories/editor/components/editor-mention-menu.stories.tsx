import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { sampleNotes } from "../../../../.storybook/fixtures";
import { EditorMentionMenu } from "@/editor/components/editor-mention-menu";

const pages = sampleNotes().filter((n) => n.kind === "page" && !n.archived && !n.trashed);

const meta = {
  title: "Editor/EditorMentionMenu",
  component: EditorMentionMenu,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative max-w-sm p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorMentionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matches: Story = {
  args: {
    pages,
    query: "",
    selectedIndex: 0,
    onHoverIndex: fn(),
    onSelect: fn(),
  },
};

export const Empty: Story = {
  args: {
    pages: [],
    query: "nope",
    selectedIndex: 0,
    onHoverIndex: fn(),
    onSelect: fn(),
  },
};

export const SelectedSecond: Story = {
  args: {
    pages,
    query: "",
    selectedIndex: Math.min(1, Math.max(0, pages.length - 1)),
    onHoverIndex: fn(),
    onSelect: fn(),
  },
};
