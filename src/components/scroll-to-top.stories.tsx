import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollToTop } from "./scroll-to-top";

const meta = {
  title: "Components/ScrollToTop",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const TallContent: Story = {
  render: () => (
    <div className="app-main relative h-[100vh]">
      <div className="page-scroll h-full overflow-y-auto p-8">
        <h1 className="mb-4 text-xl font-semibold">Scroll down</h1>
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="mb-4 text-sm text-muted">
            Paragraph {i + 1}. Keep scrolling past ~280px to reveal the scroll-to-top control.
          </p>
        ))}
      </div>
      <ScrollToTop resetKey="story" />
    </div>
  ),
};
