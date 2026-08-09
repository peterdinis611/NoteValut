import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SignInPage from "./page";

const meta = {
  title: "App/Routes/SignIn",
  component: SignInPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SignInPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
