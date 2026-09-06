import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import type { Block, BlockType } from "@/lib/blocks";
import {
  blockRenderProps,
  pageLinkBlock,
  sampleBlock,
} from "../../../../.storybook/story-utils/block-props";
import { noteId } from "../../../../.storybook/fixtures";
import { StarterKit } from "@/editor/extensions/index";
import type { Extension } from "@/editor/types";

function findExt(type: BlockType): Extension {
  const ext = StarterKit.find((e) => e.types?.includes(type));
  if (!ext) throw new Error(`No StarterKit extension for type: ${type}`);
  return ext;
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-2 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="rounded-lg border border-border bg-panel/40 p-4">{children}</div>
    </div>
  );
}

function renderExt(type: BlockType, block: Block, label?: string) {
  const ext = findExt(type);
  return <Panel label={label ?? ext.name}>{ext.render(blockRenderProps(block))}</Panel>;
}

const meta = {
  title: "Editor/ExtensionBlocks",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Paragraph: Story = {
  render: () => renderExt("paragraph", sampleBlock("paragraph", "A plain paragraph.")),
};

export const Heading1: Story = {
  render: () => renderExt("heading1", sampleBlock("heading1", "Heading one")),
};

export const Heading2: Story = {
  render: () => renderExt("heading2", sampleBlock("heading2", "Heading two")),
};

export const Heading3: Story = {
  render: () => renderExt("heading3", sampleBlock("heading3", "Heading three")),
};

export const Heading4: Story = {
  render: () => renderExt("heading4", sampleBlock("heading4", "Heading four")),
};

export const Heading5: Story = {
  render: () => renderExt("heading5", sampleBlock("heading5", "Heading five")),
};

export const Heading6: Story = {
  render: () => renderExt("heading6", sampleBlock("heading6", "Heading six")),
};

export const TodoChecked: Story = {
  render: () =>
    renderExt("todo", sampleBlock("todo", "Done item", { checked: true }), "todo (checked)"),
};

export const TodoUnchecked: Story = {
  render: () =>
    renderExt("todo", sampleBlock("todo", "Open item", { checked: false }), "todo (unchecked)"),
};

export const Bullet: Story = {
  render: () => renderExt("bullet", sampleBlock("bullet", "Bullet list item")),
};

export const Numbered: Story = {
  render: () => renderExt("numbered", sampleBlock("numbered", "Numbered list item")),
};

export const Quote: Story = {
  render: () => renderExt("quote", sampleBlock("quote", "A short pull quote.")),
};

export const Code: Story = {
  render: () =>
    renderExt("code", sampleBlock("code", "const accent = '#e2a45a';", { language: "ts" })),
};

export const CalloutInfo: Story = {
  render: () =>
    renderExt(
      "callout",
      sampleBlock("callout", "Informational callout.", { calloutVariant: "info" }),
      "callout (info)",
    ),
};

export const CalloutTip: Story = {
  render: () =>
    renderExt(
      "callout",
      sampleBlock("callout", "Helpful tip callout.", { calloutVariant: "tip" }),
      "callout (tip)",
    ),
};

export const CalloutWarning: Story = {
  render: () =>
    renderExt(
      "callout",
      sampleBlock("callout", "Warning callout.", { calloutVariant: "warning" }),
      "callout (warning)",
    ),
};

export const Divider: Story = {
  render: () => renderExt("divider", sampleBlock("divider", "")),
};

export const PageLink: Story = {
  render: () => renderExt("pagelink", pageLinkBlock()),
};

export const Image: Story = {
  render: () =>
    renderExt(
      "image",
      sampleBlock("image", "Sample photo", {
        url: "https://picsum.photos/seed/notevault-ext/800/420",
        width: 90,
        align: "center",
      }),
    ),
};

export const Video: Story = {
  render: () =>
    renderExt(
      "video",
      sampleBlock("video", "Demo clip", {
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
      }),
    ),
};

export const Pdf: Story = {
  render: () =>
    renderExt(
      "pdf",
      sampleBlock("pdf", "Sample PDF", {
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      }),
    ),
};

export const File: Story = {
  render: () =>
    renderExt(
      "file",
      sampleBlock("file", "notes.txt", {
        url: "https://example.com/notes.txt",
        label: "notes.txt",
      }),
    ),
};

export const Table: Story = {
  render: () =>
    renderExt(
      "table",
      sampleBlock("table", "", {
        rows: [
          ["Name", "Status"],
          ["Storybook", "Done"],
          ["Coverage", "In progress"],
        ],
      }),
    ),
};

export const Toggle: Story = {
  render: () => renderExt("toggle", sampleBlock("toggle", "Collapsed section", { checked: true })),
};

export const WebLink: Story = {
  render: () =>
    renderExt(
      "link",
      sampleBlock("link", "NoteVault", {
        url: "https://example.com",
        label: "NoteVault",
      }),
      "link (web)",
    ),
};

export const Custom: Story = {
  render: () =>
    renderExt("custom", sampleBlock("custom", "Custom block body", { label: "My custom block" })),
};

/** Bonus: all StarterKit typed extensions in one scrollable gallery. */
export const Gallery: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      {StarterKit.filter((e) => e.types?.length).map((ext) => {
        const type = ext.types![0];
        let block: Block;
        switch (type) {
          case "todo":
            block = sampleBlock("todo", "Gallery todo", { checked: false });
            break;
          case "callout":
            block = sampleBlock("callout", "Gallery callout", {
              calloutVariant: "info",
            });
            break;
          case "pagelink":
            block = pageLinkBlock();
            break;
          case "image":
            block = sampleBlock("image", "Gallery", {
              url: "https://picsum.photos/seed/gallery/640/320",
            });
            break;
          case "video":
            block = sampleBlock("video", "", {
              url: "https://www.w3schools.com/html/mov_bbb.mp4",
            });
            break;
          case "pdf":
            block = sampleBlock("pdf", "PDF", {
              url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            });
            break;
          case "file":
            block = sampleBlock("file", "file.bin", { url: "https://example.com/f" });
            break;
          case "link":
            block = sampleBlock("link", "Link", {
              url: "https://example.com",
              label: "example.com",
            });
            break;
          case "table":
            block = sampleBlock("table", "", {
              rows: [
                ["A", "B"],
                ["1", "2"],
              ],
            });
            break;
          case "code":
            block = sampleBlock("code", "console.log(1)", { language: "js" });
            break;
          case "custom":
            block = sampleBlock("custom", "Body", { label: "Custom" });
            break;
          case "divider":
            block = sampleBlock("divider", "");
            break;
          default:
            block = sampleBlock(type, `${type} sample`);
        }
        return (
          <Panel key={ext.name} label={ext.name}>
            {ext.render(blockRenderProps(block))}
          </Panel>
        );
      })}
      <p className="sr-only">pageId fixture {String(noteId(1))}</p>
    </div>
  ),
};
