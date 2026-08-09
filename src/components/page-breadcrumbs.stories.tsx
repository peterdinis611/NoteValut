import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { breadcrumbCrumbs, noteId } from "../../.storybook/fixtures";
import { PageBreadcrumbs } from "./page-breadcrumbs";

const meta = {
  title: "Components/PageBreadcrumbs",
  component: PageBreadcrumbs,
  parameters: {
    layout: "padded",
    convex: {
      queries: {
        "notes:getBreadcrumbs": breadcrumbCrumbs,
      },
    },
  },
  args: {
    noteId: noteId(1),
    onNavigate: fn(),
  },
} satisfies Meta<typeof PageBreadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: { compact: true },
  decorators: [
    (Story) => (
      <div className="topbar flex items-center gap-2 border-b border-border px-3 py-2">
        <Story />
      </div>
    ),
  ],
};
