import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CoverBanner } from "@/components/cover-banner";

const meta = {
  title: "Components/CoverBanner",
  component: CoverBanner,
  parameters: { layout: "fullscreen" },
  args: {
    onSetCoverColor: fn(),
    onSetCoverImage: fn(),
    onError: fn(),
    onSuccess: fn(),
  },
} satisfies Meta<typeof CoverBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {
  args: {
    coverColor: "from-amber-500/40 to-orange-700/25",
  },
};

export const ReadOnly: Story = {
  args: {
    coverColor: "from-sky-600/35 to-cyan-700/25",
    readOnly: true,
  },
};

export const Empty: Story = {
  args: {
    compactEmpty: true,
  },
};

export const Image: Story = {
  args: {
    coverImage: "https://picsum.photos/seed/notevault-banner/1600/500",
  },
};
