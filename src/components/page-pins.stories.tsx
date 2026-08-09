import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { sampleBlocks } from "../../.storybook/fixtures";
import { PagePins } from "./page-pins";

const meta = {
  title: "Components/PagePins",
  component: PagePins,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PagePins>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    blocks: sampleBlocks(),
    onJump: fn(),
  },
};

export const Empty: Story = {
  render: () => (
    <div className="space-y-2 p-4 text-sm text-muted">
      <p>
        With no pinned blocks, <code className="text-foreground">PagePins</code>{" "}
        returns null — nothing below this note is expected.
      </p>
      <PagePins
        blocks={sampleBlocks().map((b) => ({ ...b, pinned: false }))}
        onJump={fn()}
      />
      <p className="text-xs">End of story.</p>
    </div>
  ),
};
