import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ShareLoading from "./loading";

const meta = {
  title: "App/Routes/ShareLoading",
  component: ShareLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ShareLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
