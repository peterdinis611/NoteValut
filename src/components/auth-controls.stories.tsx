import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StorybookClerkState } from "@clerk/nextjs";
import { AuthControls } from "./auth-controls";

const meta = {
  title: "Components/AuthControls",
  component: AuthControls,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-3 border-t border-border bg-sidebar p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  args: { className: "" },
};

export const SignedOut: Story = {
  args: { className: "" },
  decorators: [
    (Story) => (
      <StorybookClerkState signedIn={false}>
        <Story />
      </StorybookClerkState>
    ),
  ],
};
