import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { KeyboardCheatSheet } from "./keyboard-cheat-sheet";

const meta = {
  title: "Components/KeyboardCheatSheet",
  component: KeyboardCheatSheet,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof KeyboardCheatSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
  },
};
