import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ImageViewer } from "@/components/image-viewer";

const meta = {
  title: "Components/ImageViewer",
  component: ImageViewer,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ImageViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    index: 0,
    onIndexChange: fn(),
    images: [
      {
        src: "https://picsum.photos/seed/notevault1/1200/800",
        alt: "Sample cover photo",
      },
      {
        src: "https://picsum.photos/seed/notevault2/1200/800",
        alt: "Second photo",
      },
    ],
  },
};

export const MultiImage: Story = {
  args: {
    open: true,
    onClose: fn(),
    index: 1,
    onIndexChange: fn(),
    images: [
      {
        src: "https://picsum.photos/seed/notevault1/1200/800",
        alt: "Harbor",
      },
      {
        src: "https://picsum.photos/seed/notevault2/1200/800",
        alt: "Forest path",
      },
      {
        src: "https://picsum.photos/seed/notevault3/1200/800",
        alt: "Desk setup",
      },
      {
        src: "https://picsum.photos/seed/notevault4/1200/800",
        alt: "Notebook",
      },
    ],
  },
};
