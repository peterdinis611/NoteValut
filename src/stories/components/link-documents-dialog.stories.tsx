import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { LinkDocumentsDialog } from "@/components/link-documents-dialog";
import { sampleNotes } from "../../../.storybook/fixtures";

const meta = {
  title: "Components/LinkDocumentsDialog",
  component: LinkDocumentsDialog,
  parameters: {
    layout: "fullscreen",
    convex: {
      mutations: {
        "notes:update": async () => "ok",
      },
    },
  },
} satisfies Meta<typeof LinkDocumentsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    notes: sampleNotes(),
    onNavigate: fn(),
    onOpenGraph: fn(),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
    notes: sampleNotes(),
  },
};
