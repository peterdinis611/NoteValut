import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { createBlock, type Block } from "@/lib/blocks";
import { sampleBlocks, sampleNotes } from "../../.storybook/fixtures";
import { BlockEditor } from "./block-editor";

function ControlledEditor({ initial }: { initial: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  return (
    <div className="mx-auto max-w-2xl p-6">
      <BlockEditor
        blocks={blocks}
        onChange={(next) => {
          setBlocks(next);
          fn()(next);
        }}
        linkablePages={sampleNotes().filter((n) => n.kind === "page")}
        onNavigate={fn()}
      />
    </div>
  );
}

const longDoc: Block[] = [
  createBlock("heading1", "Long document"),
  createBlock("paragraph", "Opening paragraph with context for a denser story."),
  createBlock("heading2", "Section one"),
  createBlock("bullet", "First point"),
  createBlock("bullet", "Second point"),
  createBlock("bullet", "Third point"),
  createBlock("heading2", "Section two"),
  createBlock("numbered", "Step A"),
  createBlock("numbered", "Step B"),
  createBlock("numbered", "Step C"),
  createBlock("todo", "Track progress", { checked: false }),
  createBlock("todo", "Ship stories", { checked: true }),
  createBlock("heading3", "Details"),
  createBlock("quote", "A longer quote to stretch vertical space."),
  createBlock("paragraph", "Closing thoughts and another paragraph."),
  createBlock("code", "export const n = 42;", { language: "ts" }),
  createBlock("divider", ""),
  createBlock("paragraph", "After the divider."),
];

const calloutsAndMedia: Block[] = [
  createBlock("heading1", "Callouts & media"),
  createBlock("callout", "Info callout for context.", { calloutVariant: "info" }),
  createBlock("callout", "Tip: keep media captions short.", { calloutVariant: "tip" }),
  createBlock("callout", "Watch for broken image URLs.", { calloutVariant: "warning" }),
  createBlock("image", "Sample photo", {
    url: "https://picsum.photos/seed/notevault-editor/1000/560",
    width: 90,
    align: "center",
  }),
  createBlock("code", "const ok = true;", { language: "javascript" }),
  createBlock("table", "", {
    rows: [
      ["Col A", "Col B"],
      ["One", "Two"],
    ],
  }),
  createBlock("divider", ""),
  createBlock("video", "Demo", { url: "https://www.w3schools.com/html/mov_bbb.mp4" }),
];

const meta = {
  title: "Components/BlockEditor",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "BlockEditor is a deprecated alias of VaultEditor (`@/editor/vault-editor`). Prefer Editor/VaultEditor stories for new coverage.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <ControlledEditor initial={sampleBlocks()} />,
};

export const ReadOnly: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-6">
      <BlockEditor
        blocks={sampleBlocks()}
        onChange={fn()}
        readOnly
        linkablePages={[]}
      />
    </div>
  ),
};

export const EmptyDoc: Story = {
  render: () => <ControlledEditor initial={[createBlock("paragraph", "")]} />,
};

export const LongDoc: Story = {
  render: () => <ControlledEditor initial={longDoc} />,
};

export const CalloutsAndMedia: Story = {
  render: () => <ControlledEditor initial={calloutsAndMedia} />,
};
