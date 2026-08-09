import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { VideoViewer, VideoViewerOverlay } from "./video-viewer";

const meta = {
  title: "Components/VideoViewer",
  component: VideoViewer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof VideoViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTube: Story = {
  args: {
    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Sample YouTube video",
    onToggleFullscreen: fn(),
  },
};

export const Compact: Story = {
  args: {
    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Compact embed",
    compact: true,
  },
};

export const Unsupported: Story = {
  args: {
    src: "not-a-video",
    title: "Bad URL",
  },
};

export const OverlayOpen: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-[50vh] bg-background p-6 text-sm text-muted">
      <p>Page content behind the video overlay.</p>
      <VideoViewerOverlay
        open
        onClose={fn()}
        src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        title="Overlay sample"
      />
    </div>
  ),
};
