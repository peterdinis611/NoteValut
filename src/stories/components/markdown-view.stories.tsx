import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MarkdownView } from "@/components/markdown-view";

const SAMPLE = `---
title: Preview
---

# TanStack Markdown

Parse **once**, render everywhere.

- cache the tree
- index the text
- highlight fences

\`\`\`ts
export const answer = 42;
\`\`\`

> Safe defaults escape raw HTML.

[Docs](https://tanstack.com/markdown/latest)
`;

const meta = {
  title: "Components/MarkdownView",
  component: MarkdownView,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MarkdownView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: SAMPLE,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
        <Story />
      </div>
    ),
  ],
};

export const StreamingPartial: Story = {
  args: {
    streaming: true,
    children: `# Streaming

The model is still typing **bold

\`\`\`ts
const unfinished = `,
  },
  decorators: Default.decorators,
};
