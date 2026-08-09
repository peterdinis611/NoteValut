import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import NotAuthorizedPage from "./page";

const meta = {
  title: "App/Routes/NotAuthorized",
  component: NotAuthorizedPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NotAuthorizedPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
