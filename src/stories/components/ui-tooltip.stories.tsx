import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings2 } from "lucide-react";
import { UiTooltip } from "@/components/ui-tooltip";

const meta = {
  title: "Components/UiTooltip",
  component: UiTooltip,
  parameters: { layout: "centered" },
} satisfies Meta<typeof UiTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Settings",
    side: "bottom",
    children: (
      <button type="button" className="topbar-btn" aria-label="Settings">
        <Settings2 className="size-4" />
      </button>
    ),
  },
};

export const Top: Story = {
  args: {
    label: "Appears above",
    side: "top",
    children: (
      <button type="button" className="settings-btn">
        Hover me
      </button>
    ),
  },
};
