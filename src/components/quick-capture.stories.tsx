import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ownerId, sampleNotes } from "../../.storybook/fixtures";
import { QuickCapture, QuickCaptureFab } from "./quick-capture";

const meta = {
  title: "Components/QuickCapture",
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:list": sampleNotes(),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Open: Story = {
  render: () => (
    <QuickCapture
      ownerId={ownerId}
      open
      onClose={fn()}
      onCreated={fn()}
    />
  ),
};

export const Fab: Story = {
  render: () => (
    <div className="relative h-[50vh] bg-background">
      <QuickCaptureFab onClick={fn()} />
    </div>
  ),
};
