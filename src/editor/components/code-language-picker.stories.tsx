import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CodeLanguagePicker } from "./code-language-picker";

const meta = {
  title: "Editor/CodeLanguagePicker",
  component: CodeLanguagePicker,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeLanguagePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScript: Story = {
  args: {
    value: "typescript",
    onChange: fn(),
    onFocus: fn(),
  },
};

export const AutoDetected: Story = {
  args: {
    value: "auto",
    detected: "javascript",
    onChange: fn(),
    onFocus: fn(),
  },
};

export const Disabled: Story = {
  args: {
    value: "python",
    disabled: true,
    onChange: fn(),
  },
};
