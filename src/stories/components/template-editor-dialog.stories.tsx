import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { TemplateEditorDialog } from "@/components/template-editor-dialog";

const meta = {
  title: "Components/TemplateEditorDialog",
  component: TemplateEditorDialog,
  args: {
    open: true,
    onClose: fn(),
    onSaved: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TemplateEditorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: { open: false },
};
