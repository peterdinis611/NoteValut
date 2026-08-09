import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SignInView } from "@/components/sign-in-view";

const meta = {
  title: "App/SignInView",
  component: SignInView,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SignInView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
