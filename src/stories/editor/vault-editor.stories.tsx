import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { createBlock, type Block } from "@/lib/blocks";
import { noteId, sampleBlocks, sampleNotes } from "../../../.storybook/fixtures";
import { VaultEditor } from "@/editor/vault-editor";

function ControlledEditor({
  initial,
  readOnly = false,
  linkablePages,
}: {
  initial: Block[];
  readOnly?: boolean;
  linkablePages?: ReturnType<typeof sampleNotes>;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  return (
    <div className="mx-auto max-w-2xl p-6">
      <VaultEditor
        blocks={blocks}
        onChange={(next) => {
          setBlocks(next);
          fn()(next);
        }}
        readOnly={readOnly}
        linkablePages={linkablePages ?? sampleNotes().filter((n) => n.kind === "page")}
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

const meta = {
  title: "Editor/VaultEditor",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <ControlledEditor initial={sampleBlocks()} />,
};

export const ReadOnly: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-6">
      <VaultEditor blocks={sampleBlocks()} onChange={fn()} readOnly linkablePages={[]} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => <ControlledEditor initial={[createBlock("paragraph", "")]} />,
};

export const WithLinkablePages: Story = {
  render: () => (
    <ControlledEditor
      initial={[
        createBlock("heading1", "Mentions & page links"),
        createBlock("paragraph", "Type @ to mention a page from the sample vault."),
        createBlock("pagelink", "Storybook coverage", {
          pageId: noteId(1),
        }),
      ]}
      linkablePages={sampleNotes()}
    />
  ),
};

export const LongDoc: Story = {
  render: () => <ControlledEditor initial={longDoc} />,
};
