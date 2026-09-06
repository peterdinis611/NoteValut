import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import { sampleBlocks } from "../../../.storybook/fixtures";
import { TableOfContents } from "@/components/table-of-contents";

const meta = {
  title: "Components/TableOfContents",
  component: TableOfContents,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    blocks: sampleBlocks(),
    onJump: fn(),
  },
};

export const TooFewHeadings: Story = {
  render: () => (
    <div className="space-y-2 p-4 text-sm text-muted">
      <p>
        Fewer than two headings → <code className="text-foreground">TableOfContents</code> returns
        null.
      </p>
      <TableOfContents
        blocks={[createBlock("heading1", "Only heading"), createBlock("paragraph", "Body text")]}
        onJump={fn()}
      />
      <p className="text-xs">End of story.</p>
    </div>
  ),
};

export const DeepHeadings: Story = {
  args: {
    blocks: [
      createBlock("heading1", "Level 1"),
      createBlock("heading2", "Level 2"),
      createBlock("heading3", "Level 3"),
      createBlock("heading4", "Level 4"),
      createBlock("heading5", "Level 5"),
      createBlock("heading6", "Level 6"),
      createBlock("paragraph", "Body under deep headings."),
    ],
    onJump: fn(),
  },
};
