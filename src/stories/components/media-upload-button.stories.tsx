import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MediaUploadButton } from "@/components/media-upload-button";

const meta = {
  title: "Components/MediaUploadButton",
  component: MediaUploadButton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MediaUploadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: {
    accept: "image/*",
    label: "Upload image",
    onUploaded: fn(),
    onError: fn(),
  },
};

export const Disabled: Story = {
  args: {
    accept: "image/*,video/*",
    label: "Upload media",
    disabled: true,
    onUploaded: fn(),
  },
};

export const Video: Story = {
  args: {
    accept: "video/*",
    label: "Upload video",
    onUploaded: fn(),
    onError: fn(),
  },
};

export const File: Story = {
  args: {
    accept: "*/*",
    label: "Upload file",
    onUploaded: fn(),
    onError: fn(),
  },
};
