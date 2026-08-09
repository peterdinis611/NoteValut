import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SignUpPage from "./page";

const meta = {
  title: "App/Routes/SignUp",
  component: SignUpPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SignUpPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
