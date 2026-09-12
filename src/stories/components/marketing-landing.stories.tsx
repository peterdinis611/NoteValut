import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MarketingLanding } from "@/components/marketing-landing";

const meta = {
  title: "App/MarketingLanding",
  component: MarketingLanding,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MarketingLanding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
