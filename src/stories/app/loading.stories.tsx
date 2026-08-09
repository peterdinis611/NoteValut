import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Loading from "@/app/loading";

const meta = {
  title: "App/Routes/Loading",
  component: Loading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
