import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { IconPicker } from "./icon-picker";

function ControlledIconPicker({
  size,
  initial = "📚",
}: {
  size?: "sm" | "lg";
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <IconPicker
      value={value}
      size={size}
      onChange={(icon) => {
        setValue(icon);
        fn()(icon);
      }}
    />
  );
}

const meta = {
  title: "Components/IconPicker",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <ControlledIconPicker />,
};

export const Small: Story = {
  render: () => <ControlledIconPicker size="sm" initial="🎨" />,
};
