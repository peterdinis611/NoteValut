import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SignUpView } from "@/components/sign-up-view";

const meta = {
  title: "App/SignUpView",
  component: SignUpView,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SignUpView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
