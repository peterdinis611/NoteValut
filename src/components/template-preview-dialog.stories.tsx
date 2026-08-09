import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlock } from "@/lib/blocks";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { TemplatePreviewDialog } from "./template-preview-dialog";

const blank = PAGE_TEMPLATES.find((t) => t.id === "blank")!;
const standup = PAGE_TEMPLATES.find((t) => t.id === "standup")!;
const meeting = PAGE_TEMPLATES.find((t) => t.id === "meeting")!;

const meta = {
  title: "Components/TemplatePreviewDialog",
  component: TemplatePreviewDialog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TemplatePreviewDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Meeting: Story = {
  args: {
    template: {
      ...meeting,
      builtIn: true,
    },
    onClose: fn(),
  },
};

export const Blank: Story = {
  args: {
    template: {
      ...blank,
      builtIn: true,
    },
    onClose: fn(),
  },
};

export const Standup: Story = {
  args: {
    template: {
      ...standup,
      builtIn: true,
    },
    onClose: fn(),
  },
};

export const Custom: Story = {
  args: {
    template: {
      id: "custom-story",
      name: "Custom sprint plan",
      icon: "🚀",
      description: "User-authored template",
      tags: ["custom", "sprint"],
      builtIn: false,
      blocks: [
        createBlock("heading2", "Goals"),
        createBlock("todo", "Ship coverage", { checked: false }),
        createBlock("paragraph", ""),
      ],
    },
    onClose: fn(),
  },
};

export const Closed: Story = {
  args: {
    template: null,
    onClose: fn(),
  },
};
